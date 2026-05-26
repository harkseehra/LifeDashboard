import { createClient } from "./supabase";
import type { WishlistItem } from "./types";

export async function getWishlist(): Promise<{ data: WishlistItem[]; error: string | null }> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("wishlist_items")
    .select("*")
    .order("priority");
  return { data: (data as WishlistItem[]) ?? [], error: error?.message ?? null };
}

export async function addWishlistItem(item: {
  title: string;
  estimated_cost: number;
  priority: number;
  emoji: string;
  notes?: string | null;
}): Promise<{ data: WishlistItem | null; error: string | null }> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: "Not authenticated" };

  const { data, error } = await supabase
    .from("wishlist_items")
    .insert({ ...item, user_id: user.id })
    .select()
    .single();

  return { data: data as WishlistItem | null, error: error?.message ?? null };
}

export async function deleteWishlistItem(id: string): Promise<{ error: string | null }> {
  const supabase = createClient();
  const { error } = await supabase.from("wishlist_items").delete().eq("id", id);
  return { error: error?.message ?? null };
}

export async function updateWishlistItem(
  id: string,
  patch: Partial<Pick<WishlistItem, "title" | "estimated_cost" | "priority" | "emoji" | "notes">>
): Promise<{ error: string | null }> {
  const supabase = createClient();
  const { error } = await supabase.from("wishlist_items").update(patch).eq("id", id);
  return { error: error?.message ?? null };
}
