import type { Transition, Variants } from "framer-motion";

// ── Easings ────────────────────────────────────────────────────────────────
// Shared easing curves — reference these instead of inline arrays
// These match Apple HIG / Material Design 3 motion tokens

export const easeOut    = [0.22, 1, 0.36, 1] as const;       // snappy deceleration (iOS standard)
export const easeIn     = [0.4, 0, 1, 1] as const;            // smooth acceleration
export const easeInOut  = [0.4, 0, 0.2, 1] as const;          // balanced (Material)
export const easeEmphasized = [0.2, 0, 0, 1] as const;        // Material Design 3 "Emphasized"

// ── Spring presets ─────────────────────────────────────────────────────────
// Tuned to match the physics feel of Apple's UIKit / SwiftUI springs

// Default: rolling-ball feel — fast start, gentle overshoot, natural settle
// Used for: cards, sections, general UI transitions
export const spring: Transition = {
  type: "spring",
  stiffness: 380,
  damping: 22,
  mass: 0.85,
};

// Snappy: small UI elements (buttons, chips, badges)
// Used for: hover/tap feedback, icon swaps
export const springSnap: Transition = {
  type: "spring",
  stiffness: 500,
  damping: 28,
  mass: 0.6,
};

// Stiff: crisp, no-overshoot — iOS-style back button, navbar transitions
// Used for: directional navigation, list reorders
export const springStiff: Transition = {
  type: "spring",
  stiffness: 650,
  damping: 40,
  mass: 0.5,
};

// Gentle: large panels, modals, drawers
// Used for: CheckInPopover, sheet entrances
export const springGentle: Transition = {
  type: "spring",
  stiffness: 260,
  damping: 24,
  mass: 1,
};

// Wobbly: celebratory moments, streak milestones, emoji bursts
// Used for: CelebrationScreen, streak badge on first check-in
export const springWobbly: Transition = {
  type: "spring",
  stiffness: 200,
  damping: 10,
  mass: 0.8,
};

// ── Duration presets ───────────────────────────────────────────────────────

// 100ms — instant feedback, tooltip appearance
export const instant: Transition = {
  duration: 0.1,
  ease: easeOut,
};

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
  ease: easeEmphasized,
};

// 400ms — page entrances, large content reveals
export const pageTransition: Transition = {
  duration: 0.4,
  ease: easeEmphasized,
};

// ── Variants ───────────────────────────────────────────────────────────────

// Section / card entrance (staggered)
export const fadeUp: Variants = {
  hidden:  { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 },
};

// Tighter fade-up for denser list items
export const fadeUpSubtle: Variants = {
  hidden:  { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0 },
};

// Simple opacity fade (no y movement)
export const fadeIn: Variants = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1 },
  exit:    { opacity: 0 },
};

// Modal / popover entrance — matches iOS sheet spring
export const scaleIn: Variants = {
  hidden:  { opacity: 0, scale: 0.94, y: 8 },
  visible: { opacity: 1, scale: 1, y: 0 },
  exit:    { opacity: 0, scale: 0.96, y: 4 },
};

// Page-level entrance — directional slide for sub-page navigation
// Inspired by iOS push transition & Linear's page routing
export const pageVariants: Variants = {
  hidden:  { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 },
  exit:    { opacity: 0, y: -8 },
};

// Stagger container — wraps lists / section groups
// delayChildren: 0.08 gives header elements time to settle first
export const staggerParent: Variants = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.06, delayChildren: 0.08 } },
};

// Dense stagger — for lists with many items (tasks, purchases)
export const staggerDense: Variants = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.04, delayChildren: 0.04 } },
};

// ── Interaction helpers ────────────────────────────────────────────────────
// Pre-composed whileHover/whileTap sets for consistent interactive feel

// Card / chip hover — subtle lift matching Apple's "springy" feedback
export const hoverLift = {
  whileHover: { y: -2, scale: 1.01 },
  whileTap:   { scale: 0.97, y: 0 },
  transition:  springSnap,
} as const;

// Button tap — pure scale feedback, no y movement
export const tapFeedback = {
  whileHover: { scale: 1.02 },
  whileTap:   { scale: 0.96 },
  transition:  springSnap,
} as const;

// Icon button — strong tap feedback for small hit targets
export const iconTap = {
  whileHover: { scale: 1.08 },
  whileTap:   { scale: 0.88 },
  transition:  springStiff,
} as const;
