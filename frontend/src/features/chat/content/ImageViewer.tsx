"use client";

import { useEffect } from "react";

import { Icon } from "@/components/icons/Icon";

/** Full-screen photo view. Esc, the close button or a click on the backdrop closes it. */
export function ImageViewer({
  src,
  alt,
  onClose,
}: {
  src: string;
  alt: string;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.stopPropagation();
      onClose();
    };
    document.addEventListener("keydown", onKey, true);
    return () => document.removeEventListener("keydown", onKey, true);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Photo"
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/90 p-4"
      onClick={(event) => {
        event.stopPropagation();
        onClose();
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        className="max-h-full max-w-full object-contain"
        onClick={(event) => event.stopPropagation()}
      />
      <div className="absolute top-3 right-3 flex gap-2">
        <a
          href={src}
          download={alt}
          onClick={(event) => event.stopPropagation()}
          aria-label="Download"
          title="Download"
          className="flex size-10 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25"
        >
          <Icon name="arrow-down" size={22} />
        </a>
        <button
          type="button"
          aria-label="Close"
          title="Close"
          onClick={onClose}
          className="flex size-10 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25"
        >
          <Icon name="x" size={22} />
        </button>
      </div>
    </div>
  );
}
