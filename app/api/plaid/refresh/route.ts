import { NextResponse } from "next/server";
import { plaidClient } from "@/lib/plaid";
import { createApiClient } from "@/lib/supabase-server";

export async function POST() {
  try {
    const supabase = createApiClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: items } = await supabase
      .from("plaid_items")
      .select("access_token")
      .eq("user_id", user.id);

    if (!items || items.length === 0) return NextResponse.json({ refreshed: 0 });

    await Promise.all(
      items.map((item) =>
        plaidClient.transactionsRefresh({ access_token: item.access_token }).catch(() => {})
      )
    );

    return NextResponse.json({ refreshed: items.length });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to refresh" },
      { status: 500 }
    );
  }
}
