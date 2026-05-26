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
      return NextResponse.json({ error: "Plaid credentials not configured" }, { status: 500 });
    }

    const response = await plaidClient.linkTokenCreate({
      user: { client_user_id: user.id },
      client_name: "Life Dashboard",
      products: [Products.Transactions],
      country_codes: [CountryCode.Us, CountryCode.Ca, CountryCode.Gb],
      language: "en",
    });

    return NextResponse.json({ link_token: response.data.link_token });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create link token";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
