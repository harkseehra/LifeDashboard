import { Header } from "@/components/dashboard/Header";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { GoalsSection } from "@/components/dashboard/GoalsSection";
import { AppointmentsSection } from "@/components/dashboard/AppointmentsSection";
import { PurchasesStub } from "@/components/dashboard/PurchasesStub";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import type { Task } from "@/lib/types";

export default async function DashboardPage() {
  let initialTasks: Task[] = [];

  try {
    const supabase = await createServerSupabaseClient();
    const { data } = await supabase
      .from("tasks")
      .select("*")
      .eq("completed", false)
      .order("created_at", { ascending: false });
    initialTasks = (data as Task[]) ?? [];
  } catch {
    // Supabase not configured yet — empty state renders gracefully
  }

  return (
    <main className="min-h-screen" style={{ background: "var(--bg-base)" }}>
      <div
        className="flex flex-col gap-6"
        style={{
          padding: "var(--page-top) var(--page-gutter) 60px",
        }}
      >
        <Header />
        <DashboardLayout
          initialTasks={initialTasks}
          goals={<GoalsSection />}
          right={
            <>
              <AppointmentsSection />
              <PurchasesStub />
            </>
          }
        />
      </div>
    </main>
  );
}
