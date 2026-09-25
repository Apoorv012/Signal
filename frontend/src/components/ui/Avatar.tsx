/* eslint-disable @next/next/no-img-element -- small user-supplied avatars, next/image adds nothing */
import clsx from "clsx";

import { Icon } from "@/components/icons/Icon";
import { mediaUrl } from "@/lib/api/config";
import type { ConversationType } from "@/types";

interface AvatarProps {
  name: string;
  /** Backend media path ("/media/..."), a blob: preview URL, or nothing (initials are shown). */
  src?: string | null;
  size?: number;
  /** Note to Self has a dedicated glyph avatar. */
  variant?: ConversationType;
  /** Shows a green presence dot (one-to-one chats). */
  online?: boolean;
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
export function Avatar({ name, src, size = 48, variant, online, className }: AvatarProps) {
  const box = { width: `${size / 16}rem`, height: `${size / 16}rem` };
  const url = mediaUrl(src);

  let face: React.ReactNode;
  if (variant === "note_to_self") {
    face = (
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
  } else if (url) {
    face = (
      <img
        src={url}
        alt=""
        style={box}
        className={clsx("shrink-0 rounded-full object-cover", className)}
      />
    );
  } else if (!/\p{L}/u.test(name)) {
    // No letters to take initials from (an unnamed account shows its phone number): silhouette.
    face = (
      <span
        style={box}
        className={clsx(
          "bg-field text-secondary flex shrink-0 items-end justify-center overflow-hidden rounded-full",
          className,
        )}
      >
        <svg viewBox="0 0 100 100" className="size-full" fill="currentColor" aria-hidden>
          <circle cx="50" cy="38" r="17" />
          <path d="M14 100c0-22 16-36 36-36s36 14 36 36z" />
        </svg>
      </span>
    );
  } else {
    face = (
      <span
        style={{ ...box, backgroundColor: colorFor(name), fontSize: `${(size * 0.38) / 16}rem` }}
        className={clsx(
          "flex shrink-0 items-center justify-center rounded-full font-medium text-white",
          className,
        )}
      >
        {initials(name)}
      </span>
    );
  }

  if (!online) return face;
  return (
    <span className="relative shrink-0">
      {face}
      <span
        aria-label="Online"
        className="border-list absolute right-0 bottom-0 size-[28%] rounded-full border-2 bg-[#3dc46a]"
      />
    </span>
  );
}
