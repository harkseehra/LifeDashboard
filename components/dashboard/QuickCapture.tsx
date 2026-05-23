"use client";

import { useState, useRef } from "react";
import { Plus } from "lucide-react";
import { parseQuickCapture } from "@/lib/parse-quick-capture";

const PLACEHOLDERS = [
  "Add a task…",
  "Add a task… try /appt dentist friday 3pm",
  "Add a task… try /goal or /appt",
];

interface QuickCaptureProps {
  onAddTask?: (title: string, due_date: string | null) => Promise<void>;
  onAddAppointment?: (title: string, starts_at: string) => Promise<void>;
}

export function QuickCapture({ onAddTask, onAddAppointment }: QuickCaptureProps) {
  const [value, setValue] = useState("");
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const [focused, setFocused] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const cycled = useRef(false);
  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showFeedback = (msg: string) => {
    if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    setFeedback(msg);
    feedbackTimer.current = setTimeout(() => setFeedback(null), 3500);
  };

  const handleFocus = () => {
    setFocused(true);
    if (!cycled.current) {
      cycled.current = true;
      setPlaceholderIdx((i) => (i + 1) % PLACEHOLDERS.length);
    }
  };

  const handleBlur = () => {
    setFocused(false);
    cycled.current = false;
    setPlaceholderIdx((i) => (i + 1) % PLACEHOLDERS.length);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed || submitting) return;

    const parsed = parseQuickCapture(trimmed);

    if (parsed.type === "appointment") {
      if (!parsed.starts_at) {
        showFeedback("Couldn't parse a time — try '/appt dentist friday 3pm'");
        return;
      }
      setSubmitting(true);
      setValue("");
      await onAddAppointment?.(parsed.title, parsed.starts_at.toISOString());
      setSubmitting(false);
      return;
    }

    if (parsed.type === "goal") {
      showFeedback("Goals coming in Phase 4 — try adding a task instead.");
      return;
    }

    if (!parsed.title) return;

    setSubmitting(true);
    setValue("");
    await onAddTask?.(parsed.title, parsed.due_date);
    setSubmitting(false);
  };

  return (
    <div className="flex flex-col gap-1.5">
      <form onSubmit={handleSubmit}>
        <div className="relative flex items-center">
          <Plus
            size={17}
            className="absolute left-4 pointer-events-none"
            style={{ color: "var(--text-tertiary)" }}
          />
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder={PLACEHOLDERS[placeholderIdx]}
            disabled={submitting}
            className="w-full pl-10 pr-4 py-3 rounded-card type-body transition-all duration-150"
            style={{
              background: "var(--bg-card)",
              border: `1px solid ${focused ? "var(--accent)" : "var(--border-card)"}`,
              boxShadow: focused
                ? "0 0 0 3px rgba(0, 122, 255, 0.12), var(--shadow-card)"
                : "var(--shadow-card)",
              color: "var(--text-primary)",
              outline: "none",
              opacity: submitting ? 0.6 : 1,
            }}
          />
        </div>
      </form>

      {feedback && (
        <p className="type-small px-1" style={{ color: "var(--accent-warning)" }}>
          {feedback}
        </p>
      )}
    </div>
  );
}
