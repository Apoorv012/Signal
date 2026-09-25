"use client";

import { useCallback, useState } from "react";

import { ContextMenu, type ContextMenuItem } from "@/components/ui/ContextMenu";

import { useLongPress } from "./useLongPress";

interface OpenMenu {
  x: number;
  y: number;
  items: ContextMenuItem[];
  header?: (close: () => void) => React.ReactNode;
  /** Phone width: shown as a bottom sheet instead of a popup at the cursor. */
  sheet: boolean;
}

/**
 * One menu, two ways to open it: right-click (mouse / Android long-press) and a touch long-press
 * (iOS). Usage: `<div {...menuProps(items)}>` plus `{menu}` rendered once.
 * Text fields keep the native menu so paste and spell-check still work.
 */
export function useContextMenu() {
  const [open, setOpen] = useState<OpenMenu | null>(null);
  const { bind } = useLongPress();

  const show = useCallback(
    (x: number, y: number, items: ContextMenuItem[], header?: OpenMenu["header"]) => {
      setOpen({ x, y, items, header, sheet: window.matchMedia("(max-width: 767px)").matches });
    },
    [],
  );

  const menuProps = useCallback(
    (items: ContextMenuItem[], header?: OpenMenu["header"]) => ({
      ...bind((point) => show(point.x, point.y, items, header)),
      onContextMenu: (event: React.MouseEvent) => {
        if ((event.target as HTMLElement).closest("input, textarea, [contenteditable=true]"))
          return;
        event.preventDefault();
        show(event.clientX, event.clientY, items, header);
      },
    }),
    [bind, show],
  );

  const close = useCallback(() => setOpen(null), []);
  const menu = open ? <ContextMenu {...open} onClose={close} /> : null;

  return { menuProps, menu };
}
