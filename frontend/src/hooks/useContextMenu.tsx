"use client";

import { useCallback, useState } from "react";

import { ContextMenu, type ContextMenuItem } from "@/components/ui/ContextMenu";

interface OpenMenu {
  x: number;
  y: number;
  items: ContextMenuItem[];
}

/**
 * Right-click menu (desktop only: on touch screens the browser keeps its own long-press behaviour).
 * Usage: `onContextMenu={(e) => openMenu(e, items)}` and render `{menu}` once.
 * Text fields keep the native menu so paste and spell-check still work.
 */
export function useContextMenu() {
  const [open, setOpen] = useState<OpenMenu | null>(null);

  const openMenu = useCallback((event: React.MouseEvent, items: ContextMenuItem[]) => {
    const target = event.target as HTMLElement;
    if (target.closest("input, textarea, [contenteditable=true]")) return;
    if (!window.matchMedia("(min-width: 768px)").matches) return;
    event.preventDefault();
    setOpen({ x: event.clientX, y: event.clientY, items });
  }, []);

  const close = useCallback(() => setOpen(null), []);
  const menu = open ? <ContextMenu {...open} onClose={close} /> : null;

  return { openMenu, menu };
}
