import { createClient } from "./supabase";
import { format, subDays, parseISO } from "date-fns";
import type { Goal, NewGoal } from "./types";

export async function getGoals(): Promise<{ data: Goal[]; error: string | null }> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("goals")
    .select("*")
    .order("sort_order");
  return { data: (data as Goal[]) ?? [], error: error?.message ?? null };
}

export async function addGoal(
  goal: NewGoal
): Promise<{ data: Goal | null; error: string | null }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { data: null, error: "Not authenticated" };

  const { data, error } = await supabase
    .from("goals")
    .insert({
      user_id: user.id,
      title: goal.title,
      emoji: goal.emoji ?? "🌱",
    })
    .select()
    .single();

  return { data, error: error?.message ?? null };
}

export async function updateGoal(
  id: string,
  patch: Partial<Pick<Goal, "title" | "emoji" | "sort_order">>
): Promise<{ error: string | null }> {
  const supabase = createClient();
  const { error } = await supabase.from("goals").update(patch).eq("id", id);
  return { error: error?.message ?? null };
}

export async function deleteGoal(id: string): Promise<{ error: string | null }> {
  const supabase = createClient();
  const { error } = await supabase.from("goals").delete().eq("id", id);
  return { error: error?.message ?? null };
}

export async function checkInGoal(
  goalId: string,
  date: string,
  notes?: string
): Promise<{ error: string | null }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase.from("goal_check_ins").upsert(
    { goal_id: goalId, user_id: user.id, checked_in_on: date, notes: notes ?? null },
    { onConflict: "goal_id,checked_in_on" }
  );
  return { error: error?.message ?? null };
}

export async function getCheckIns(
  goalId: string
): Promise<{ data: string[]; error: string | null }> {
  const supabase = createClient();
  const cutoff = format(subDays(new Date(), 400), "yyyy-MM-dd");
  const { data, error } = await supabase
    .from("goal_check_ins")
    .select("checked_in_on")
    .eq("goal_id", goalId)
    .gte("checked_in_on", cutoff)
    .order("checked_in_on", { ascending: false });

  return {
    data: (data ?? []).map((r: { checked_in_on: string }) => r.checked_in_on),
    error: error?.message ?? null,
  };
}

export function calculateStreak(dates: string[]): number {
  if (dates.length === 0) return 0;
  const sorted = [...dates].sort().reverse();
  const today = format(new Date(), "yyyy-MM-dd");
  const yesterday = format(subDays(new Date(), 1), "yyyy-MM-dd");
  if (sorted[0] !== today && sorted[0] !== yesterday) return 0;

  let streak = 0;
  let expected = sorted[0];
  for (const date of sorted) {
    if (date === expected) {
      streak++;
      expected = format(subDays(parseISO(expected), 1), "yyyy-MM-dd");
    } else break;
  }
  return streak;
}
