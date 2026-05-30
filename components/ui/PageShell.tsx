"use client";

/**
 * PageShell — consistent page-level entrance animation wrapper
 *
 * Wraps every sub-page content with:
 *  - A staggered fade-up entrance (matches Apple's push transition feel)
 *  - Proper motion hierarchy so stagger propagates down to children
 *
 * Usage:
 *   <PageShell>
 *     <header>...</header>
 *     <main>...</main>
 *   </PageShell>
 *
 * Inspired by: Linear's page routing, Vercel Dashboard entrance, iOS UINavigationController
 */

import { motion } from "framer-motion";
import { pageVariants, pageTransition, staggerParent, fadeUp, spring } from "@/lib/animations";
import { ReactNode } from "react";

interface PageShellProps {
  children: ReactNode;
  /** Override the default top padding (default: var(--page-top)) */
  paddingTop?: string | number;
  className?: string;
}

export function PageShell({ children, paddingTop, className = "" }: PageShellProps) {
  return (
    <motion.div
      variants={pageVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      transition={pageTransition}
      className={`flex flex-col gap-8 ${className}`}
      style={{
        paddingTop: paddingTop ?? "var(--page-top)",
        paddingLeft: "var(--page-gutter)",
        paddingRight: "var(--page-gutter)",
        paddingBottom: "clamp(40px, 8vh, 80px)",
        minHeight: "100vh",
      }}
    >
      {children}
    </motion.div>
  );
}

/**
 * PageSection — a staggered section within a PageShell
 * Each section fades up in sequence for the cascading entrance effect
 */
export function PageSection({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <motion.div variants={fadeUp} transition={spring} className={className}>
      {children}
    </motion.div>
  );
}

/**
 * PageHeader — consistent sub-page header with back button row + title
 * The back button and title animate in as separate stagger children
 */
export function PageHeader({
  backButton,
  title,
  subtitle,
  actions,
}: {
  backButton?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <motion.div
      className="flex flex-col gap-3"
      variants={staggerParent}
      initial="hidden"
      animate="visible"
    >
      {backButton && (
        <motion.div variants={fadeUp} transition={spring}>
          {backButton}
        </motion.div>
      )}
      <motion.div
        className="flex items-end justify-between gap-4"
        variants={fadeUp}
        transition={spring}
      >
        <div className="flex flex-col gap-1">
          <h1 className="type-title" style={{ lineHeight: 1.15 }}>
            {title}
          </h1>
          {subtitle && (
            <p className="type-small" style={{ color: "var(--text-tertiary)" }}>
              {subtitle}
            </p>
          )}
        </div>
        {actions && (
          <div className="flex items-center gap-2 shrink-0">{actions}</div>
        )}
      </motion.div>
    </motion.div>
  );
}
