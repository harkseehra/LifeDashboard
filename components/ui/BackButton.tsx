"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { springStiff, springSnap } from "@/lib/animations";

interface BackButtonProps {
  href?: string;
  label?: string;
}

export function BackButton({ href = "/", label = "Dashboard" }: BackButtonProps) {
  return (
    <Link href={href} passHref legacyBehavior>
      <motion.a
        role="link"
        data-testid="back-button"
        className="inline-flex items-center gap-2 type-small"
        style={{
          height: "34px",
          padding: "0 12px 0 10px",
          borderRadius: "10px",
          background: "var(--bg-card)",
          border: "1px solid var(--border-card)",
          boxShadow: "var(--shadow-card)",
          color: "var(--text-secondary)",
          textDecoration: "none",
          fontWeight: 500,
          cursor: "pointer",
          display: "inline-flex",
          alignItems: "center",
        }}
        initial="rest"
        whileHover="hover"
        whileTap="tap"
        variants={{
          rest: {
            scale: 1,
            color: "var(--text-secondary)",
            boxShadow: "var(--shadow-card)",
          },
          hover: {
            scale: 1.02,
            color: "var(--text-primary)",
            // Apple-style focus glow — accent ring at 12% opacity
            boxShadow: "0 0 0 3px rgba(0,122,255,0.12), var(--shadow-card)",
          },
          tap: {
            scale: 0.95,
            boxShadow: "var(--shadow-card)",
          },
        }}
        transition={springSnap}
        aria-label={`Back to ${label}`}
      >
        {/* Arrow nudges left on hover — directional affordance */}
        <motion.span
          className="flex items-center shrink-0"
          variants={{
            rest:  { x: 0 },
            hover: { x: -3 },
            tap:   { x: -1 },
          }}
          transition={springStiff}
        >
          <ArrowLeft size={13} style={{ color: "var(--accent)" }} />
        </motion.span>

        <span style={{ transform: "translateY(-0.5px)" }}>{label}</span>
      </motion.a>
    </Link>
  );
}
