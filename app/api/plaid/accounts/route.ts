import { NextResponse } from "next/server";
import { plaidClient } from "@/lib/plaid";
import { createApiClient } from "@/lib/supabase-server";

export async function GET() {
  try {
    const supabase = createApiClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: items } = await supabase
      .from("plaid_items")
      .select("access_token, institution_name")
      .eq("user_id", user.id);

    if (!items || items.length === 0) return NextResponse.json({ accounts: [] });

    const allAccounts = await Promise.all(
      items.map(async (item) => {
        const res = await plaidClient.accountsGet({ access_token: item.access_token });
        return res.data.accounts.map((a) => ({
          account_id: a.account_id,
          name: a.name,
          official_name: a.official_name ?? null,
          type: a.type,
          subtype: a.subtype ?? null,
          balance_current: a.balances.current ?? 0,
          balance_available: a.balances.available ?? null,
          iso_currency_code: a.balances.iso_currency_code ?? "CAD",
          institution_name: item.institution_name,
        }));
      })
    );

    return NextResponse.json({ accounts: allAccounts.flat() });
  } catch (err: unknown) {
    const plaidError = (err as { response?: { data?: { error_message?: string; error_code?: string } } })?.response?.data;
    if (plaidError?.error_message) {
      return NextResponse.json({ error: `${plaidError.error_code}: ${plaidError.error_message}` }, { status: 400 });
    }
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed to fetch accounts" }, { status: 500 });
  }
}
