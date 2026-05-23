import type { Transition, Variants } from "framer-motion";

// Rolling-ball spring — accelerates fast, gentle overshoot, settles naturally
export const spring: Transition = {
  type: "spring",
  stiffness: 380,
  damping: 22,
  mass: 0.85,
};

// Snappier spring for small UI elements (buttons, chips)
export const springSnap: Transition = {
  type: "spring",
  stiffness: 500,
  damping: 28,
  mass: 0.6,
};

// Slower spring for larger elements (modals, panels)
export const springGentle: Transition = {
  type: "spring",
  stiffness: 260,
  damping: 22,
  mass: 1,
};

// Fade-up entrance — used for staggered section entrances
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

// Scale entrance — used for modals/popovers
export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1 },
  exit:   { opacity: 0, scale: 0.96 },
};

// Stagger container
export const staggerParent: Variants = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
};
