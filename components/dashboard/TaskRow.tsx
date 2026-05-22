"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { format, parseISO, isToday, isPast, isTomorrow } from "date-fns";
import type { Task } from "@/lib/types";

interface TaskRowProps {
  task: Task;
  onComplete: (id: string) => void;
  showDivider?: boolean;
}

export function TaskRow({ task, onComplete, showDivider = true }: TaskRowProps) {
  const [phase, setPhase] = useState<"idle" | "striking" | "fading">("idle");

  const handleCheck = () => {
    if (phase !== "idle") return;
    setPhase("striking");
    // Begin fade-out after strikethrough settles
    setTimeout(() => setPhase("fading"), 200);
    // Notify parent to remove after full animation
    setTimeout(() => onComplete(task.id), 600);
  };

  const isOverdue =
    task.due_date &&
    isPast(parseISO(task.due_date)) &&
    !isToday(parseISO(task.due_date));

  const duePill = (() => {
    if (!task.due_date) return null;
    const d = parseISO(task.due_date);
    if (isToday(d)) return { label: "Today", overdue: false };
    if (isTomorrow(d)) return { label: "Tomorrow", overdue: false };
    if (isOverdue) return { label: format(d, "MMM d"), overdue: true };
    return { label: format(d, "MMM d"), overdue: false };
  })();

  const completing = phase !== "idle";

  return (
    <div
      style={{
        opacity: phase === "fading" ? 0 : 1,
        maxHeight: phase === "fading" ? 0 : 64,
        overflow: "hidden",
        transition:
          phase === "fading"
            ? "opacity 400ms ease, max-height 400ms ease"
            : undefined,
      }}
    >
      <div
        className="flex items-center gap-3 px-6"
        style={{
          paddingTop: 13,
          paddingBottom: 13,
          borderBottom: showDivider ? "1px solid var(--border-subtle)" : "none",
        }}
      >
        {/* Checkbox */}
        <button
          onClick={handleCheck}
          className="shrink-0 w-[18px] h-[18px] rounded-full flex items-center justify-center transition-all duration-150"
          style={{
            border: completing
              ? "2px solid var(--accent)"
              : "1.5px solid var(--border-card)",
            background: completing ? "var(--accent)" : "transparent",
          }}
          aria-label={`Complete: ${task.title}`}
        >
          {completing && <Check size={10} color="white" strokeWidth={3} />}
        </button>

        {/* Title + strikethrough overlay */}
        <span className="flex-1 relative type-body" style={{ color: completing ? "var(--text-tertiary)" : "var(--text-primary)" }}>
          {task.title}
          {completing && (
            <span
              className="absolute left-0 top-1/2 h-px -translate-y-1/2 bg-current"
              style={{ animation: "strikethrough 200ms ease forwards" }}
            />
          )}
        </span>

        {/* Due date pill */}
        {duePill && (
          <span
            className="type-caption shrink-0 px-2 py-0.5 rounded-full"
            style={{
              background: duePill.overdue
                ? "rgba(255, 59, 48, 0.10)"
                : "var(--bg-card-hover)",
              color: duePill.overdue
                ? "var(--accent-overdue)"
                : "var(--text-tertiary)",
            }}
          >
            {duePill.label}
          </span>
        )}
      </div>
    </div>
  );
}
