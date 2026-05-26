import { NextResponse } from "next/server";
import { plaidClient } from "@/lib/plaid";
import { createApiClient } from "@/lib/supabase-server";
import { CountryCode, Products } from "plaid";

export async function POST() {
  try {
    const supabase = createApiClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (!process.env.PLAID_CLIENT_ID || !process.env.PLAID_SECRET) {
      return NextResponse.json({ error: "Add PLAID_CLIENT_ID and PLAID_SECRET to your Vercel environment variables." }, { status: 500 });
    }

    const response = await plaidClient.linkTokenCreate({
      user: { client_user_id: user.id },
      client_name: "Life Dashboard",
      products: [Products.Transactions],
      country_codes: [CountryCode.Ca, CountryCode.Us],
      language: "en",
    });

    return NextResponse.json({ link_token: response.data.link_token });
  } catch (err: unknown) {
    // Extract the real Plaid error message from the axios response
    const plaidError = (err as { response?: { data?: { error_message?: string; error_code?: string } } })?.response?.data;
    if (plaidError?.error_message) {
      return NextResponse.json(
        { error: `Plaid: ${plaidError.error_code} — ${plaidError.error_message}` },
        { status: 400 }
      );
    }
    const message = err instanceof Error ? err.message : "Failed to create link token";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
