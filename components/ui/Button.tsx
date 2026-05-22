import { ButtonHTMLAttributes, forwardRef } from "react";

type Variant = "primary" | "secondary" | "ghost";
type Size = "sm" | "md";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const variantStyles: Record<Variant, React.CSSProperties> = {
  primary: {
    background: "var(--accent)",
    color: "#fff",
    border: "none",
  },
  secondary: {
    background: "transparent",
    color: "var(--text-primary)",
    border: "1px solid var(--border-card)",
  },
  ghost: {
    background: "transparent",
    color: "var(--accent)",
    border: "none",
  },
};

const sizeStyles: Record<Size, React.CSSProperties> = {
  sm: { padding: "6px 14px", fontSize: "13px", fontWeight: 500 },
  md: { padding: "10px 20px", fontSize: "15px", fontWeight: 500 },
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", style, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        style={{
          borderRadius: "14px",
          cursor: "pointer",
          transition: "background 150ms ease-out, opacity 150ms ease-out",
          fontFamily: "inherit",
          lineHeight: 1,
          ...variantStyles[variant],
          ...sizeStyles[size],
          ...style,
        }}
        onMouseEnter={(e) => {
          const el = e.currentTarget;
          if (variant === "primary") el.style.background = "var(--accent-deep)";
          if (variant === "secondary") el.style.background = "var(--bg-card-hover)";
          if (variant === "ghost") el.style.background = "rgba(0, 122, 255, 0.08)";
        }}
        onMouseLeave={(e) => {
          const el = e.currentTarget;
          el.style.background = variantStyles[variant].background as string;
        }}
        onMouseDown={(e) => {
          e.currentTarget.style.transform = "scale(0.98)";
        }}
        onMouseUp={(e) => {
          e.currentTarget.style.transform = "scale(1)";
        }}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
