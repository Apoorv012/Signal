"use client";

import { useEffect, useRef, useState } from "react";

import { IconButton } from "@/components/ui/IconButton";
import type { IconName } from "@/components/icons/Icon";

export interface MenuItem {
  label: string;
  onSelect: () => void;
}

interface MenuProps {
  icon: IconName;
  label: string;
  items: MenuItem[];
}

/** Icon button that opens a small dropdown; closes on outside click or Esc. */
export function Menu({ icon, label, items }: MenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <IconButton icon={icon} label={label} active={open} onClick={() => setOpen((v) => !v)} />
      {open && (
        <ul
          role="menu"
          className="bg-chat border-divider absolute top-full right-0 z-40 mt-1 min-w-48 rounded-xl border py-1 shadow-xl"
        >
          {items.map((item) => (
            <li key={item.label} role="none">
              <button
                role="menuitem"
                type="button"
                className="hover:bg-hover text-text w-full px-4 py-2.5 text-left text-[0.9375rem]"
                onClick={() => {
                  setOpen(false);
                  item.onSelect();
                }}
              >
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
