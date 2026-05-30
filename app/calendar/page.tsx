"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BackButton } from "@/components/ui/BackButton";
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, isToday, isSameMonth, isSameDay,
  addMonths, subMonths, parseISO,
} from "date-fns";
import { ChevronLeft, ChevronRight, MapPin, X, Trash2, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase";
import { addAppointment, deleteAppointment } from "@/lib/appointments";
import { spring, springGentle, micro, fadeUp, staggerParent } from "@/lib/animations";
import type { Appointment, NewAppointment } from "@/lib/types";

// ── Mini calendar (left panel) ─────────────────────────────────────────────

function MiniCalendar({
  currentMonth,
  selectedDay,
  appointments,
  onSelectDay,
  onPrevMonth,
  onNextMonth,
}: {
  currentMonth: Date;
  selectedDay: Date;
  appointments: Appointment[];
  onSelectDay: (d: Date) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
}) {
  const days = eachDayOfInterval({
    start: startOfWeek(startOfMonth(currentMonth)),
    end: endOfWeek(endOfMonth(currentMonth)),
  });

  const hasAppts = (day: Date) =>
    appointments.some((a) => isSameDay(parseISO(a.starts_at), day));

  return (
    <div className="flex flex-col gap-3 w-full sm:w-[232px] sm:shrink-0">
      {/* Month nav */}
      <div className="flex items-center justify-between">
        <span
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: "var(--text-primary)",
            fontFamily: "inherit",
            letterSpacing: "-0.01em",
          }}
        >
          {format(currentMonth, "MMMM yyyy")}
        </span>
        <div className="flex items-center gap-0.5">
          <button onClick={onPrevMonth} className="btn-icon" style={{ borderRadius: "50%", background: "var(--bg-card-hover)" }} aria-label="Previous month">
            <ChevronLeft size={14} />
          </button>
          <button onClick={onNextMonth} className="btn-icon" style={{ borderRadius: "50%", background: "var(--bg-card-hover)" }} aria-label="Next month">
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* Day-of-week headers */}
      <div className="grid grid-cols-7">
        {["S","M","T","W","T","F","S"].map((d, i) => (
          <div
            key={i}
            style={{
              textAlign: "center",
              fontSize: 11,
              fontWeight: 500,
              fontFamily: "inherit",
              color: "var(--text-tertiary)",
              letterSpacing: "0.04em",
              paddingBottom: 4,
            }}
          >
            {d}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7" style={{ gap: 2 }}>
        {days.map((day) => {
          const inMonth = isSameMonth(day, currentMonth);
          const isSelected = isSameDay(day, selectedDay);
          const todayDay = isToday(day);
          const hasDot = hasAppts(day);

          return (
            <button
              key={day.toISOString()}
              onClick={() => onSelectDay(day)}
              style={{
                background: isSelected
                  ? todayDay ? "var(--accent)" : "var(--bg-card-hover)"
                  : "transparent",
                border: "none",
                borderRadius: 6,
                cursor: "pointer",
                padding: "3px 0",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 2,
                opacity: inMonth ? 1 : 0.3,
                transition: "background 120ms ease",
              }}
            >
              <span
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: todayDay && !isSelected ? "var(--accent)" : "transparent",
                  color: (todayDay && !isSelected) || (todayDay && isSelected)
                    ? "#fff"
                    : isSelected
                    ? "var(--text-primary)"
                    : "var(--text-primary)",
                  fontSize: 11,
                  fontWeight: todayDay ? 600 : 400,
                  fontFamily: "inherit",
                }}
              >
                {format(day, "d")}
              </span>
              {/* Event dot */}
              {hasDot && (
                <div
                  style={{
                    width: 3,
                    height: 3,
                    borderRadius: "50%",
                    background: isSelected || todayDay ? "rgba(255,255,255,0.7)" : "var(--accent)",
                  }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Day timeline (right panel) ─────────────────────────────────────────────

function DayTimeline({
  selectedDay,
  appointments,
  onDelete,
  onAdd,
}: {
  selectedDay: Date;
  appointments: Appointment[];
  onDelete: (id: string) => void;
  onAdd: () => void;
}) {
  const dayAppts = appointments
    .filter((a) => isSameDay(parseISO(a.starts_at), selectedDay))
    .sort((a, b) => a.starts_at.localeCompare(b.starts_at));

  return (
    <div className="flex flex-col gap-4 flex-1 min-w-0">
      {/* Day header */}
      <div className="flex items-end justify-between">
        <div>
          <p className="type-caption">{format(selectedDay, "EEEE")}</p>
          <h2
            style={{
              fontSize: "clamp(20px, 2.5vw, 28px)",
              fontWeight: 600,
              letterSpacing: "-0.02em",
              color: "var(--text-primary)",
              fontFamily: "inherit",
              lineHeight: 1.15,
            }}
          >
            {format(selectedDay, "MMMM d")}
            {isToday(selectedDay) && (
              <span
                className="ml-2"
                style={{
                  fontSize: 12,
                  fontWeight: 500,
                  color: "var(--accent)",
                  letterSpacing: 0,
                  verticalAlign: "middle",
                }}
              >
                Today
              </span>
            )}
          </h2>
        </div>
        <button onClick={onAdd} className="btn-primary" style={{ flexShrink: 0 }}>
          <Plus size={13} />
          Add
        </button>
      </div>

      {/* Events */}
      <div className="flex flex-col" style={{ gap: 1 }}>
        <AnimatePresence initial={false}>
          {dayAppts.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={micro}
              className="card px-6 py-10 text-center"
            >
              <p className="type-body" style={{ color: "var(--text-secondary)" }}>
                Free day.
              </p>
              <p className="type-small mt-1" style={{ color: "var(--text-tertiary)" }}>
                Tap Add to schedule something.
              </p>
            </motion.div>
          ) : (
            dayAppts.map((appt, i) => (
              <motion.div
                key={appt.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ ...spring, delay: i * 0.04 }}
                className="card flex gap-4 px-5 py-4"
              >
                {/* Time column */}
                <div
                  className="flex flex-col items-end shrink-0"
                  style={{ width: 58 }}
                >
                  <span
                    className="type-small"
                    style={{
                      color: isToday(selectedDay) ? "var(--accent)" : "var(--text-secondary)",
                      fontWeight: isToday(selectedDay) ? 600 : 400,
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {format(parseISO(appt.starts_at), "h:mm")}
                  </span>
                  <span
                    style={{
                      fontSize: 10,
                      color: "var(--text-tertiary)",
                      fontFamily: "inherit",
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {format(parseISO(appt.starts_at), "a")}
                  </span>
                </div>

                {/* Accent line */}
                <div
                  style={{
                    width: 3,
                    borderRadius: 2,
                    background: "var(--accent)",
                    flexShrink: 0,
                    alignSelf: "stretch",
                    minHeight: 32,
                    opacity: 0.7,
                  }}
                />

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="type-body" style={{ fontWeight: 500 }}>
                    {appt.title}
                  </p>
                  {appt.location && (
                    <p
                      className="type-small flex items-center gap-1 mt-0.5"
                      style={{ color: "var(--text-tertiary)" }}
                    >
                      <MapPin size={10} className="shrink-0" />
                      {appt.location}
                    </p>
                  )}
                  {appt.ends_at && (
                    <p className="type-small mt-0.5" style={{ color: "var(--text-tertiary)" }}>
                      Until {format(parseISO(appt.ends_at), "h:mm a")}
                    </p>
                  )}
                </div>

                {/* Delete */}
                <button
                  onClick={() => onDelete(appt.id)}
                  className="btn-icon-ghost self-center"
                  onMouseEnter={(e) => { e.currentTarget.style.color = "var(--accent-overdue)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-tertiary)"; }}
                  aria-label={`Delete ${appt.title}`}
                >
                  <Trash2 size={13} />
                </button>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ── Add appointment modal ──────────────────────────────────────────────────

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
    await onAdd({
      title: title.trim(),
      starts_at: new Date(`${date}T${startTime}`).toISOString(),
      ends_at: endTime ? new Date(`${date}T${endTime}`).toISOString() : null,
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
  const onFocus = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    e.target.style.borderColor = "var(--accent)";
    e.target.style.boxShadow = "0 0 0 3px rgba(0,122,255,0.12)";
  };
  const onBlurField = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
        style={{ background: "var(--bg-card)", border: "1px solid var(--border-card)", boxShadow: "0 24px 80px rgba(0,0,0,0.22)" }}
      >
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
          <p className="type-section">New Appointment</p>
          <button onClick={onClose} className="btn-icon" style={{ borderRadius: "50%" }}>
            <X size={14} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 flex flex-col gap-4">
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
            placeholder="Title" autoFocus className="w-full outline-none bg-transparent"
            style={{ border: "none", borderBottom: "2px solid var(--border-card)", paddingBottom: 10, color: "var(--text-primary)", fontFamily: "inherit", fontSize: 18, fontWeight: 600, letterSpacing: "-0.02em", transition: "border-color 150ms" }}
            onFocus={(e) => { e.target.style.borderBottomColor = "var(--accent)"; }}
            onBlur={(e) => { e.target.style.borderBottomColor = "var(--border-card)"; }} />

          <div className="flex flex-col gap-1.5">
            <label className="type-caption">Date</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
              className="w-full type-body rounded-[10px] px-3 py-2.5" style={fieldStyle} onFocus={onFocus} onBlur={onBlurField} />
          </div>

          <div className="flex gap-3">
            <div className="flex-1 flex flex-col gap-1.5">
              <label className="type-caption">Start</label>
              <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)}
                className="w-full type-body rounded-[10px] px-3 py-2.5" style={fieldStyle} onFocus={onFocus} onBlur={onBlurField} />
            </div>
            <div className="flex-1 flex flex-col gap-1.5">
              <label className="type-caption">End</label>
              <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)}
                className="w-full type-body rounded-[10px] px-3 py-2.5" style={fieldStyle} onFocus={onFocus} onBlur={onBlurField} />
            </div>
          </div>

          <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-[10px]"
            style={{ background: "var(--bg-base)", border: "1px solid var(--border-card)" }}>
            <MapPin size={13} style={{ color: "var(--text-tertiary)", flexShrink: 0 }} />
            <input type="text" value={location} onChange={(e) => setLocation(e.target.value)}
              placeholder="Location" className="flex-1 type-body outline-none bg-transparent"
              style={{ border: "none", color: "var(--text-primary)", fontFamily: "inherit" }} />
          </div>

          <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
            placeholder="Notes" rows={2} className="w-full type-body rounded-[10px] px-3 py-2.5 resize-none"
            style={{ ...fieldStyle, outline: "none" }} onFocus={onFocus} onBlur={onBlurField} />

          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className="btn-secondary btn-lg flex-1">
              Cancel
            </button>
            <button type="submit" disabled={!title.trim() || adding} className="btn-primary btn-lg flex-1">
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
  const [selectedDay, setSelectedDay] = useState(new Date());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);

  const fetchAppointments = useCallback(async (month: Date) => {
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
  }, []);

  useEffect(() => { fetchAppointments(currentMonth); }, [currentMonth, fetchAppointments]);

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

  const handleSelectDay = (day: Date) => {
    setSelectedDay(day);
    if (!isSameMonth(day, currentMonth)) setCurrentMonth(day);
  };

  return (
    <main className="min-h-screen" style={{ background: "var(--bg-base)" }}>
      <motion.div
        className="flex flex-col gap-8"
        style={{ padding: "var(--page-top) var(--page-gutter) 60px" }}
        variants={staggerParent}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={fadeUp} transition={spring}>
          <BackButton />
        </motion.div>

        {/* Two-panel layout */}
        <motion.div variants={fadeUp} transition={spring} className="flex flex-col gap-4 sm:flex-row sm:gap-8 sm:items-start">
          {/* Left: mini calendar */}
          <div
            className="card px-5 py-5 sm:shrink-0"
            style={{ position: "sticky", top: "var(--page-top)" }}
          >
            <MiniCalendar
              currentMonth={currentMonth}
              selectedDay={selectedDay}
              appointments={appointments}
              onSelectDay={handleSelectDay}
              onPrevMonth={() => setCurrentMonth((m) => subMonths(m, 1))}
              onNextMonth={() => setCurrentMonth((m) => addMonths(m, 1))}
            />
            <button
              onClick={() => setShowAddModal(true)}
              className="btn-primary mt-4 w-full"
            >
              <Plus size={13} />
              New appointment
            </button>
          </div>

          {/* Right: day timeline */}
          <DayTimeline
            selectedDay={selectedDay}
            appointments={appointments}
            onDelete={handleDelete}
            onAdd={() => setShowAddModal(true)}
          />
        </motion.div>
      </motion.div>

      <AnimatePresence>
        {showAddModal && (
          <AddAppointmentModal
            defaultDate={selectedDay}
            onClose={() => setShowAddModal(false)}
            onAdd={handleAdd}
          />
        )}
      </AnimatePresence>
    </main>
  );
}
