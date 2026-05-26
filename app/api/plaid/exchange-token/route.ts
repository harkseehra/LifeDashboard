import { NextResponse, NextRequest } from "next/server";
import { plaidClient } from "@/lib/plaid";
import { createApiClient } from "@/lib/supabase-server";

export async function POST(request: NextRequest) {
  try {
    const { public_token, institution_name } = await request.json() as {
      public_token: string;
      institution_name?: string;
    };

    const supabase = createApiClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const tokenResponse = await plaidClient.itemPublicTokenExchange({ public_token });
    const { access_token, item_id } = tokenResponse.data;

    const { error } = await supabase.from("plaid_items").upsert({
      user_id: user.id,
      item_id,
      access_token,
      institution_name: institution_name ?? "Bank",
    }, { onConflict: "item_id" });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to exchange token";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
