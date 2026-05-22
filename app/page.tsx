import { Header } from "@/components/dashboard/Header";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
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
    // Supabase not configured yet — render empty state
  }

  return (
    <main className="min-h-screen" style={{ background: "var(--bg-base)" }}>
      <div className="max-w-7xl mx-auto px-8 py-10 flex flex-col gap-6">
        <Header />
        <DashboardLayout
          initialTasks={initialTasks}
          right={
            <>
              {/* Today's Goals goes here in Phase 4 */}
              <AppointmentsSection />
              <PurchasesStub />
            </>
          }
        />
      </div>
    </main>
  );
}
