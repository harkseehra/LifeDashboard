import { createClient } from "@/lib/supabase";

export type BudgetItemType = "recurring" | "one_time";

export interface BudgetItem {
  id: string;
  user_id: string;
  name: string;
  amount: number;
  type: BudgetItemType;
  created_at: string;
}

export interface NewBudgetItem {
  name: string;
  amount: number;
  type: BudgetItemType;
}

export async function getBudgetItems(): Promise<BudgetItem[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("budget_items")
    .select("*")
    .order("created_at");
  return (data as BudgetItem[]) ?? [];
}

export async function upsertBudgetItem(
  item: NewBudgetItem
): Promise<{ data: BudgetItem | null; error: string | null }> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: "Not authenticated" };

  // Upsert by name (case-insensitive match)
  const { data: existing } = await supabase
    .from("budget_items")
    .select("id")
    .eq("user_id", user.id)
    .ilike("name", item.name)
    .eq("type", item.type)
    .maybeSingle();

  if (existing) {
    const { data, error } = await supabase
      .from("budget_items")
      .update({ amount: item.amount })
      .eq("id", existing.id)
      .select()
      .single();
    return { data: data as BudgetItem, error: error?.message ?? null };
  }

  const { data, error } = await supabase
    .from("budget_items")
    .insert({ ...item, user_id: user.id })
    .select()
    .single();
  return { data: data as BudgetItem, error: error?.message ?? null };
}

export async function deleteBudgetItem(
  id: string
): Promise<{ error: string | null }> {
  const supabase = createClient();
  const { error } = await supabase.from("budget_items").delete().eq("id", id);
  return { error: error?.message ?? null };
}
