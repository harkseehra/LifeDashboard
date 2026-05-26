import { NextResponse, NextRequest } from "next/server";
import { plaidClient } from "@/lib/plaid";
import { createApiClient } from "@/lib/supabase-server";
import { format, subDays } from "date-fns";

export async function GET(request: NextRequest) {
  try {
    const supabase = createApiClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: items } = await supabase
      .from("plaid_items")
      .select("access_token, institution_name")
      .eq("user_id", user.id);

    if (!items || items.length === 0) return NextResponse.json({ transactions: [] });

    const daysParam = parseInt(request.nextUrl.searchParams.get("days") ?? "30", 10);
    const days = [30, 60, 90].includes(daysParam) ? daysParam : 30;
    const startDate = format(subDays(new Date(), days), "yyyy-MM-dd");
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
          transaction_id: t.transaction_id,
          name: t.name,
          merchant_name: t.merchant_name ?? null,
          amount: t.amount,
          date: t.date,
          // Legacy category array (may be null in newer API)
          category: t.category ?? null,
          // New personal_finance_category (primary code like FOOD_AND_DRINK)
          pfc_primary: t.personal_finance_category?.primary ?? null,
          pfc_detailed: t.personal_finance_category?.detailed ?? null,
          pending: t.pending,
          institution_name: item.institution_name,
        }));
      })
    );

    return NextResponse.json({ transactions: allTransactions.flat() });
  } catch (err: unknown) {
    const plaidError = (err as { response?: { data?: { error_message?: string; error_code?: string } } })?.response?.data;
    if (plaidError?.error_message) {
      return NextResponse.json({ error: `${plaidError.error_code}: ${plaidError.error_message}` }, { status: 400 });
    }
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed to fetch transactions" }, { status: 500 });
  }
}
