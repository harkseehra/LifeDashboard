"use client";

import { motion } from "framer-motion";
import { spring } from "@/lib/animations";
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
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.96 }}
      transition={spring}
      className="flex items-center gap-3 px-4 py-3 rounded-card shrink-0"
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
        cursor: checkedIn ? "default" : "pointer",
        fontFamily: "inherit",
        textAlign: "left",
        transition: "background 180ms ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = checkedIn
          ? "rgba(52,199,89,0.12)"
          : "var(--bg-card-hover)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = checkedIn
          ? "rgba(52,199,89,0.08)"
          : "var(--bg-card)";
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
    </motion.button>
  );
}
