/**
 * Renders emoji as Twemoji SVG images for consistent cross-platform appearance.
 * Twemoji is the open-source emoji set (MIT, jdecked/twemoji) used by Discord, GitHub, and Slack.
 * Falls back to native text rendering if the CDN image fails to load.
 */

function toTwemojiSrc(emoji: string): string {
  const codepoints = Array.from(emoji)
    .map((c) => c.codePointAt(0)!.toString(16))
    .filter((cp) => cp !== "fe0f"); // strip variation selector-16
  return `https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/${codepoints.join("-")}.svg`;
}

interface EmojiProps {
  children: string;
  size?: number;
  style?: React.CSSProperties;
  className?: string;
}

export function Emoji({ children, size = 16, style, className }: EmojiProps) {
  return (
    <img
      src={toTwemojiSrc(children)}
      alt={children}
      width={size}
      height={size}
      draggable={false}
      aria-label={children}
      role="img"
      style={{
        display: "inline-block",
        verticalAlign: "-0.15em",
        userSelect: "none",
        flexShrink: 0,
        ...style,
      }}
      className={className}
      onError={(e) => {
        // If CDN fails, hide the img and show text emoji instead
        const img = e.currentTarget;
        img.style.display = "none";
        const span = document.createElement("span");
        span.textContent = children;
        span.style.fontSize = `${size}px`;
        img.parentNode?.insertBefore(span, img);
      }}
    />
  );
}
