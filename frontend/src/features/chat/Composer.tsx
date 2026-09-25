"use client";

import { useState } from "react";

import { Icon } from "@/components/icons/Icon";
import { IconButton } from "@/components/ui/IconButton";

import { AttachmentTray } from "./AttachmentTray";

/**
 * Message input row.
 * Desktop: [emoji] [ input ] [sticker] [mic] [+]
 * iPhone:  [+] [ input · sticker ] [camera] [mic]   (the + turns into a close button when open)
 */
export function Composer() {
  const [trayOpen, setTrayOpen] = useState(false);

  const toggleTray = (
    <IconButton
      icon={trayOpen ? "x" : "plus"}
      label={trayOpen ? "Close attachments" : "Attach"}
      onClick={() => setTrayOpen((open) => !open)}
      className={trayOpen ? "bg-secondary/60 hover:bg-secondary/70 rounded-full text-white" : ""}
    />
  );

  return (
    <div className="bg-chat/90 shrink-0 pb-[max(env(safe-area-inset-bottom),8px)] backdrop-blur">
      <div className="flex items-center gap-1 px-3 py-2 md:gap-2 md:px-5 md:py-3">
        <div className="md:hidden">{toggleTray}</div>
        <IconButton icon="emoji" label="Emoji" className="max-md:hidden" />

        <div className="bg-field flex h-11 min-w-0 flex-1 items-center rounded-full px-4">
          <input
            placeholder="Message"
            className="text-text placeholder:text-secondary min-w-0 flex-1 bg-transparent text-[18px] outline-none md:text-[16px]"
          />
          <Icon name="sticker" size={26} className="text-text ml-2 md:hidden" />
        </div>

        <IconButton icon="sticker" label="Stickers" className="max-md:hidden" />
        <IconButton icon="camera" label="Camera" className="md:hidden" />
        <IconButton icon="mic" label="Voice message" />
        <div className="max-md:hidden">{toggleTray}</div>
      </div>
      {trayOpen && <AttachmentTray />}
    </div>
  );
}
