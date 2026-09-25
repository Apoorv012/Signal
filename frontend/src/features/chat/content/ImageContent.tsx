"use client";

import { useState } from "react";

import { mediaUrl } from "@/lib/api/config";
import type { Attachment } from "@/types";

import { ImageViewer } from "./ImageViewer";

/** Image edge-to-edge inside the bubble (the bubble supplies caption + meta). Click to enlarge. */
export function ImageContent({ attachment }: { attachment: Attachment }) {
  const [open, setOpen] = useState(false);
  const src = mediaUrl(attachment.url) ?? "";
  const ratio =
    attachment.width && attachment.height ? attachment.width / attachment.height : 4 / 3;
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={attachment.fileName}
        loading="lazy"
        style={{ aspectRatio: ratio }}
        onClick={() => setOpen(true)}
        className="block w-full max-w-[21.25rem] cursor-zoom-in object-cover md:w-[21.25rem]"
      />
      {open && <ImageViewer src={src} alt={attachment.fileName} onClose={() => setOpen(false)} />}
    </>
  );
}
