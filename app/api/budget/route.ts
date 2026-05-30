import { NextResponse, NextRequest } from "next/server";
import { createApiClient } from "@/lib/supabase-server";

export async function GET() {
  try {
    const supabase = createApiClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data } = await supabase
      .from("budget_items")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at");

    return NextResponse.json({ items: data ?? [] });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createApiClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { name, amount, type } = await request.json() as { name: string; amount: number; type: string };

    // Upsert by name + type (case-insensitive)
    const { data: existing } = await supabase
      .from("budget_items")
      .select("id")
      .eq("user_id", user.id)
      .ilike("name", name)
      .eq("type", type)
      .maybeSingle();

    if (existing) {
      const { data } = await supabase
        .from("budget_items")
        .update({ amount })
        .eq("id", existing.id)
        .select()
        .single();
      return NextResponse.json({ item: data, updated: true });
    }

    const { data } = await supabase
      .from("budget_items")
      .insert({ name, amount, type, user_id: user.id })
      .select()
      .single();
    return NextResponse.json({ item: data, updated: false });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed" }, { status: 500 });
  }
}
