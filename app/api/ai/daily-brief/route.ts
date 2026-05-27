import { NextResponse, NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(request: NextRequest) {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: "ANTHROPIC_API_KEY not configured" }, { status: 500 });
    }

    const { tasks_pending, appointments_today, goals_pending, today_spend, today_transactions } =
      await request.json() as {
        tasks_pending: number;
        appointments_today: { title: string; time: string }[];
        goals_pending: string[];
        today_spend: number | null;
        today_transactions: { name: string; amount: number }[];
      };

    const parts: string[] = [];
    if (tasks_pending > 0) parts.push(`${tasks_pending} task${tasks_pending > 1 ? "s" : ""} pending`);
    if (appointments_today.length > 0)
      parts.push(appointments_today.map(a => `${a.title} at ${a.time}`).join(", "));
    if (goals_pending.length > 0)
      parts.push(`goals not checked in: ${goals_pending.join(", ")}`);
    if (today_spend !== null && today_spend > 0)
      parts.push(`spent $${today_spend.toFixed(2)} today on ${today_transactions.slice(0, 3).map(t => t.name).join(", ")}`);

    if (parts.length === 0) {
      return NextResponse.json({ summary: "All clear today — nothing urgent on your plate." });
    }

    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 120,
      messages: [{
        role: "user",
        content: `Write a single, natural 1-sentence daily briefing for a personal dashboard. Be specific, friendly, and concise. Use the data below. No fluff, no greeting.

Data: ${parts.join("; ")}`,
      }],
    });

    const summary = (message.content[0] as { type: string; text: string }).text.trim();
    return NextResponse.json({ summary });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed" }, { status: 500 });
  }
}
