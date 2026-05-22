import { Header } from "@/components/dashboard/Header";
import { QuickCapture } from "@/components/dashboard/QuickCapture";
import { TasksSection } from "@/components/dashboard/TasksSection";
import { AppointmentsSection } from "@/components/dashboard/AppointmentsSection";
import { PurchasesStub } from "@/components/dashboard/PurchasesStub";

export default function DashboardPage() {
  return (
    <main className="min-h-screen" style={{ background: "var(--bg-base)" }}>
      <div className="max-w-2xl mx-auto px-6 py-10 flex flex-col gap-8">
        <Header />
        <QuickCapture />
        {/* Today's Goals renders only when goals are scheduled — hidden until Phase 4 */}
        <TasksSection />
        <AppointmentsSection />
        <PurchasesStub />
      </div>
    </main>
  );
}
