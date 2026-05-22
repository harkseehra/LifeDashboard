import { HTMLAttributes, forwardRef } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: "sm" | "md" | "lg";
  hoverable?: boolean;
}

const paddingMap = { sm: "16px", md: "20px", lg: "24px" };

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ padding = "lg", hoverable = false, style, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={hoverable ? "group" : ""}
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border-card)",
          borderRadius: "14px",
          boxShadow: "var(--shadow-card)",
          padding: paddingMap[padding],
          transition: hoverable ? "background 150ms ease-out" : undefined,
          ...style,
        }}
        onMouseEnter={
          hoverable
            ? (e) => {
                e.currentTarget.style.background = "var(--bg-card-hover)";
              }
            : undefined
        }
        onMouseLeave={
          hoverable
            ? (e) => {
                e.currentTarget.style.background = "var(--bg-card)";
              }
            : undefined
        }
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = "Card";
