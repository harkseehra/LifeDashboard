"use client";

import { useState } from "react";
import { Check, Trash2 } from "lucide-react";
import { Emoji } from "@/components/ui/Emoji";
import { format, parseISO, isToday, isPast, isTomorrow } from "date-fns";
import type { Task } from "@/lib/types";

interface TaskRowProps {
  task: Task;
  onComplete: (id: string) => void;
  onEdit?: (id: string, title: string, due_date: string | null) => void;
  onDelete?: (id: string) => void;
  showDivider?: boolean;
  emoji?: string;
}

export function TaskRow({
  task,
  onComplete,
  onEdit,
  onDelete,
  showDivider = true,
  emoji,
}: TaskRowProps) {
  const [phase, setPhase] = useState<"idle" | "striking" | "fading">("idle");
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [hovered, setHovered] = useState(false);

  const handleCheck = () => {
    if (phase !== "idle") return;
    setPhase("striking");
    setTimeout(() => setPhase("fading"), 200);
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

  const saveEdit = () => {
    const trimmed = editTitle.trim();
    if (trimmed && trimmed !== task.title && onEdit) {
      onEdit(task.id, trimmed, task.due_date);
    } else if (!trimmed) {
      setEditTitle(task.title);
    }
    setIsEditing(false);
  };

  const handleTitleClick = () => {
    if (completing) return;
    setIsEditing(true);
    setEditTitle(task.title);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      saveEdit();
    } else if (e.key === "Escape") {
      setEditTitle(task.title);
      setIsEditing(false);
    }
  };

  const handleBlur = () => {
    saveEdit();
  };

  const showTrash =
    hovered && !isEditing && !completing && onDelete !== undefined;

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
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
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

        {/* Task emoji */}
        {emoji && !isEditing && (
          <span style={{ opacity: completing ? 0.35 : 1, transition: "opacity 300ms ease", flexShrink: 0 }}>
            <Emoji size={15}>{emoji}</Emoji>
          </span>
        )}

        {/* Title area */}
        <div className="flex-1 relative" style={{ minWidth: 0 }}>
          {isEditing ? (
            <input
              autoFocus
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={handleBlur}
              className="w-full type-body"
              style={{
                background: "transparent",
                border: "none",
                borderBottom: "1.5px solid var(--accent)",
                outline: "none",
                color: "var(--text-primary)",
                fontFamily: "inherit",
                padding: 0,
                margin: 0,
              }}
            />
          ) : (
            <span
              className="type-body"
              onClick={handleTitleClick}
              style={{
                color: completing ? "var(--text-tertiary)" : "var(--text-primary)",
                cursor: completing ? "default" : "text",
                display: "block",
              }}
            >
              {task.title}
              {completing && (
                <span
                  className="absolute left-0 top-1/2 h-px -translate-y-1/2 bg-current"
                  style={{ animation: "strikethrough 200ms ease forwards" }}
                />
              )}
            </span>
          )}
        </div>

        {/* Right side: trash or due date pill */}
        {showTrash ? (
          <button
            onClick={() => onDelete!(task.id)}
            className="btn-icon-ghost shrink-0"
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "var(--accent-overdue)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "var(--text-tertiary)";
            }}
            aria-label={`Delete: ${task.title}`}
          >
            <Trash2 size={13} />
          </button>
        ) : (
          duePill && (
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
          )
        )}
      </div>
    </div>
  );
}
