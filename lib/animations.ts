import type { Transition, Variants } from "framer-motion";

// ── Easings ────────────────────────────────────────────────────────────────
// Shared easing curves — reference these instead of inline arrays

export const easeOut  = [0.22, 1, 0.36, 1] as const;       // snappy deceleration
export const easeIn   = [0.4, 0, 1, 1] as const;            // smooth acceleration
export const easeInOut = [0.4, 0, 0.2, 1] as const;         // balanced

// ── Spring presets ─────────────────────────────────────────────────────────

// Default: rolling-ball feel — fast start, gentle overshoot, natural settle
export const spring: Transition = {
  type: "spring",
  stiffness: 380,
  damping: 22,
  mass: 0.85,
};

// Snappy: small UI elements (buttons, chips, badges)
export const springSnap: Transition = {
  type: "spring",
  stiffness: 500,
  damping: 28,
  mass: 0.6,
};

// Gentle: large panels, modals, drawers
export const springGentle: Transition = {
  type: "spring",
  stiffness: 260,
  damping: 22,
  mass: 1,
};

// ── Duration presets ───────────────────────────────────────────────────────

// 150ms — hover states, icon swaps, small reveals
export const micro: Transition = {
  duration: 0.15,
  ease: easeOut,
};

// 200ms — mode transitions, badge entrances
export const quick: Transition = {
  duration: 0.2,
  ease: easeOut,
};

// 300ms — page-level fade, weather pill
export const standard: Transition = {
  duration: 0.3,
  ease: easeOut,
};

// ── Variants ───────────────────────────────────────────────────────────────

// Section / card entrance (staggered)
export const fadeUp: Variants = {
  hidden:  { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

// Simple opacity fade (no y movement)
export const fadeIn: Variants = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1 },
  exit:    { opacity: 0 },
};

// Modal / popover entrance
export const scaleIn: Variants = {
  hidden:  { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1 },
  exit:    { opacity: 0, scale: 0.96 },
};

// Stagger container — wraps lists / section groups
export const staggerParent: Variants = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
};
