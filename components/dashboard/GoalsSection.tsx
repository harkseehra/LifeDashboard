"use client";

import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { GoalChip } from "./GoalChip";
import { CheckInPopover, type CheckInGoal } from "@/components/modals/CheckInPopover";

// Mock goals — replaced with Supabase data in Phase 4
const MOCK_GOALS: CheckInGoal[] = [
  { id: "1", title: "Go to gym", emoji: "🌱", streak: 7 },
  { id: "2", title: "Read 20 pages", emoji: "🌿", streak: 12 },
  { id: "3", title: "Save $5 daily", emoji: "🌰", streak: 2 },
  { id: "4", title: "Cold shower", emoji: "🌳", streak: 31 },
];

export function GoalsSection() {
  const [activeGoal, setActiveGoal] = useState<CheckInGoal | null>(null);
  const [checkedIn, setCheckedIn] = useState<Set<string>>(new Set());

  const handleSave = (goalId: string) => {
    setCheckedIn((prev) => new Set(prev).add(goalId));
    setActiveGoal(null);
  };

  return (
    <>
      {/* Horizontal scrollable chip row */}
      <div
        className="flex gap-3 overflow-x-auto"
        style={{ scrollbarWidth: "none", paddingBottom: 2 }}
      >
        {MOCK_GOALS.map((goal) => (
          <GoalChip
            key={goal.id}
            goal={goal}
            checkedIn={checkedIn.has(goal.id)}
            onClick={() => {
              if (!checkedIn.has(goal.id)) setActiveGoal(goal);
            }}
          />
        ))}
      </div>

      <AnimatePresence>
        {activeGoal && (
          <CheckInPopover
            goal={activeGoal}
            onClose={() => setActiveGoal(null)}
            onSave={() => handleSave(activeGoal.id)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
