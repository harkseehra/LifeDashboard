import { NextResponse, NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(request: NextRequest) {
  try {
    if (!process.env.ANTHROPIC_API_KEY) return NextResponse.json({ emoji: null });

    const { title } = await request.json() as { title: string };
    if (!title?.trim()) return NextResponse.json({ emoji: null });

    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 8,
      messages: [{
        role: "user",
        content: `Pick one emoji that best represents this task. Reply with just the emoji character — nothing else.

Task: ${title.trim()}`,
      }],
    });

    const raw = (message.content[0] as { type: string; text: string }).text.trim();
    // Take first codepoint cluster — Array.from handles multi-byte emoji
    const first = Array.from(raw)[0] ?? null;
    return NextResponse.json({ emoji: first });
  } catch {
    return NextResponse.json({ emoji: null });
  }
}
