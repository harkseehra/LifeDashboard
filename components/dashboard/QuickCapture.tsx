"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { parseQuickCapture } from "@/lib/parse-quick-capture";
import { spring } from "@/lib/animations";

type CaptureMode = "task" | "appointment" | "goal";

const MODES = [
  {
    key: "task" as const,
    label: "Task",
    icon: "✓",
    color: "#007AFF",
    placeholder: "What needs to get done?",
  },
  {
    key: "appointment" as const,
    label: "Appointment",
    icon: "◷",
    color: "#34C759",
    placeholder: "Dentist friday 3pm…",
  },
  {
    key: "goal" as const,
    label: "Goal",
    icon: "◎",
    color: "#FF9500",
    placeholder: "Daily habit to build…",
  },
];

interface QuickCaptureProps {
  onAddTask?: (title: string, due_date: string | null) => Promise<void>;
  onAddAppointment?: (title: string, starts_at: string) => Promise<void>;
  onAddGoal?: (title: string) => Promise<void>;
}

export function QuickCapture({ onAddTask, onAddAppointment, onAddGoal }: QuickCaptureProps) {
  const [value, setValue] = useState("");
  const [mode, setMode] = useState<CaptureMode>("task");
  const [focused, setFocused] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const current = MODES.find((m) => m.key === mode)!;

  const selectMode = (m: CaptureMode) => {
    setMode(m);
    setTimeout(() => inputRef.current?.focus(), 20);
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

    const parsed = parseQuickCapture(trimmed);
    if (!parsed.title) return;
    setSubmitting(true);
    setValue("");
    await onAddTask?.(parsed.title, parsed.type === "task" ? parsed.due_date : null);
    setSubmitting(false);
  };

  return (
    <div className="flex flex-col gap-1.5">
      <form onSubmit={handleSubmit}>
        <motion.div
          style={{
            background: "var(--bg-card)",
            borderRadius: 16,
            overflow: "hidden",
            border: `1px solid ${focused ? current.color + "55" : "var(--border-card)"}`,
            boxShadow: focused
              ? `0 0 0 4px ${current.color}14, var(--shadow-elevated)`
              : "var(--shadow-card)",
            transition: "border-color 220ms ease, box-shadow 280ms ease",
          }}
        >
          {/* ── Mode tabs ── */}
          <div
            className="flex"
            style={{
              borderBottom: "1px solid var(--border-subtle)",
              paddingLeft: 6,
            }}
          >
            {MODES.map((m) => (
              <button
                key={m.key}
                type="button"
                onClick={() => selectMode(m.key)}
                className="relative flex items-center gap-1.5 px-4 py-2.5"
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: mode === m.key ? m.color : "var(--text-tertiary)",
                  fontFamily: "inherit",
                  fontSize: 12,
                  fontWeight: mode === m.key ? 600 : 400,
                  letterSpacing: "0.01em",
                  transition: "color 180ms ease",
                  userSelect: "none",
                }}
              >
                <span style={{ fontSize: 13, lineHeight: 1 }}>{m.icon}</span>
                <span>{m.label}</span>

                {mode === m.key && (
                  <motion.div
                    layoutId="mode-indicator"
                    className="absolute bottom-0 left-3 right-3"
                    style={{
                      height: 2,
                      background: m.color,
                      borderRadius: "2px 2px 0 0",
                    }}
                    transition={spring}
                  />
                )}
              </button>
            ))}
          </div>

          {/* ── Input row ── */}
          <div
            className="flex items-center gap-3 px-5"
            style={{ minHeight: 56 }}
          >
            {/* Animated mode icon */}
            <AnimatePresence mode="wait">
              <motion.span
                key={mode}
                initial={{ opacity: 0, scale: 0.4, rotate: -15 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                exit={{ opacity: 0, scale: 0.4, rotate: 15 }}
                transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                style={{
                  fontSize: 17,
                  color: current.color,
                  fontWeight: 600,
                  flexShrink: 0,
                  lineHeight: 1,
                  display: "block",
                }}
              >
                {current.icon}
              </motion.span>
            </AnimatePresence>

            {/* Bare input — no border, blends into card */}
            <input
              ref={inputRef}
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              placeholder={current.placeholder}
              disabled={submitting}
              className="flex-1 type-body bg-transparent outline-none"
              style={{
                border: "none",
                color: "var(--text-primary)",
                opacity: submitting ? 0.5 : 1,
              }}
            />

            {/* ↵ hint badge */}
            <AnimatePresence>
              {value && !submitting && (
                <motion.kbd
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
                  className="type-caption shrink-0"
                  style={{
                    color: "var(--text-tertiary)",
                    background: "var(--bg-card-hover)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: 6,
                    padding: "2px 7px",
                    fontFamily: "inherit",
                    letterSpacing: "0.04em",
                  }}
                >
                  ↵
                </motion.kbd>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </form>

      <AnimatePresence>
        {feedback && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="type-small px-1"
            style={{ color: "var(--accent-warning)" }}
          >
            {feedback}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
