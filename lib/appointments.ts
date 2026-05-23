import { createClient } from "./supabase";
import type { Appointment, NewAppointment } from "./types";

export async function addAppointment(
  appt: NewAppointment
): Promise<{ data: Appointment | null; error: string | null }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { data: null, error: "Not authenticated" };

  const { data, error } = await supabase
    .from("appointments")
    .insert({
      user_id: user.id,
      title: appt.title,
      starts_at: appt.starts_at,
      ends_at: appt.ends_at ?? null,
      location: appt.location ?? null,
      notes: appt.notes ?? null,
    })
    .select()
    .single();

  return { data, error: error?.message ?? null };
}

export async function deleteAppointment(
  id: string
): Promise<{ error: string | null }> {
  const supabase = createClient();
  const { error } = await supabase.from("appointments").delete().eq("id", id);
  return { error: error?.message ?? null };
}
