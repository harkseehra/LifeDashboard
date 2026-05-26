import { NextResponse } from "next/server";
import { plaidClient } from "@/lib/plaid";
import { createApiClient } from "@/lib/supabase-server";
import Anthropic from "@anthropic-ai/sdk";
import { format, subDays } from "date-fns";
import type { WishlistItem, SavingsAdvice } from "@/lib/types";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function GET() {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: "ANTHROPIC_API_KEY not configured" }, { status: 500 });
    }

    const supabase = createApiClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // 1. Fetch wishlist
    const { data: wishlistRows } = await supabase
      .from("wishlist_items")
      .select("*")
      .eq("user_id", user.id)
      .order("priority");
    const wishlist: WishlistItem[] = (wishlistRows as WishlistItem[]) ?? [];

    // 2. Fetch Plaid items
    const { data: plaidItems } = await supabase
      .from("plaid_items")
      .select("access_token, institution_name")
      .eq("user_id", user.id);

    let totalBalance = 0;
    const transactions: { name: string; amount: number; date: string; category: string | null }[] = [];

    if (plaidItems && plaidItems.length > 0) {
      // Fetch balances
      const accountResults = await Promise.allSettled(
        plaidItems.map((item) => plaidClient.accountsGet({ access_token: item.access_token }))
      );
      for (const r of accountResults) {
        if (r.status === "fulfilled") {
          for (const a of r.value.data.accounts) {
            // Only count checking/savings/depository balances
            if (a.type === "depository") {
              totalBalance += a.balances.current ?? 0;
            }
          }
        }
      }

      // Fetch 90 days of transactions
      const startDate = format(subDays(new Date(), 90), "yyyy-MM-dd");
      const endDate = format(new Date(), "yyyy-MM-dd");

      const txResults = await Promise.allSettled(
        plaidItems.map((item) =>
          plaidClient.transactionsGet({
            access_token: item.access_token,
            start_date: startDate,
            end_date: endDate,
            options: { count: 500, offset: 0 },
          })
        )
      );

      for (const r of txResults) {
        if (r.status === "fulfilled") {
          for (const t of r.value.data.transactions) {
            if (!t.pending) {
              transactions.push({
                name: t.merchant_name ?? t.name,
                amount: t.amount,
                date: t.date,
                category: t.personal_finance_category?.primary ?? (t.category?.[0] ?? null),
              });
            }
          }
        }
      }
    }

    // 3. Build context for Claude
    const expenseTxs = transactions.filter((t) => t.amount > 0);
    const incomeTxs = transactions.filter((t) => t.amount < 0);

    const totalExpenses = expenseTxs.reduce((s, t) => s + t.amount, 0);
    const totalIncome = Math.abs(incomeTxs.reduce((s, t) => s + t.amount, 0));
    const monthlyExpenses = totalExpenses / 3;
    const monthlyIncome = totalIncome / 3;
    const monthlySavings = monthlyIncome - monthlyExpenses;

    const txSummary = expenseTxs
      .slice(0, 80)
      .map((t) => `${t.date} | ${t.name} | $${t.amount.toFixed(2)} | ${t.category ?? "Unknown"}`)
      .join("\n");

    const wishlistSummary = wishlist.length > 0
      ? wishlist.map((w, i) =>
          `${i + 1}. [id:${w.id}] ${w.emoji} ${w.title} — $${w.estimated_cost.toLocaleString()} (priority ${w.priority})`
        ).join("\n")
      : "No wishlist items.";

    const prompt = `You are a personal finance advisor. Analyze this person's finances and give concrete, actionable advice.

FINANCIAL SNAPSHOT (last 90 days):
- Current bank balance: $${totalBalance.toFixed(2)}
- Monthly income (avg): $${monthlyIncome.toFixed(2)}
- Monthly expenses (avg): $${monthlyExpenses.toFixed(2)}
- Monthly savings (avg): $${monthlySavings.toFixed(2)}

RECENT TRANSACTIONS (up to 80, last 90 days):
${txSummary || "No transaction data available."}

WISHLIST (by priority):
${wishlistSummary}

Respond with ONLY a valid JSON object (no markdown, no explanation) matching this exact structure:
{
  "monthly_income": <number>,
  "monthly_expenses": <number>,
  "monthly_savings": <number>,
  "top_categories": [
    { "category": "<name>", "monthly_avg": <number> }
  ],
  "recurring_bills": [
    { "name": "<service>", "monthly_amount": <number>, "cancellable": <boolean> }
  ],
  "wishlist_advice": [
    {
      "id": "<wishlist item id>",
      "title": "<title>",
      "cost": <number>,
      "months_current": <months at current savings rate>,
      "months_optimized": <months if quick wins applied>,
      "message": "<1-2 sentence personalized advice>"
    }
  ],
  "quick_wins": ["<specific actionable tip>", ...],
  "summary": "<2-3 sentence overall financial summary with key insight>"
}

Rules:
- top_categories: top 5 spending categories with real monthly averages from the data
- recurring_bills: identify subscriptions/recurring charges (Netflix, Spotify, gym, etc.) — mark cancellable true if they seem optional
- wishlist_advice: for EACH wishlist item calculate realistic months to save. If no wishlist items, return []
- quick_wins: 3-5 specific, actionable tips based on ACTUAL spending patterns you see
- Be direct and specific. Name actual merchants. Use real numbers from the data.
- If no bank data, still give useful generic advice based on wishlist alone`;

    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2048,
      messages: [{ role: "user", content: prompt }],
    });

    const raw = (message.content[0] as { type: string; text: string }).text.trim();
    const json = raw.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    const advice: SavingsAdvice = JSON.parse(json);

    return NextResponse.json({ advice, wishlist });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to generate advice";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
