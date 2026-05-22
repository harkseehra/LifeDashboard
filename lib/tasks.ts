import { createClient } from "./supabase";
import type { Task, NewTask } from "./types";

export async function addTask(
  task: NewTask
): Promise<{ data: Task | null; error: string | null }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { data: null, error: "Not authenticated" };

  const { data, error } = await supabase
    .from("tasks")
    .insert({
      user_id: user.id,
      title: task.title,
      due_date: task.due_date ?? null,
      priority: task.priority ?? 0,
      notes: task.notes ?? null,
      completed: false,
    })
    .select()
    .single();

  return { data, error: error?.message ?? null };
}

export async function completeTask(
  id: string
): Promise<{ error: string | null }> {
  const supabase = createClient();
  const { error } = await supabase
    .from("tasks")
    .update({ completed: true, completed_at: new Date().toISOString() })
    .eq("id", id);
  return { error: error?.message ?? null };
}

export async function uncompleteTask(
  id: string
): Promise<{ error: string | null }> {
  const supabase = createClient();
  const { error } = await supabase
    .from("tasks")
    .update({ completed: false, completed_at: null })
    .eq("id", id);
  return { error: error?.message ?? null };
}

export async function deleteTask(
  id: string
): Promise<{ error: string | null }> {
  const supabase = createClient();
  const { error } = await supabase.from("tasks").delete().eq("id", id);
  return { error: error?.message ?? null };
}
