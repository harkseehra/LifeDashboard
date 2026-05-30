import { NextResponse, NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createApiClient } from "@/lib/supabase-server";
import { format, getDaysInMonth } from "date-fns";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface BudgetItem {
  id: string;
  name: string;
  amount: number;
  type: "recurring" | "one_time";
}

interface BudgetAction {
  type: "upserted" | "removed";
  item: { id?: string; name: string; amount?: number; itemType?: string };
}

const TOOLS: Anthropic.Tool[] = [
  {
    name: "upsert_budget_items",
    description:
      "Add or update budget items in the overview. Call this immediately when the user mentions any budget amount, expense, or financial commitment. " +
      "'recurring' = monthly expense (rent, food, phone, subscriptions). " +
      "'one_time' = irregular or one-off expense (lawyer, car repair, medical bill, etc.).",
    input_schema: {
      type: "object" as const,
      properties: {
        items: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string", description: "Clear expense name, e.g. 'Rent', 'Groceries', 'Lawyer fee'" },
              amount: { type: "number", description: "Amount in dollars" },
              type: { type: "string", enum: ["recurring", "one_time"] },
            },
            required: ["name", "amount", "type"],
          },
        },
      },
      required: ["items"],
    },
  },
  {
    name: "remove_budget_item",
    description: "Remove a budget item by its ID when the user asks to delete or remove it.",
    input_schema: {
      type: "object" as const,
      properties: {
        id: { type: "string", description: "The ID of the budget item to remove" },
      },
      required: ["id"],
    },
  },
];

export async function POST(request: NextRequest) {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: "ANTHROPIC_API_KEY not configured" }, { status: 500 });
    }

    const supabase = createApiClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // bankBalance comes from the client — avoids a slow Plaid round-trip on every message
    const { messages, newMessage, bankBalance: clientBankBalance } = await request.json() as {
      messages: ChatMessage[];
      newMessage: string;
      bankBalance: number | null;
    };

    // ── Budget items from DB ──────────────────────────────────────────────────

    const { data: budgetItems } = await supabase
      .from("budget_items")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at");

    const items = (budgetItems ?? []) as BudgetItem[];
    const recurring = items.filter((i) => i.type === "recurring");
    const oneTime = items.filter((i) => i.type === "one_time");
    const recurringTotal = recurring.reduce((s, i) => s + i.amount, 0);
    const oneTimeTotal = oneTime.reduce((s, i) => s + i.amount, 0);

    const bankBalance: number | null = typeof clientBankBalance === "number" ? clientBankBalance : null;

    // ── Date context ──────────────────────────────────────────────────────────

    const today = new Date();
    const dayOfMonth = today.getDate();
    const daysInMonth = getDaysInMonth(today);
    const daysLeft = daysInMonth - dayOfMonth;
    const monthName = format(today, "MMMM yyyy");

    // ── System prompt ─────────────────────────────────────────────────────────

    const budgetListStr = recurring.length > 0
      ? recurring.map((i) => `  • ${i.name}: $${i.amount.toFixed(2)} (id: ${i.id})`).join("\n")
      : "  (none set yet)";

    const oneTimeListStr = oneTime.length > 0
      ? oneTime.map((i) => `  • ${i.name}: $${i.amount.toFixed(2)} (id: ${i.id})`).join("\n")
      : "  (none set yet)";

    const expectedOutflow = recurringTotal + oneTimeTotal;
    const netPosition = bankBalance !== null ? bankBalance - expectedOutflow : null;

    const systemPrompt = `You are a sharp, practical AI financial adviser embedded in a personal life dashboard.

TODAY: ${format(today, "EEEE, MMMM d, yyyy")} — Day ${dayOfMonth} of ${daysInMonth} (${daysLeft} days left in ${monthName}).

CURRENT FINANCIAL SNAPSHOT:
${bankBalance !== null ? `• Bank balance: $${bankBalance.toFixed(2)}` : "• Bank balance: not connected"}

BUDGET OVERVIEW:
Monthly recurring expenses (total: $${recurringTotal.toFixed(2)}):
${budgetListStr}

One-time / irregular expenses (total: $${oneTimeTotal.toFixed(2)}):
${oneTimeListStr}

Expected total outflow: $${expectedOutflow.toFixed(2)}
${netPosition !== null ? `Net position (balance − outflow): ${netPosition >= 0 ? "+" : ""}$${netPosition.toFixed(2)} ${netPosition < 0 ? "⚠️ SHORTFALL" : "✓"}` : ""}

INSTRUCTIONS:
1. When the user mentions budget items or expenses (e.g. "rent is $700", "I have a lawyer bill for $1000"), immediately call upsert_budget_items — don't ask for confirmation.
2. Use 'recurring' for monthly expenses (rent, food, subscriptions, phone, utilities). Use 'one_time' for irregular costs (lawyer, medical, repairs, travel, registration fees).
3. After adding items, briefly acknowledge what you added, then give a concrete insight or advice based on the full financial picture.
4. When advising: be specific with numbers, not generic. Point at the actual gap or surplus.
5. If month-end is approaching (< 7 days left), flag any cashflow concerns proactively.
6. Be concise — 2-4 sentences for routine updates, up to 8 for detailed advice. No bullet-point walls.
7. You are direct and candid. If the numbers look tight, say so plainly.`;

    // ── Agentic tool-use loop ─────────────────────────────────────────────────

    const actions: BudgetAction[] = [];

    const claudeMessages: Anthropic.MessageParam[] = [
      ...messages.map((m) => ({ role: m.role, content: m.content })),
      { role: "user", content: newMessage },
    ];

    let response: Anthropic.Message;

    while (true) {
      response = await client.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1024,
        system: systemPrompt,
        tools: TOOLS,
        messages: claudeMessages,
      });

      if (response.stop_reason !== "tool_use") break;

      const assistantContent = response.content;
      claudeMessages.push({ role: "assistant", content: assistantContent });

      const toolResults: Anthropic.ToolResultBlockParam[] = [];

      for (const block of assistantContent) {
        if (block.type !== "tool_use") continue;

        if (block.name === "upsert_budget_items") {
          const { items: newItems } = block.input as {
            items: { name: string; amount: number; type: "recurring" | "one_time" }[];
          };

          const results: BudgetItem[] = [];

          for (const item of newItems) {
            const { data: existing } = await supabase
              .from("budget_items")
              .select("id")
              .eq("user_id", user.id)
              .ilike("name", item.name)
              .eq("type", item.type)
              .maybeSingle();

            let saved: BudgetItem | null = null;

            if (existing) {
              const { data } = await supabase
                .from("budget_items")
                .update({ amount: item.amount })
                .eq("id", existing.id)
                .select()
                .single();
              saved = data as BudgetItem | null;
            } else {
              const { data } = await supabase
                .from("budget_items")
                .insert({ ...item, user_id: user.id })
                .select()
                .single();
              saved = data as BudgetItem | null;
            }

            if (saved) {
              results.push(saved);
              actions.push({ type: "upserted", item: { id: saved.id, name: saved.name, amount: saved.amount, itemType: saved.type } });
            } else {
              // DB write failed — record intent so UI still shows the chip
              actions.push({ type: "upserted", item: { name: item.name, amount: item.amount, itemType: item.type } });
            }
          }

          toolResults.push({
            type: "tool_result",
            tool_use_id: block.id,
            content: JSON.stringify({ success: results.length > 0, items: results }),
          });
        }

        if (block.name === "remove_budget_item") {
          const { id } = block.input as { id: string };
          const { data: removed } = await supabase
            .from("budget_items")
            .delete()
            .eq("id", id)
            .eq("user_id", user.id)
            .select()
            .single();

          actions.push({ type: "removed", item: { id, name: (removed as BudgetItem | null)?.name ?? id } });

          toolResults.push({
            type: "tool_result",
            tool_use_id: block.id,
            content: JSON.stringify({ success: true }),
          });
        }
      }

      claudeMessages.push({ role: "user", content: toolResults });
    }

    const reply = response!.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("");

    return NextResponse.json({ reply, actions });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed" },
      { status: 500 }
    );
  }
}
