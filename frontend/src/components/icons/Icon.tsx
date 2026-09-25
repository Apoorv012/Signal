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
}

/**
 * Renders an SVG as a CSS mask so it inherits `currentColor` (text-* utilities recolour it).
 */
export function Icon({ name, size = 24, width, height, className }: IconProps) {
  const url = `url(/icons/${name}.svg)`;
  return (
    <span
      aria-hidden
      className={clsx("inline-block shrink-0 bg-current", className)}
      style={{
        width: width ?? size,
        height: height ?? size,
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
