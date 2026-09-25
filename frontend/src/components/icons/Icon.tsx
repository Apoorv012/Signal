import clsx from "clsx";

/** Icon names map 1:1 to files in /public/icons (Signal's icon set). */
export type IconName =
  | "menu"
  | "chat"
  | "chat-fill"
  | "phone"
  | "phone-fill"
  | "stories"
  | "stories-fill"
  | "settings"
  | "compose"
  | "more"
  | "search"
  | "video"
  | "video-fill"
  | "emoji"
  | "sticker"
  | "mic"
  | "mic-fill"
  | "plus"
  | "camera"
  | "chevron-left"
  | "chevron-right"
  | "chevron-down"
  | "messagestatus-sending"
  | "messagestatus-sent"
  | "messagestatus-delivered"
  | "messagestatus-read"
  | "timer-compact"
  | "note"
  | "file"
  | "play-fill"
  | "pause-fill"
  | "x"
  | "x-circle"
  | "reply"
  | "forward"
  | "copy"
  | "trash"
  | "info"
  | "photo-square"
  | "person"
  | "person-plus-compact"
  | "group"
  | "lock"
  | "bell-slash-fill"
  | "leave"
  | "edit"
  | "send-fill"
  | "check"
  | "check-circle"
  | "heart-plus"
  | "device-laptop"
  | "link"
  | "raise_hand-fill-light"
  | "pin"
  | "color"
  | "help-light"
  | "bell-ring-fill-light"
  | "folder"
  | "globe"
  | "key"
  | "block"
  | "archive"
  | "recent"
  | "qr_code"
  | "at"
  | "share_screen-fill-light"
  | "speaker-x"
  | "arrow-down"
  | "error-circle-compact";

interface IconProps {
  name: IconName;
  /** Rendered size in px (icons are square boxes; glyphs keep their own aspect). */
  size?: number;
  width?: number;
  height?: number;
  className?: string;
  /** Accessible name (also shown as a tooltip). Omit for purely decorative icons. */
  label?: string;
}

/** Sizes are given in px at the 16px root and scale with the root font size (larger on desktop). */
const toRem = (px: number) => `${px / 16}rem`;

/**
 * Renders an SVG as a CSS mask so it inherits `currentColor` (text-* utilities recolour it).
 */
export function Icon({ name, size = 24, width, height, className, label }: IconProps) {
  const url = `url(/icons/${name}.svg)`;
  return (
    <span
      role={label ? "img" : undefined}
      aria-label={label}
      title={label}
      aria-hidden={label ? undefined : true}
      className={clsx("inline-block shrink-0 bg-current", className)}
      style={{
        width: toRem(width ?? size),
        height: toRem(height ?? size),
        maskImage: url,
        WebkitMaskImage: url,
        maskRepeat: "no-repeat",
        WebkitMaskRepeat: "no-repeat",
        maskPosition: "center",
        WebkitMaskPosition: "center",
        maskSize: "contain",
        WebkitMaskSize: "contain",
      }}
    />
  );
}
