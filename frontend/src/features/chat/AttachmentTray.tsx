"use client";

import { Icon, type IconName } from "@/components/icons/Icon";
import { useComingSoon } from "@/hooks/useComingSoon";

const ACTIONS: { label: string; icon?: IconName; text?: string }[] = [
  { label: "Photos", icon: "photo-square" },
  { label: "GIF", text: "GIF" },
  { label: "File", icon: "file" },
  { label: "Contact", icon: "person" },
];

/** Panel opened by the + button. Photos and File are wired to real uploads in the attachments step. */
export function AttachmentTray() {
  const soon = useComingSoon();

  return (
    <div className="shrink-0 px-4 pt-3 pb-4 md:px-6">
      <div className="flex scrollbar-thin gap-4 overflow-x-auto">
        {ACTIONS.map((action) => (
          <button
            key={action.label}
            type="button"
            onClick={soon(action.label)}
            className="text-secondary flex shrink-0 flex-col items-center gap-1.5"
          >
            <span className="bg-field text-text flex h-14 w-[5.5rem] items-center justify-center rounded-full md:w-16">
              {action.icon ? (
                <Icon name={action.icon} size={28} />
              ) : (
                <b className="text-[0.9375rem]">{action.text}</b>
              )}
            </span>
            <span className="text-[0.9375rem]">{action.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
