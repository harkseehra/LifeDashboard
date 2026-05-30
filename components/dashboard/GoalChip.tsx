"use client";

import { motion } from "framer-motion";
import { springSnap } from "@/lib/animations";
import { Emoji } from "@/components/ui/Emoji";
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
  const borderColor = checkedIn
    ? "var(--accent-success)"
    : isLate
    ? "var(--accent-overdue)"
    : "var(--border-card)";

  return (
    <motion.button
      onClick={onClick}
      // ── Clean Framer Motion variants: no inline JS hover handlers ──
      initial="rest"
      whileHover={checkedIn ? "checkedHover" : "hover"}
      whileTap="tap"
      variants={{
        rest: {
          scale: 1,
          y: 0,
          background: checkedIn ? "rgba(52,199,89,0.08)" : "var(--bg-card)",
        },
        hover: {
          scale: 1.02,
          y: -2,
          background: "var(--bg-card-hover)",
        },
        checkedHover: {
          scale: 1.01,
          y: -1,
          background: "rgba(52,199,89,0.14)",
        },
        tap: {
          scale: 0.96,
          y: 0,
        },
      }}
      transition={springSnap}
      className="flex items-center gap-3 px-4 py-3 shrink-0"
      style={{
        borderRadius: 14,
        border: `1.5px solid ${borderColor}`,
        boxShadow: "var(--shadow-card)",
        cursor: checkedIn ? "default" : "pointer",
        fontFamily: "inherit",
        textAlign: "left",
        // border-color transition stays CSS for performance — only
        // Framer handles transform/background
        transition: "border-color 200ms ease",
      }}
    >
      <Emoji size={20}>{goal.emoji}</Emoji>
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
