import { Header } from "@/components/dashboard/Header";
import { DashboardTasks } from "@/components/dashboard/DashboardTasks";
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
      <div className="max-w-2xl mx-auto px-6 py-10 flex flex-col gap-8">
        <Header />
        <DashboardTasks initialTasks={initialTasks} />
        {/* Today's Goals — hidden until Phase 4 */}
        <AppointmentsSection />
        <PurchasesStub />
      </div>
    </main>
  );
}
