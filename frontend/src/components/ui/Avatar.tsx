/* eslint-disable @next/next/no-img-element -- small user-supplied avatars, next/image adds nothing */
import clsx from "clsx";

import { Icon } from "@/components/icons/Icon";
import type { ConversationType } from "@/types";

interface AvatarProps {
  name: string;
  src?: string;
  size?: number;
  /** Note to Self has a dedicated glyph avatar. */
  variant?: ConversationType;
  className?: string;
}

const PALETTE = ["#6a3fe0", "#c2185b", "#2e7d32", "#00838f", "#ef6c00", "#4527a0", "#ad1457"];

function colorFor(name: string) {
  let hash = 0;
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return PALETTE[hash % PALETTE.length];
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

/** Round avatar: photo when available, else Signal-style coloured initials. */
export function Avatar({ name, src, size = 48, variant, className }: AvatarProps) {
  const box = { width: size, height: size };

  if (variant === "note_to_self") {
    return (
      <span
        style={box}
        className={clsx(
          "bg-note-bg text-note-fg flex shrink-0 items-center justify-center rounded-full",
          className,
        )}
      >
        <Icon name="note" size={size * 0.5} />
      </span>
    );
  }

  if (src) {
    return (
      <img
        src={src}
        alt=""
        style={box}
        className={clsx("shrink-0 rounded-full object-cover", className)}
      />
    );
  }

  return (
    <span
      style={{ ...box, backgroundColor: colorFor(name), fontSize: size * 0.38 }}
      className={clsx(
        "flex shrink-0 items-center justify-center rounded-full font-medium text-white",
        className,
      )}
    >
      {initials(name)}
    </span>
  );
}
