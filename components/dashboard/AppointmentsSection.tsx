import Link from "next/link";

export function AppointmentsSection() {
  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="type-section">Appointments</h2>
        <Link
          href="/calendar"
          className="type-small transition-colors duration-150"
          style={{ color: "var(--accent)" }}
        >
          View calendar →
        </Link>
      </div>
      <div className="card px-6 py-8">
        <p
          className="type-body text-center"
          style={{ color: "var(--text-secondary)" }}
        >
          Nothing on the books.
        </p>
      </div>
    </section>
  );
}
