"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isToday,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  parseISO,
} from "date-fns";
import { ChevronLeft, ChevronRight, MapPin, X, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase";
import { deleteAppointment } from "@/lib/appointments";
import { spring } from "@/lib/animations";
import type { Appointment } from "@/lib/types";

const DAY_HEADERS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  const fetchAppointments = useCallback(async (month: Date) => {
    setLoading(true);
    const supabase = createClient();
    const from = startOfWeek(startOfMonth(month));
    const to = endOfWeek(endOfMonth(month));
    const { data } = await supabase
      .from("appointments")
      .select("*")
      .gte("starts_at", from.toISOString())
      .lte("starts_at", to.toISOString())
      .order("starts_at");
    setAppointments((data as Appointment[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAppointments(currentMonth);
  }, [currentMonth, fetchAppointments]);

  const days = eachDayOfInterval({
    start: startOfWeek(startOfMonth(currentMonth)),
    end: endOfWeek(endOfMonth(currentMonth)),
  });

  const apptsByDay = (day: Date) =>
    appointments.filter((a) => isSameDay(parseISO(a.starts_at), day));

  const selectedDayAppts = selectedDay ? apptsByDay(selectedDay) : [];

  const handleDelete = async (id: string) => {
    setAppointments((prev) => prev.filter((a) => a.id !== id));
    await deleteAppointment(id);
  };

  return (
    <main className="min-h-screen" style={{ background: "var(--bg-base)" }}>
      <div style={{ padding: "var(--page-top) var(--page-gutter) 60px" }}>
        <div className="mb-8">
          <Link href="/" className="type-small" style={{ color: "var(--accent)" }}>
            ← Dashboard
          </Link>
        </div>

        {/* Month nav */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="type-display">{format(currentMonth, "MMMM yyyy")}</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setCurrentMonth(new Date()); setSelectedDay(new Date()); }}
              className="type-small px-3 py-1.5 rounded-full spring-hover"
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border-card)",
                boxShadow: "var(--shadow-card)",
                color: "var(--text-secondary)",
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              Today
            </button>
            {[
              { fn: () => setCurrentMonth((m) => subMonths(m, 1)), icon: <ChevronLeft size={15} />, label: "Previous" },
              { fn: () => setCurrentMonth((m) => addMonths(m, 1)), icon: <ChevronRight size={15} />, label: "Next" },
            ].map(({ fn, icon, label }) => (
              <button
                key={label}
                onClick={fn}
                className="flex items-center justify-center w-8 h-8 rounded-full spring-hover"
                style={{
                  background: "var(--bg-card)",
                  border: "1px solid var(--border-card)",
                  boxShadow: "var(--shadow-card)",
                  color: "var(--text-secondary)",
                  cursor: "pointer",
                }}
                aria-label={label}
              >
                {icon}
              </button>
            ))}
          </div>
        </div>

        {/* Calendar card */}
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          {/* Day headers */}
          <div
            className="grid grid-cols-7"
            style={{ borderBottom: "1px solid var(--border-subtle)" }}
          >
            {DAY_HEADERS.map((d) => (
              <div key={d} className="type-caption text-center py-3">
                {d}
              </div>
            ))}
          </div>

          {/* Day cells */}
          <div
            className="grid grid-cols-7"
            style={{ borderTop: "none" }}
          >
            {days.map((day, idx) => {
              const dayAppts = apptsByDay(day);
              const inMonth = isSameMonth(day, currentMonth);
              const isSelected = selectedDay ? isSameDay(day, selectedDay) : false;
              const todayDay = isToday(day);
              const col = idx % 7;

              return (
                <button
                  key={day.toISOString()}
                  onClick={() =>
                    setSelectedDay((prev) =>
                      prev && isSameDay(prev, day) ? null : day
                    )
                  }
                  className="flex flex-col gap-1 p-2 text-left"
                  style={{
                    background: isSelected
                      ? "var(--bg-card-hover)"
                      : "var(--bg-card)",
                    minHeight: 88,
                    cursor: "pointer",
                    border: "none",
                    borderTop: "1px solid var(--border-subtle)",
                    borderRight: col < 6 ? "1px solid var(--border-subtle)" : "none",
                    transition: "background 120ms",
                  }}
                >
                  <span
                    className="flex items-center justify-center self-start"
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: "50%",
                      background: todayDay ? "var(--accent)" : "transparent",
                      color: todayDay
                        ? "#fff"
                        : inMonth
                        ? "var(--text-primary)"
                        : "var(--text-tertiary)",
                      fontWeight: todayDay ? 600 : 400,
                      fontSize: 12,
                      fontFamily: "inherit",
                      flexShrink: 0,
                    }}
                  >
                    {format(day, "d")}
                  </span>

                  <div className="flex flex-col gap-px w-full">
                    {dayAppts.slice(0, 2).map((a) => (
                      <div
                        key={a.id}
                        className="truncate"
                        style={{
                          background: "var(--accent)",
                          color: "#fff",
                          borderRadius: 3,
                          padding: "1px 4px",
                          fontSize: 10,
                          fontWeight: 500,
                          lineHeight: 1.7,
                          fontFamily: "inherit",
                        }}
                      >
                        {format(parseISO(a.starts_at), "h:mma")} {a.title}
                      </div>
                    ))}
                    {dayAppts.length > 2 && (
                      <span
                        style={{
                          fontSize: 10,
                          color: "var(--text-tertiary)",
                          fontFamily: "inherit",
                          paddingLeft: 2,
                        }}
                      >
                        +{dayAppts.length - 2} more
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {loading && (
          <p className="type-small text-center mt-3" style={{ color: "var(--text-tertiary)" }}>
            Loading…
          </p>
        )}

        {/* Selected day detail */}
        <AnimatePresence>
          {selectedDay && (
            <motion.div
              className="card mt-4"
              style={{ padding: 0, overflow: "hidden" }}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={spring}
            >
              {/* Header */}
              <div
                className="flex items-center justify-between px-5 py-4"
                style={{ borderBottom: "1px solid var(--border-subtle)" }}
              >
                <div>
                  <p className="type-caption">{format(selectedDay, "EEEE")}</p>
                  <p
                    style={{
                      fontSize: 17,
                      fontWeight: 600,
                      color: "var(--text-primary)",
                      letterSpacing: "-0.02em",
                      fontFamily: "inherit",
                    }}
                  >
                    {format(selectedDay, "MMMM d")}
                    {isToday(selectedDay) && (
                      <span
                        className="ml-2 type-caption"
                        style={{ color: "var(--accent)", textTransform: "none", letterSpacing: 0 }}
                      >
                        Today
                      </span>
                    )}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedDay(null)}
                  className="flex items-center justify-center w-7 h-7 rounded-full"
                  style={{
                    background: "var(--bg-card-hover)",
                    border: "none",
                    color: "var(--text-secondary)",
                    cursor: "pointer",
                  }}
                >
                  <X size={13} />
                </button>
              </div>

              {selectedDayAppts.length === 0 ? (
                <div className="px-5 py-6 text-center">
                  <p className="type-body" style={{ color: "var(--text-secondary)" }}>
                    Free day.
                  </p>
                </div>
              ) : (
                <div>
                  {selectedDayAppts.map((appt, i) => (
                    <div
                      key={appt.id}
                      className="flex items-center gap-4 px-5 py-3.5"
                      style={{
                        borderBottom:
                          i < selectedDayAppts.length - 1
                            ? "1px solid var(--border-subtle)"
                            : "none",
                      }}
                    >
                      <span
                        className="type-small shrink-0"
                        style={{
                          width: 56,
                          color: isToday(selectedDay)
                            ? "var(--accent)"
                            : "var(--text-secondary)",
                          fontWeight: isToday(selectedDay) ? 600 : 400,
                        }}
                      >
                        {format(parseISO(appt.starts_at), "h:mm a")}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="type-body">{appt.title}</p>
                        {appt.location && (
                          <p
                            className="type-small flex items-center gap-1 mt-0.5"
                            style={{ color: "var(--text-tertiary)" }}
                          >
                            <MapPin size={10} className="shrink-0" />
                            {appt.location}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => handleDelete(appt.id)}
                        className="shrink-0 flex items-center justify-center w-7 h-7 rounded-[6px]"
                        style={{
                          background: "transparent",
                          border: "none",
                          color: "var(--text-tertiary)",
                          cursor: "pointer",
                          transition: "color 120ms",
                        }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.color =
                            "var(--accent-overdue)";
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.color =
                            "var(--text-tertiary)";
                        }}
                        aria-label={`Delete ${appt.title}`}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
