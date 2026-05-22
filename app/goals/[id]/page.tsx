import Link from "next/link";

export default function GoalDetailPage() {
  return (
    <main className="min-h-screen" style={{ background: "var(--bg-base)" }}>
      <div className="max-w-2xl mx-auto px-6 py-10 flex flex-col gap-8">
        <div className="flex items-center gap-4">
          <Link href="/goals" className="type-small" style={{ color: "var(--accent)" }}>
            ← Goals
          </Link>
        </div>
        <h1 className="type-display">Goal Detail</h1>
        <div className="card px-6 py-8">
          <p className="type-body text-center" style={{ color: "var(--text-secondary)" }}>
            Coming in Phase 4.
          </p>
        </div>
      </div>
    </main>
  );
}
