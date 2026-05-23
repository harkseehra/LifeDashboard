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
import { spring, springGentle, micro } from "@/lib/animations";
import type { Appointment, NewAppointment } from "@/lib/types";

// ── Constants ──────────────────────────────────────────────────────────────
const DAY_HEADERS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

// ── Types ──────────────────────────────────────────────────────────────────
interface CalendarState {
  appointments: Appointment[];
  loading: boolean;
}

// ── Sub-components ─────────────────────────────────────────────────────────

function CalendarGrid({
  currentMonth,
  appointments,
  selectedDay,
  onSelectDay,
}: {
  currentMonth: Date;
  appointments: Appointment[];
  selectedDay: Date | null;
  onSelectDay: (day: Date) => void;
}) {
  const days = eachDayOfInterval({
    start: startOfWeek(startOfMonth(currentMonth)),
    end: endOfWeek(endOfMonth(currentMonth)),
  });

  const apptsByDay = (day: Date) =>
    appointments.filter((a) => isSameDay(parseISO(a.starts_at), day));

  return (
    <div className="card" style={{ padding: 0, overflow: "hidden" }}>
      {/* Day headers */}
      <div
        className="grid grid-cols-7"
        style={{ borderBottom: "1px solid var(--border-subtle)" }}
      >
        {DAY_HEADERS.map((d, i) => (
          <div
            key={i}
            className="type-caption text-center py-3"
            style={{
              color: i === 0 || i === 6 ? "var(--text-tertiary)" : "var(--text-secondary)",
            }}
          >
            {d}
          </div>
        ))}
      </div>

      {/* Day cells — no borders between cells, Apple-style */}
      <div className="grid grid-cols-7">
        {days.map((day) => {
          const dayAppts = apptsByDay(day);
          const inMonth = isSameMonth(day, currentMonth);
          const isSelected = selectedDay ? isSameDay(day, selectedDay) : false;
          const todayDay = isToday(day);

          return (
            <button
              key={day.toISOString()}
              onClick={() => onSelectDay(day)}
              style={{
                background: isSelected ? "var(--bg-card-hover)" : "transparent",
                border: "none",
                cursor: "pointer",
                minHeight: 56,
                padding: "8px 4px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 5,
                transition: "background 120ms ease",
              }}
            >
              {/* Day number */}
              <span
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: todayDay ? "var(--accent)" : "transparent",
                  color: todayDay
                    ? "#fff"
                    : inMonth
                    ? "var(--text-primary)"
                    : "var(--text-tertiary)",
                  fontWeight: todayDay ? 600 : 400,
                  fontSize: 13,
                  fontFamily: "inherit",
                  flexShrink: 0,
                  opacity: inMonth ? 1 : 0.38,
                }}
              >
                {format(day, "d")}
              </span>

              {/* Event dots */}
              {dayAppts.length > 0 && (
                <div style={{ display: "flex", gap: 3, alignItems: "center" }}>
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
  );
}

function DayDetail({
  selectedDay,
  appointments,
  onClose,
  onDelete,
  onAdd,
}: {
  selectedDay: Date;
  appointments: Appointment[];
  onClose: () => void;
  onDelete: (id: string) => void;
  onAdd: () => void;
}) {
  const dayAppts = appointments.filter((a) =>
    isSameDay(parseISO(a.starts_at), selectedDay)
  );

  return (
    <motion.div
      className="card"
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
        <div className="flex items-center gap-2">
          <button
            onClick={onAdd}
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
            onClick={onClose}
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

      {/* Appointment list */}
      {dayAppts.length === 0 ? (
        <div className="px-5 py-6 text-center">
          <p className="type-body" style={{ color: "var(--text-secondary)" }}>
            Free day.
          </p>
        </div>
      ) : (
        <div>
          {dayAppts.map((appt, i) => (
            <div
              key={appt.id}
              className="flex items-center gap-4 px-5 py-3.5"
              style={{
                borderBottom:
                  i < dayAppts.length - 1
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
                onClick={() => onDelete(appt.id)}
                className="shrink-0 flex items-center justify-center w-7 h-7 rounded-[6px]"
                style={{
                  background: "transparent",
                  border: "none",
                  color: "var(--text-tertiary)",
                  cursor: "pointer",
                  transition: "color 150ms ease",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.color = "var(--accent-overdue)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.color = "var(--text-tertiary)";
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
  );
}

function AddAppointmentModal({
  defaultDate,
  onClose,
  onAdd,
}: {
  defaultDate: Date;
  onClose: () => void;
  onAdd: (appt: NewAppointment) => Promise<void>;
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
    const ends_at = endTime ? new Date(`${date}T${endTime}`).toISOString() : null;
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

  const inputStyle = {
    background: "var(--bg-base)",
    border: "1px solid var(--border-card)",
    color: "var(--text-primary)",
    fontFamily: "inherit",
    outline: "none",
    transition: "border-color 150ms, box-shadow 150ms",
  };
  const onFocus = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    e.target.style.borderColor = "var(--accent)";
    e.target.style.boxShadow = "0 0 0 3px rgba(0,122,255,0.12)";
  };
  const onBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    e.target.style.borderColor = "var(--border-card)";
    e.target.style.boxShadow = "none";
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.32)", backdropFilter: "blur(8px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        transition={springGentle}
        className="w-full max-w-[460px] rounded-[20px] overflow-hidden"
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border-card)",
          boxShadow: "0 24px 80px rgba(0,0,0,0.22)",
        }}
      >
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: "1px solid var(--border-subtle)" }}
        >
          <p className="type-section">New Appointment</p>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-full"
            style={{ background: "var(--bg-card-hover)", border: "none", cursor: "pointer", color: "var(--text-secondary)" }}
          >
            <X size={14} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 flex flex-col gap-4">
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
            onFocus={(e) => { e.target.style.borderBottomColor = "var(--accent)"; }}
            onBlur={(e) => { e.target.style.borderBottomColor = "var(--border-card)"; }}
          />

          <div className="flex flex-col gap-1.5">
            <label className="type-caption">Date</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
              className="w-full type-body rounded-[10px] px-3 py-2.5"
              style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
          </div>

          <div className="flex gap-3">
            <div className="flex-1 flex flex-col gap-1.5">
              <label className="type-caption">Start</label>
              <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)}
                className="w-full type-body rounded-[10px] px-3 py-2.5"
                style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
            </div>
            <div className="flex-1 flex flex-col gap-1.5">
              <label className="type-caption">End</label>
              <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)}
                className="w-full type-body rounded-[10px] px-3 py-2.5"
                style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
            </div>
          </div>

          <div
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-[10px]"
            style={{ background: "var(--bg-base)", border: "1px solid var(--border-card)" }}
          >
            <MapPin size={13} style={{ color: "var(--text-tertiary)", flexShrink: 0 }} />
            <input type="text" value={location} onChange={(e) => setLocation(e.target.value)}
              placeholder="Location" className="flex-1 type-body outline-none bg-transparent"
              style={{ border: "none", color: "var(--text-primary)", fontFamily: "inherit" }} />
          </div>

          <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
            placeholder="Notes" rows={2}
            className="w-full type-body rounded-[10px] px-3 py-2.5 resize-none"
            style={{ ...inputStyle, outline: "none" }}
            onFocus={onFocus} onBlur={onBlur} />

          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-[10px] type-small"
              style={{ background: "var(--bg-card-hover)", border: "none", color: "var(--text-secondary)", cursor: "pointer", fontFamily: "inherit" }}>
              Cancel
            </button>
            <button type="submit" disabled={!title.trim() || adding}
              className="flex-1 py-2.5 rounded-[10px] type-small"
              style={{
                background: "var(--accent)", border: "none", color: "#fff",
                cursor: title.trim() && !adding ? "pointer" : "not-allowed",
                fontFamily: "inherit",
                opacity: !title.trim() || adding ? 0.6 : 1,
                transition: "opacity 150ms",
              }}>
              {adding ? "Adding…" : "Add Appointment"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [state, setState] = useState<CalendarState>({ appointments: [], loading: true });
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const fetchAppointments = useCallback(async (month: Date) => {
    setState((s) => ({ ...s, loading: true }));
    const supabase = createClient();
    const from = startOfWeek(startOfMonth(month));
    const to = endOfWeek(endOfMonth(month));
    const { data } = await supabase
      .from("appointments")
      .select("*")
      .gte("starts_at", from.toISOString())
      .lte("starts_at", to.toISOString())
      .order("starts_at");
    setState({ appointments: (data as Appointment[]) ?? [], loading: false });
  }, []);

  useEffect(() => { fetchAppointments(currentMonth); }, [currentMonth, fetchAppointments]);

  const handleSelectDay = (day: Date) => {
    setSelectedDay((prev) => prev && isSameDay(prev, day) ? null : day);
  };

  const handleDelete = async (id: string) => {
    setState((s) => ({ ...s, appointments: s.appointments.filter((a) => a.id !== id) }));
    await deleteAppointment(id);
  };

  const handleAdd = async (appt: NewAppointment) => {
    const { data } = await addAppointment(appt);
    if (data) {
      setState((s) => ({
        ...s,
        appointments: [...s.appointments, data].sort((a, b) =>
          a.starts_at.localeCompare(b.starts_at)
        ),
      }));
    }
  };

  return (
    <main className="min-h-screen" style={{ background: "var(--bg-base)" }}>
      <div style={{ padding: "var(--page-top) var(--page-gutter) 60px" }}>
        <div className="mb-6">
          <Link href="/" className="type-small" style={{ color: "var(--accent)" }}>
            ← Dashboard
          </Link>
        </div>

        {/* Month navigation */}
        <div className="flex items-center justify-between mb-5">
          <h1 className="type-display" style={{ fontSize: "clamp(24px, 3vw, 36px)" }}>
            {format(currentMonth, "MMMM yyyy")}
          </h1>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full type-small spring-hover"
              style={{ background: "var(--accent)", border: "none", color: "#fff", cursor: "pointer", fontFamily: "inherit" }}
            >
              <Plus size={13} />
              Add
            </button>

            <button
              onClick={() => { setCurrentMonth(new Date()); setSelectedDay(new Date()); }}
              className="type-small px-3 py-1.5 rounded-full spring-hover"
              style={{ background: "var(--bg-card)", border: "1px solid var(--border-card)", boxShadow: "var(--shadow-card)", color: "var(--text-secondary)", cursor: "pointer", fontFamily: "inherit" }}
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
                style={{ background: "var(--bg-card)", border: "1px solid var(--border-card)", boxShadow: "var(--shadow-card)", color: "var(--text-secondary)", cursor: "pointer" }}
                aria-label={label}
              >
                {icon}
              </button>
            ))}
          </div>
        </div>

        {state.loading && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={micro}
            className="type-small text-center mb-3"
            style={{ color: "var(--text-tertiary)" }}
          >
            Loading…
          </motion.p>
        )}

        <CalendarGrid
          currentMonth={currentMonth}
          appointments={state.appointments}
          selectedDay={selectedDay}
          onSelectDay={handleSelectDay}
        />

        <AnimatePresence>
          {selectedDay && (
            <div className="mt-4">
              <DayDetail
                selectedDay={selectedDay}
                appointments={state.appointments}
                onClose={() => setSelectedDay(null)}
                onDelete={handleDelete}
                onAdd={() => setShowAddModal(true)}
              />
            </div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {showAddModal && (
          <AddAppointmentModal
            defaultDate={selectedDay ?? new Date()}
            onClose={() => setShowAddModal(false)}
            onAdd={handleAdd}
          />
        )}
      </AnimatePresence>
    </main>
  );
}
