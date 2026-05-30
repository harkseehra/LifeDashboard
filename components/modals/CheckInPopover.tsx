"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import { spring, springGentle, springWobbly } from "@/lib/animations";
import type { Tier } from "@/lib/tiers";

export interface CheckInGoal {
  id: string;
  title: string;
  emoji: string;
  streak: number;
}

type Phase = "question" | "yes" | "no" | "celebration";

interface CheckInPopoverProps {
  goal: CheckInGoal;
  onClose: () => void;
  onSave?: (didIt: boolean, reflection: string) => void;
  celebrationTier?: Tier | null;
}

export function CheckInPopover({
  goal,
  onClose,
  onSave,
  celebrationTier,
}: CheckInPopoverProps) {
  const [phase, setPhase] = useState<Phase>("question");
  const [reflection, setReflection] = useState("");

  const handleSave = () => {
    onSave?.(phase === "yes", reflection);
    if (celebrationTier) {
      setPhase("celebration");
    } else {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.28)", backdropFilter: "blur(6px)" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div
        initial={{ scale: 0.94, opacity: 0, y: 12 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.96, opacity: 0, y: 8 }}
        transition={springGentle}
        className="glass w-full max-w-[380px] rounded-[18px] overflow-hidden"
        style={{
          border: "1px solid var(--border-card)",
          boxShadow: "0 8px 40px rgba(0,0,0,0.18)",
        }}
      >
        {phase === "celebration" && celebrationTier ? (
          <CelebrationScreen tier={celebrationTier} onContinue={onClose} />
        ) : (
          <div className="p-7 flex flex-col gap-6">
            {/* Goal header */}
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span style={{ fontSize: 22 }}>{goal.emoji}</span>
                  <span className="type-title">{goal.title}</span>
                </div>
                <p className="type-small">
                  {goal.streak > 0
                    ? `Day ${goal.streak} of your streak`
                    : "Start your streak today"}
                </p>
              </div>
              <button onClick={onClose} className="btn-icon" style={{ borderRadius: "50%" }}>
                <X size={15} />
              </button>
            </div>

            {phase === "question" && (
              <>
                <p className="type-body">Did you do it today?</p>
                <div className="flex gap-3">
                  <motion.button
                    onClick={() => setPhase("yes")}
                    className="btn-primary btn-lg flex-1"
                    whileTap={{ scale: 0.97 }}
                    transition={spring}
                  >
                    Yes
                  </motion.button>
                  <motion.button
                    onClick={() => setPhase("no")}
                    className="btn-secondary btn-lg flex-1"
                    whileTap={{ scale: 0.97 }}
                    transition={spring}
                  >
                    No
                  </motion.button>
                </div>
              </>
            )}

            {(phase === "yes" || phase === "no") && (
              <>
                <textarea
                  value={reflection}
                  onChange={(e) => setReflection(e.target.value)}
                  placeholder={
                    phase === "yes"
                      ? "What felt good about it?"
                      : "What got in the way?"
                  }
                  rows={3}
                  autoFocus
                  className="w-full type-body px-4 py-3 resize-none"
                  style={{
                    borderRadius: "var(--radius-btn)",
                    background: "var(--bg-card-hover)",
                    border: "1px solid var(--border-card)",
                    color: "var(--text-primary)",
                    outline: "none",
                    fontFamily: "inherit",
                    transition: "border 150ms, box-shadow 150ms",
                  }}
                  onFocus={(e) => {
                    e.target.style.border = "1px solid var(--accent)";
                    e.target.style.boxShadow =
                      "0 0 0 3px rgba(0,122,255,0.12)";
                  }}
                  onBlur={(e) => {
                    e.target.style.border = "1px solid var(--border-card)";
                    e.target.style.boxShadow = "none";
                  }}
                />
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => setPhase("question")}
                    className="type-small"
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "var(--text-tertiary)",
                      fontFamily: "inherit",
                    }}
                  >
                    ← Back
                  </button>
                  <motion.button
                    onClick={handleSave}
                    className="btn-primary"
                    whileTap={{ scale: 0.97 }}
                    transition={spring}
                  >
                    Save
                  </motion.button>
                </div>
              </>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
}

function CelebrationScreen({
  tier,
  onContinue,
}: {
  tier: Tier;
  onContinue: () => void;
}) {
  return (
    <div className="p-8 flex flex-col items-center gap-6 text-center">
      <motion.span
        initial={{ scale: 0, rotate: -15 }}
        animate={{ scale: [0, 1.25, 0.9, 1.08, 1], rotate: [0, 8, -6, 3, 0] }}
        transition={{
          ...springWobbly,
          duration: 0.75,
          times: [0, 0.45, 0.65, 0.8, 1],
        }}
        style={{ fontSize: 96, lineHeight: 1, display: "block" }}
      >
        {tier.emoji}
      </motion.span>
      <div className="flex flex-col gap-2">
        <p className="type-title">{tier.name}</p>
        <p className="type-body" style={{ color: "var(--text-secondary)" }}>
          {tier.message}
        </p>
      </div>
      <motion.button
        onClick={onContinue}
        className="btn-primary btn-lg px-8"
        whileTap={{ scale: 0.97 }}
        transition={spring}
      >
        Continue
      </motion.button>
    </div>
  );
}
