import { NextResponse } from "next/server";
import { plaidClient } from "@/lib/plaid";
import { createApiClient } from "@/lib/supabase-server";
import { format, subDays } from "date-fns";

export async function GET() {
  try {
    const supabase = createApiClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: items } = await supabase
      .from("plaid_items")
      .select("access_token, institution_name")
      .eq("user_id", user.id);

    if (!items || items.length === 0) return NextResponse.json({ transactions: [] });

    const startDate = format(subDays(new Date(), 30), "yyyy-MM-dd");
    const endDate = format(new Date(), "yyyy-MM-dd");

    const allTransactions = await Promise.all(
      items.map(async (item) => {
        const res = await plaidClient.transactionsGet({
          access_token: item.access_token,
          start_date: startDate,
          end_date: endDate,
          options: { count: 100, offset: 0 },
        });
        return res.data.transactions.map((t) => ({
          ...t,
          institution_name: item.institution_name,
        }));
      })
    );

    return NextResponse.json({ transactions: allTransactions.flat() });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch transactions";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
