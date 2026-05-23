import { Header } from "@/components/dashboard/Header";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { GoalsSection } from "@/components/dashboard/GoalsSection";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import type { Task, Appointment } from "@/lib/types";

export default async function DashboardPage() {
  let initialTasks: Task[] = [];
  let initialAppointments: Appointment[] = [];

  try {
    const supabase = await createServerSupabaseClient();

    const [tasksRes, apptsRes] = await Promise.all([
      supabase
        .from("tasks")
        .select("*")
        .eq("completed", false)
        .order("created_at", { ascending: false }),
      supabase
        .from("appointments")
        .select("*")
        .gte("starts_at", new Date(new Date().setHours(0, 0, 0, 0)).toISOString())
        .lte(
          "starts_at",
          new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
        )
        .order("starts_at"),
    ]);

    initialTasks = (tasksRes.data as Task[]) ?? [];
    initialAppointments = (apptsRes.data as Appointment[]) ?? [];
  } catch {
    // Supabase not configured yet — empty state renders gracefully
  }

  return (
    <main className="min-h-screen" style={{ background: "var(--bg-base)" }}>
      <div
        className="flex flex-col gap-6"
        style={{ padding: "var(--page-top) var(--page-gutter) 60px" }}
      >
        <Header />
        <DashboardLayout
          initialTasks={initialTasks}
          initialAppointments={initialAppointments}
          goals={<GoalsSection />}
        />
      </div>
    </main>
  );
}
