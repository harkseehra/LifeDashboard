"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { springSnap } from "@/lib/animations";

interface BackButtonProps {
  href?: string;
  label?: string;
}

export function BackButton({ href = "/", label = "Dashboard" }: BackButtonProps) {
  // Arrow nudge animation when hovering parent
  const arrowVariants = {
    initial: { x: 0 },
    hover: { x: -3 },
  };

  return (
    <Link href={href} passHref legacyBehavior>
      <motion.a
        className="inline-flex items-center gap-2 px-3.5 py-2 type-small spring-hover"
        style={{
          height: "34px",
          borderRadius: "10px",
          background: "var(--bg-card)",
          border: "1px solid var(--border-card)",
          boxShadow: "var(--shadow-card)",
          color: "var(--text-secondary)",
          textDecoration: "none",
          fontWeight: 500,
          cursor: "pointer",
          alignItems: "center",
          display: "inline-flex",
        }}
        initial="initial"
        whileHover="hover"
        whileTap="tap"
        variants={{
          hover: {
            scale: 1.02,
            color: "var(--text-primary)",
            borderColor: "rgba(0, 0, 0, 0.15)",
            background: "var(--bg-card-hover)",
          },
          tap: {
            scale: 0.97,
          },
        }}
        transition={springSnap}
        aria-label={`Back to ${label}`}
      >
        <motion.span
          variants={arrowVariants}
          transition={springSnap}
          className="flex items-center shrink-0"
        >
          <ArrowLeft size={13} style={{ color: "var(--accent)" }} />
        </motion.span>
        <span style={{ transform: "translateY(-0.5px)" }}>{label}</span>
      </motion.a>
    </Link>
  );
}
