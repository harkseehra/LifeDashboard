import Link from "next/link";
import { MapPin } from "lucide-react";

// Mock appointments — replaced with Supabase data in Phase 3
const MOCK_APPOINTMENTS = [
  {
    id: "1",
    title: "Dentist checkup",
    location: "123 Elm Street",
    time: "3:00 PM",
    dateLabel: "Today",
    isToday: true,
  },
  {
    id: "2",
    title: "Team standup",
    location: null,
    time: "10:00 AM",
    dateLabel: "May 25",
    isToday: false,
  },
  {
    id: "3",
    title: "Haircut",
    location: "King & John",
    time: "2:00 PM",
    dateLabel: "May 27",
    isToday: false,
  },
];

export function AppointmentsSection() {
  const today = MOCK_APPOINTMENTS.filter((a) => a.isToday);
  const upcoming = MOCK_APPOINTMENTS.filter((a) => !a.isToday);

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

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        {today.length > 0 && (
          <div>
            <div className="px-5 pt-4 pb-1">
              <span className="type-caption">Today</span>
            </div>
            {today.map((appt, i) => (
              <AppointmentRow
                key={appt.id}
                appt={appt}
                showDivider={i < today.length - 1 || upcoming.length > 0}
              />
            ))}
          </div>
        )}

        {upcoming.length > 0 && (
          <div>
            <div className="px-5 pt-4 pb-1">
              <span className="type-caption">Upcoming</span>
            </div>
            {upcoming.map((appt, i) => (
              <AppointmentRow
                key={appt.id}
                appt={appt}
                showDivider={i < upcoming.length - 1}
              />
            ))}
          </div>
        )}

        {today.length === 0 && upcoming.length === 0 && (
          <div className="px-5 py-8">
            <p className="type-body text-center" style={{ color: "var(--text-secondary)" }}>
              Nothing on the books.
            </p>
          </div>
        )}

        {/* Bottom padding */}
        <div style={{ height: 8 }} />
      </div>
    </section>
  );
}

function AppointmentRow({
  appt,
  showDivider,
}: {
  appt: (typeof MOCK_APPOINTMENTS)[0];
  showDivider: boolean;
}) {
  return (
    <div
      className="flex gap-4 px-5 py-3"
      style={{
        borderBottom: showDivider ? "1px solid var(--border-subtle)" : "none",
      }}
    >
      {/* Time column */}
      <div className="shrink-0 pt-0.5" style={{ width: 68 }}>
        {!appt.isToday && (
          <div
            className="type-caption mb-0.5"
            style={{ color: "var(--text-tertiary)" }}
          >
            {appt.dateLabel}
          </div>
        )}
        <div
          className="type-small"
          style={{
            color: appt.isToday ? "var(--accent)" : "var(--text-secondary)",
            fontWeight: appt.isToday ? 600 : 500,
          }}
        >
          {appt.time}
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col gap-0.5 min-w-0">
        <span className="type-body">{appt.title}</span>
        {appt.location && (
          <span
            className="type-small flex items-center gap-1"
            style={{ color: "var(--text-tertiary)" }}
          >
            <MapPin size={10} />
            {appt.location}
          </span>
        )}
      </div>
    </div>
  );
}
