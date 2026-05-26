import { NextResponse, NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(request: NextRequest) {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: "ANTHROPIC_API_KEY not configured" }, { status: 500 });
    }

    const { transactions } = await request.json() as {
      transactions: { id: string; name: string; merchant_name: string | null; amount: number }[];
    };

    if (!transactions?.length) return NextResponse.json({ categories: {} });

    const list = transactions
      .map((t) => `${t.id}: ${t.merchant_name ?? t.name} ($${Math.abs(t.amount).toFixed(2)})`)
      .join("\n");

    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: `Categorize each transaction below. Return ONLY a valid JSON object — no markdown, no explanation.

Format: { "transaction_id": { "emoji": "🍔", "label": "Food" } }

Categories to use: Food, Coffee, Groceries, Gas, Transport, Travel, Shopping, Entertainment, Health, Pharmacy, Rent, Utilities, Phone, Internet, Subscriptions, Education, Finance, Income, Other

Transactions:
${list}`,
        },
      ],
    });

    const raw = (message.content[0] as { type: string; text: string }).text.trim();
    // Strip markdown code fences if Claude adds them
    const json = raw.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    const categories = JSON.parse(json);

    return NextResponse.json({ categories });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Categorization failed" },
      { status: 500 }
    );
  }
}
