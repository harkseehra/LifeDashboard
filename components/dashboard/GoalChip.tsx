"use client";

import type { CheckInGoal } from "@/components/modals/CheckInPopover";

interface GoalChipProps {
  goal: CheckInGoal;
  onClick: () => void;
  isLate?: boolean;
  checkedIn?: boolean;
}

export function GoalChip({
  goal,
  onClick,
  isLate = false,
  checkedIn = false,
}: GoalChipProps) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 px-4 py-3 rounded-card shrink-0 transition-all duration-150"
      style={{
        background: checkedIn ? "rgba(52,199,89,0.08)" : "var(--bg-card)",
        border: `1.5px solid ${
          checkedIn
            ? "var(--accent-success)"
            : isLate
            ? "var(--accent-overdue)"
            : "var(--border-card)"
        }`,
        boxShadow: "var(--shadow-card)",
        cursor: "pointer",
        fontFamily: "inherit",
        textAlign: "left",
      }}
      onMouseEnter={(e) => {
        if (!checkedIn) e.currentTarget.style.background = "var(--bg-card-hover)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = checkedIn
          ? "rgba(52,199,89,0.08)"
          : "var(--bg-card)";
      }}
      onMouseDown={(e) => {
        e.currentTarget.style.transform = "scale(0.97)";
      }}
      onMouseUp={(e) => {
        e.currentTarget.style.transform = "scale(1)";
      }}
    >
      <span style={{ fontSize: 20, lineHeight: 1 }}>{goal.emoji}</span>
      <div className="flex flex-col gap-0.5">
        <span
          className="type-body"
          style={{ color: "var(--text-primary)", whiteSpace: "nowrap" }}
        >
          {goal.title}
        </span>
        <span className="type-small">
          {goal.streak > 0 ? `${goal.streak} day streak` : "Start today"}
        </span>
      </div>
    </button>
  );
}
