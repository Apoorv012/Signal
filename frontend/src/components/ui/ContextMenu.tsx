"use client";

import clsx from "clsx";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

export interface ContextMenuItem {
  label: string;
  onSelect: () => void;
  /** Red text for destructive actions. */
  danger?: boolean;
  disabled?: boolean;
  /** Draws a divider above this item. */
  separatorBefore?: boolean;
}

interface ContextMenuProps {
  x: number;
  y: number;
  items: ContextMenuItem[];
  onClose: () => void;
}

const EDGE_PX = 8;

/**
 * Small menu opened at the cursor by a right-click. Closes on outside click, Esc, scroll or
 * resize, and is keyboard navigable (arrows + Enter).
 */
export function ContextMenu({ x, y, items, onClose }: ContextMenuProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ left: x, top: y });
  const [active, setActive] = useState(-1);

  // Keep the menu on screen: flip it left/up when it would overflow the viewport.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const { offsetWidth: width, offsetHeight: height } = el;
    setPosition({
      left: Math.max(EDGE_PX, Math.min(x, window.innerWidth - width - EDGE_PX)),
      top: Math.max(EDGE_PX, Math.min(y, window.innerHeight - height - EDGE_PX)),
    });
  }, [x, y]);

  useEffect(() => {
    const enabled = items.map((item, index) => (item.disabled ? -1 : index)).filter((i) => i >= 0);
    const move = (step: number) =>
      setActive((current) => {
        const at = enabled.indexOf(current);
        if (enabled.length === 0) return -1;
        return enabled[(at + step + enabled.length) % enabled.length];
      });

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      else if (event.key === "ArrowDown") move(1);
      else if (event.key === "ArrowUp") move(-1);
      else if (event.key === "Enter" && active >= 0) {
        onClose();
        items[active].onSelect();
      } else return;
      event.preventDefault();
    };
    const onPointer = (event: PointerEvent) => {
      if (!ref.current?.contains(event.target as Node)) onClose();
    };

    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer, true);
    window.addEventListener("resize", onClose);
    window.addEventListener("blur", onClose);
    document.addEventListener("scroll", onClose, true);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer, true);
      window.removeEventListener("resize", onClose);
      window.removeEventListener("blur", onClose);
      document.removeEventListener("scroll", onClose, true);
    };
  }, [items, active, onClose]);

  return (
    <div
      ref={ref}
      role="menu"
      style={position}
      onContextMenu={(event) => event.preventDefault()}
      className="bg-chat text-text border-divider fixed z-[70] min-w-[13rem] rounded-xl border py-1.5 shadow-2xl"
    >
      {items.map((item, index) => (
        <div key={item.label}>
          {item.separatorBefore && <div className="bg-divider my-1 h-px" />}
          <button
            type="button"
            role="menuitem"
            disabled={item.disabled}
            onMouseEnter={() => !item.disabled && setActive(index)}
            onClick={() => {
              onClose();
              item.onSelect();
            }}
            className={clsx(
              "flex w-full items-center px-4 py-2 text-left text-[0.9375rem] disabled:cursor-not-allowed disabled:opacity-40",
              item.danger && "text-danger",
              active === index && "bg-hover",
            )}
          >
            {item.label}
          </button>
        </div>
      ))}
    </div>
  );
}
