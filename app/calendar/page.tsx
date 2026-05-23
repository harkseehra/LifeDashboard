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
import { ChevronLeft, ChevronRight, MapPin, X, Trash2, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase";
import { addAppointment, deleteAppointment } from "@/lib/appointments";
import { spring } from "@/lib/animations";
import type { Appointment, NewAppointment } from "@/lib/types";

const DAY_HEADERS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

export default function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

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

  const handleAdd = async (appt: NewAppointment) => {
    const { data } = await addAppointment(appt);
    if (data) {
      setAppointments((prev) =>
        [...prev, data].sort((a, b) => a.starts_at.localeCompare(b.starts_at))
      );
    }
  };

  return (
    <main className="min-h-screen" style={{ background: "var(--bg-base)" }}>
      <div
        style={{
          padding: "var(--page-top) var(--page-gutter) 60px",
          maxWidth: 560,
          margin: "0 auto",
        }}
      >
        <div className="mb-6">
          <Link href="/" className="type-small" style={{ color: "var(--accent)" }}>
            ← Dashboard
          </Link>
        </div>

        {/* Month nav */}
        <div className="flex items-center justify-between mb-5">
          <h1
            className="type-display"
            style={{ fontSize: "clamp(24px, 3vw, 36px)" }}
          >
            {format(currentMonth, "MMMM yyyy")}
          </h1>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full type-small spring-hover"
              style={{
                background: "var(--accent)",
                border: "none",
                color: "#fff",
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              <Plus size={13} />
              Add
            </button>

            <button
              onClick={() => {
                setCurrentMonth(new Date());
                setSelectedDay(new Date());
              }}
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

        {/* Calendar grid */}
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          {/* Day headers */}
          <div
            className="grid grid-cols-7"
            style={{ borderBottom: "1px solid var(--border-subtle)" }}
          >
            {DAY_HEADERS.map((d, i) => (
              <div
                key={i}
                className="type-caption text-center py-2.5"
                style={{
                  color:
                    i === 0 || i === 6
                      ? "var(--text-tertiary)"
                      : "var(--text-secondary)",
                }}
              >
                {d}
              </div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7">
            {days.map((day, idx) => {
              const dayAppts = apptsByDay(day);
              const inMonth = isSameMonth(day, currentMonth);
              const isSelected = selectedDay ? isSameDay(day, selectedDay) : false;
              const todayDay = isToday(day);
              const col = idx % 7;
              const isWeekend = col === 0 || col === 6;

              return (
                <button
                  key={day.toISOString()}
                  onClick={() =>
                    setSelectedDay((prev) =>
                      prev && isSameDay(prev, day) ? null : day
                    )
                  }
                  className="flex flex-col items-center gap-1 py-2"
                  style={{
                    background: isSelected
                      ? "var(--bg-card-hover)"
                      : "transparent",
                    minHeight: 52,
                    cursor: "pointer",
                    border: "none",
                    borderTop: "1px solid var(--border-subtle)",
                    borderRight:
                      col < 6 ? "1px solid var(--border-subtle)" : "none",
                    transition: "background 120ms",
                  }}
                >
                  <span
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: todayDay ? "var(--accent)" : "transparent",
                      color: todayDay
                        ? "#fff"
                        : inMonth
                        ? isWeekend
                          ? "var(--text-secondary)"
                          : "var(--text-primary)"
                        : "var(--text-tertiary)",
                      fontWeight: todayDay ? 600 : inMonth ? 400 : 300,
                      fontSize: 13,
                      fontFamily: "inherit",
                      flexShrink: 0,
                    }}
                  >
                    {format(day, "d")}
                  </span>

                  {/* Appointment dots */}
                  {dayAppts.length > 0 && (
                    <div className="flex gap-px items-center">
                      {dayAppts.slice(0, 3).map((_, i) => (
                        <div
                          key={i}
                          style={{
                            width: 4,
                            height: 4,
                            borderRadius: "50%",
                            background: todayDay
                              ? "rgba(255,255,255,0.75)"
                              : "var(--accent)",
                          }}
                        />
                      ))}
                      {dayAppts.length > 3 && (
                        <div
                          style={{
                            width: 4,
                            height: 4,
                            borderRadius: "50%",
                            background: "var(--text-tertiary)",
                          }}
                        />
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {loading && (
          <p
            className="type-small text-center mt-3"
            style={{ color: "var(--text-tertiary)" }}
          >
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
                        style={{
                          color: "var(--accent)",
                          textTransform: "none",
                          letterSpacing: 0,
                        }}
                      >
                        Today
                      </span>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full type-small spring-hover"
                    style={{
                      background: "var(--accent)",
                      border: "none",
                      color: "#fff",
                      cursor: "pointer",
                      fontFamily: "inherit",
                    }}
                  >
                    <Plus size={12} />
                    Add
                  </button>
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
              </div>

              {selectedDayAppts.length === 0 ? (
                <div className="px-5 py-6 text-center">
                  <p
                    className="type-body"
                    style={{ color: "var(--text-secondary)" }}
                  >
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

      {/* Add Appointment Modal */}
      <AnimatePresence>
        {showAddModal && (
          <AddAppointmentModal
            onClose={() => setShowAddModal(false)}
            onAdd={handleAdd}
            defaultDate={selectedDay ?? new Date()}
          />
        )}
      </AnimatePresence>
    </main>
  );
}

function AddAppointmentModal({
  onClose,
  onAdd,
  defaultDate,
}: {
  onClose: () => void;
  onAdd: (appt: NewAppointment) => Promise<void>;
  defaultDate: Date;
}) {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(format(defaultDate, "yyyy-MM-dd"));
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [adding, setAdding] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || adding) return;
    setAdding(true);
    const starts_at = new Date(`${date}T${startTime}`).toISOString();
    const ends_at = endTime
      ? new Date(`${date}T${endTime}`).toISOString()
      : null;
    await onAdd({
      title: title.trim(),
      starts_at,
      ends_at,
      location: location.trim() || null,
      notes: notes.trim() || null,
    });
    setAdding(false);
    onClose();
  };

  const fieldStyle = {
    background: "var(--bg-base)",
    border: "1px solid var(--border-card)",
    color: "var(--text-primary)",
    fontFamily: "inherit",
    outline: "none",
    transition: "border-color 150ms, box-shadow 150ms",
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    e.target.style.borderColor = "var(--accent)";
    e.target.style.boxShadow = "0 0 0 3px rgba(0,122,255,0.12)";
  };
  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    e.target.style.borderColor = "var(--border-card)";
    e.target.style.boxShadow = "none";
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{
        background: "rgba(0,0,0,0.32)",
        backdropFilter: "blur(8px)",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        transition={spring}
        className="w-full max-w-[460px] rounded-[20px] overflow-hidden"
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border-card)",
          boxShadow: "0 24px 80px rgba(0,0,0,0.22)",
        }}
      >
        {/* Modal header */}
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: "1px solid var(--border-subtle)" }}
        >
          <p className="type-section">New Appointment</p>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-full"
            style={{
              background: "var(--bg-card-hover)",
              border: "none",
              cursor: "pointer",
              color: "var(--text-secondary)",
            }}
          >
            <X size={14} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 flex flex-col gap-4">
          {/* Title */}
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title"
            autoFocus
            className="w-full outline-none bg-transparent"
            style={{
              border: "none",
              borderBottom: "2px solid var(--border-card)",
              paddingBottom: 10,
              color: "var(--text-primary)",
              fontFamily: "inherit",
              fontSize: 18,
              fontWeight: 600,
              letterSpacing: "-0.02em",
              transition: "border-color 150ms",
            }}
            onFocus={(e) => {
              e.target.style.borderBottomColor = "var(--accent)";
            }}
            onBlur={(e) => {
              e.target.style.borderBottomColor = "var(--border-card)";
            }}
          />

          {/* Date */}
          <div className="flex flex-col gap-1.5">
            <label className="type-caption">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full type-body rounded-[10px] px-3 py-2.5"
              style={fieldStyle}
              onFocus={handleFocus}
              onBlur={handleBlur}
            />
          </div>

          {/* Time */}
          <div className="flex gap-3">
            <div className="flex-1 flex flex-col gap-1.5">
              <label className="type-caption">Start time</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full type-body rounded-[10px] px-3 py-2.5"
                style={fieldStyle}
                onFocus={handleFocus}
                onBlur={handleBlur}
              />
            </div>
            <div className="flex-1 flex flex-col gap-1.5">
              <label className="type-caption">End time</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full type-body rounded-[10px] px-3 py-2.5"
                style={fieldStyle}
                onFocus={handleFocus}
                onBlur={handleBlur}
              />
            </div>
          </div>

          {/* Location */}
          <div
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-[10px]"
            style={{
              background: "var(--bg-base)",
              border: "1px solid var(--border-card)",
              transition: "border-color 150ms, box-shadow 150ms",
            }}
          >
            <MapPin
              size={13}
              style={{ color: "var(--text-tertiary)", flexShrink: 0 }}
            />
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Location"
              className="flex-1 type-body outline-none bg-transparent"
              style={{
                border: "none",
                color: "var(--text-primary)",
                fontFamily: "inherit",
              }}
            />
          </div>

          {/* Notes */}
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notes"
            rows={2}
            className="w-full type-body rounded-[10px] px-3 py-2.5 resize-none"
            style={{ ...fieldStyle, outline: "none" }}
            onFocus={handleFocus}
            onBlur={handleBlur}
          />

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-[10px] type-small"
              style={{
                background: "var(--bg-card-hover)",
                border: "none",
                color: "var(--text-secondary)",
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim() || adding}
              className="flex-1 py-2.5 rounded-[10px] type-small"
              style={{
                background: "var(--accent)",
                border: "none",
                color: "#fff",
                cursor: title.trim() && !adding ? "pointer" : "not-allowed",
                fontFamily: "inherit",
                opacity: !title.trim() || adding ? 0.6 : 1,
                transition: "opacity 150ms",
              }}
            >
              {adding ? "Adding…" : "Add Appointment"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
