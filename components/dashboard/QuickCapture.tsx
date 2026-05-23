"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { parseQuickCapture } from "@/lib/parse-quick-capture";

type CaptureMode = "task" | "appointment" | "goal";

const MODES: {
  key: CaptureMode;
  label: string;
  icon: string;
  desc: string;
  color: string;
  placeholder: string;
}[] = [
  {
    key: "task",
    label: "Task",
    icon: "✓",
    desc: "Things to get done",
    color: "#007AFF",
    placeholder: "Call dentist on friday…",
  },
  {
    key: "appointment",
    label: "Appointment",
    icon: "◷",
    desc: "Events with a time",
    color: "#34C759",
    placeholder: "Dentist friday 3pm…",
  },
  {
    key: "goal",
    label: "Goal",
    icon: "◎",
    desc: "Daily habits to track",
    color: "#FF9500",
    placeholder: "Go to the gym daily…",
  },
];

interface QuickCaptureProps {
  onAddTask?: (title: string, due_date: string | null) => Promise<void>;
  onAddAppointment?: (title: string, starts_at: string) => Promise<void>;
  onAddGoal?: (title: string) => Promise<void>;
}

export function QuickCapture({
  onAddTask,
  onAddAppointment,
  onAddGoal,
}: QuickCaptureProps) {
  const [value, setValue] = useState("");
  const [mode, setMode] = useState<CaptureMode>("task");
  const [showMenu, setShowMenu] = useState(false);
  const [pulsing, setPulsing] = useState(false);
  const [focused, setFocused] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const current = MODES.find((m) => m.key === mode)!;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selectMode = (m: CaptureMode) => {
    setMode(m);
    setShowMenu(false);
    setPulsing(true);
    setTimeout(() => setPulsing(false), 700);
    setTimeout(() => inputRef.current?.focus(), 40);
  };

  const showFeedback = (msg: string) => {
    if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    setFeedback(msg);
    feedbackTimer.current = setTimeout(() => setFeedback(null), 3500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed || submitting) return;

    if (mode === "appointment") {
      const parsed = parseQuickCapture(`/appt ${trimmed}`);
      if (parsed.type !== "appointment" || !parsed.starts_at) {
        showFeedback("Add a time — try 'dentist friday 3pm'");
        return;
      }
      setSubmitting(true);
      setValue("");
      await onAddAppointment?.(parsed.title, parsed.starts_at.toISOString());
      setSubmitting(false);
      return;
    }

    if (mode === "goal") {
      setSubmitting(true);
      setValue("");
      await onAddGoal?.(trimmed);
      setSubmitting(false);
      return;
    }

    // Task
    const parsed = parseQuickCapture(trimmed);
    if (!parsed.title) return;
    setSubmitting(true);
    setValue("");
    await onAddTask?.(
      parsed.title,
      parsed.type === "task" ? parsed.due_date : null
    );
    setSubmitting(false);
  };

  return (
    <div className="flex flex-col gap-1.5">
      <form onSubmit={handleSubmit}>
        <div className="relative flex items-center" ref={menuRef}>
          {/* Mode pill */}
          <button
            type="button"
            onClick={() => setShowMenu((s) => !s)}
            className="absolute left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-[7px] z-10 transition-all duration-150"
            style={{
              background: showMenu
                ? current.color + "20"
                : pulsing
                ? current.color + "18"
                : "var(--bg-card-hover)",
              border: `1px solid ${showMenu || pulsing ? current.color + "50" : "var(--border-subtle)"}`,
              color: pulsing || showMenu ? current.color : "var(--text-secondary)",
              cursor: "pointer",
              fontSize: 11,
              fontWeight: 600,
              fontFamily: "inherit",
              letterSpacing: "0.02em",
            }}
          >
            <span style={{ fontSize: 12 }}>{current.icon}</span>
            {current.label}
            <span style={{ fontSize: 8, opacity: 0.6 }}>▾</span>
          </button>

          {/* Dropdown */}
          <AnimatePresence>
            {showMenu && (
              <motion.div
                className="absolute top-full left-0 mt-1.5 card"
                style={{ padding: 5, minWidth: 230, zIndex: 50 }}
                initial={{ opacity: 0, y: -5, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -5, scale: 0.97 }}
                transition={{ duration: 0.14, ease: [0.22, 1, 0.36, 1] }}
              >
                {MODES.map((m) => (
                  <button
                    key={m.key}
                    type="button"
                    onClick={() => selectMode(m.key)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-[7px] text-left"
                    style={{
                      background:
                        mode === m.key ? m.color + "14" : "transparent",
                      border: "none",
                      cursor: "pointer",
                      transition: "background 100ms",
                    }}
                    onMouseEnter={(e) => {
                      if (mode !== m.key)
                        e.currentTarget.style.background =
                          "var(--bg-card-hover)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background =
                        mode === m.key ? m.color + "14" : "transparent";
                    }}
                  >
                    <span
                      className="flex items-center justify-center w-7 h-7 rounded-[6px] shrink-0"
                      style={{
                        background: m.color + "18",
                        color: m.color,
                        fontSize: 14,
                        fontWeight: 600,
                      }}
                    >
                      {m.icon}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p
                        className="type-body"
                        style={{
                          color: "var(--text-primary)",
                          lineHeight: 1.3,
                          fontWeight: 500,
                        }}
                      >
                        {m.label}
                      </p>
                      <p
                        className="type-small"
                        style={{ color: "var(--text-tertiary)" }}
                      >
                        {m.desc}
                      </p>
                    </div>
                    {mode === m.key && (
                      <span
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: "50%",
                          background: m.color,
                          display: "block",
                          flexShrink: 0,
                        }}
                      />
                    )}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Input */}
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder={current.placeholder}
            disabled={submitting}
            className="w-full py-3 rounded-card type-body"
            style={{
              paddingLeft: 100,
              paddingRight: 16,
              background: "var(--bg-card)",
              border: `1px solid ${focused || pulsing ? current.color : "var(--border-card)"}`,
              boxShadow: pulsing
                ? `0 0 0 4px ${current.color}28, var(--shadow-card)`
                : focused
                ? `0 0 0 3px ${current.color}1a, var(--shadow-card)`
                : "var(--shadow-card)",
              color: "var(--text-primary)",
              outline: "none",
              opacity: submitting ? 0.6 : 1,
              transition: "border-color 180ms, box-shadow 250ms",
            }}
          />
        </div>
      </form>

      {feedback && (
        <p
          className="type-small px-1"
          style={{ color: "var(--accent-warning)" }}
        >
          {feedback}
        </p>
      )}
    </div>
  );
}
