"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { MapPin } from "lucide-react";
import { format, isToday, isTomorrow, parseISO } from "date-fns";
import { fadeUp, spring } from "@/lib/animations";
import type { Appointment } from "@/lib/types";

interface AppointmentsSectionProps {
  appointments: Appointment[];
}

function groupAppointments(appointments: Appointment[]) {
  const today: Appointment[] = [];
  const upcoming: Appointment[] = [];

  for (const a of appointments) {
    const d = parseISO(a.starts_at);
    if (isToday(d)) {
      today.push(a);
    } else {
      upcoming.push(a);
    }
  }

  return { today, upcoming };
}

export function AppointmentsSection({ appointments }: AppointmentsSectionProps) {
  const { today, upcoming } = groupAppointments(appointments);
  let rowIndex = 0;

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
            {today.map((appt, i) => {
              const idx = rowIndex++;
              return (
                <motion.div
                  key={appt.id}
                  variants={fadeUp}
                  initial="hidden"
                  animate="visible"
                  transition={{ ...spring, delay: idx * 0.05 }}
                >
                  <AppointmentRow
                    appt={appt}
                    isToday
                    showDivider={i < today.length - 1 || upcoming.length > 0}
                  />
                </motion.div>
              );
            })}
          </div>
        )}

        {upcoming.length > 0 && (
          <div>
            <div className="px-5 pt-4 pb-1">
              <span className="type-caption">Upcoming</span>
            </div>
            {upcoming.map((appt, i) => {
              const idx = rowIndex++;
              return (
                <motion.div
                  key={appt.id}
                  variants={fadeUp}
                  initial="hidden"
                  animate="visible"
                  transition={{ ...spring, delay: idx * 0.05 }}
                >
                  <AppointmentRow
                    appt={appt}
                    isToday={false}
                    showDivider={i < upcoming.length - 1}
                  />
                </motion.div>
              );
            })}
          </div>
        )}

        {today.length === 0 && upcoming.length === 0 && (
          <div className="px-5 py-8">
            <p
              className="type-body text-center"
              style={{ color: "var(--text-secondary)" }}
            >
              Nothing on the books.
            </p>
          </div>
        )}

        <div style={{ height: 8 }} />
      </div>
    </section>
  );
}

function AppointmentRow({
  appt,
  isToday: today,
  showDivider,
}: {
  appt: Appointment;
  isToday: boolean;
  showDivider: boolean;
}) {
  const date = parseISO(appt.starts_at);
  const timeStr = format(date, "h:mm a");
  const dateLabel = isTomorrow(date) ? "Tomorrow" : format(date, "MMM d");

  return (
    <div
      className="flex gap-4 px-5 py-3"
      style={{
        borderBottom: showDivider ? "1px solid var(--border-subtle)" : "none",
      }}
    >
      {/* Time column */}
      <div className="shrink-0 pt-0.5" style={{ width: 68 }}>
        {!today && (
          <div
            className="type-caption mb-0.5"
            style={{ color: "var(--text-tertiary)" }}
          >
            {dateLabel}
          </div>
        )}
        <div
          className="type-small"
          style={{
            color: today ? "var(--accent)" : "var(--text-secondary)",
            fontWeight: today ? 600 : 500,
          }}
        >
          {timeStr}
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col gap-0.5 min-w-0">
        <span className="type-body truncate">{appt.title}</span>
        {appt.location && (
          <span
            className="type-small flex items-center gap-1 truncate"
            style={{ color: "var(--text-tertiary)" }}
          >
            <MapPin size={10} className="shrink-0" />
            {appt.location}
          </span>
        )}
      </div>
    </div>
  );
}
