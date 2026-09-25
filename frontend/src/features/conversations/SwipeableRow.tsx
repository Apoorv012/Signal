"use client";

import clsx from "clsx";
import { useCallback, useEffect, useRef, useState } from "react";

import { Icon, type IconName } from "@/components/icons/Icon";

export interface SwipeAction {
  label: string;
  icon: IconName;
  /** Background colour utility, e.g. "bg-unread". */
  className: string;
  onSelect: () => void;
}

interface SwipeableRowProps {
  /** Revealed on the left when the row is dragged to the right (iOS: pin, unread). */
  startActions?: SwipeAction[];
  /** Revealed on the right when the row is dragged to the left (iOS: mute, delete). */
  endActions?: SwipeAction[];
  children: React.ReactNode;
}

const SWIPE_LOCK_PX = 8;

// Only one row stays open: opening another closes the previous one.
let closeOpenRow: (() => void) | null = null;

/**
 * iPhone-style swipe actions for a list row. Touch only (a mouse drag does nothing), and hidden
 * on desktop. A mostly vertical gesture is left to the browser so the list still scrolls.
 */
export function SwipeableRow({ startActions = [], endActions = [], children }: SwipeableRowProps) {
  const [offset, setOffset] = useState(0);
  const [dragging, setDragging] = useState(false);
  const startRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const gesture = useRef<{ x: number; y: number; from: number; axis: "h" | "v" | null } | null>(
    null,
  );
  const justSwiped = useRef(false);

  const close = useCallback(() => setOffset(0), []);
  const settle = (value: number) => {
    setOffset(value);
    if (value !== 0) {
      if (closeOpenRow && closeOpenRow !== close) closeOpenRow();
      closeOpenRow = close;
    } else if (closeOpenRow === close) {
      closeOpenRow = null;
    }
  };
  useEffect(
    () => () => {
      if (closeOpenRow === close) closeOpenRow = null;
    },
    [close],
  );

  const startWidth = () => startRef.current?.offsetWidth ?? 0;
  const endWidth = () => endRef.current?.offsetWidth ?? 0;

  const onPointerDown = (event: React.PointerEvent) => {
    if (event.pointerType !== "touch") return;
    justSwiped.current = false;
    gesture.current = { x: event.clientX, y: event.clientY, from: offset, axis: null };
  };

  const onPointerMove = (event: React.PointerEvent) => {
    const g = gesture.current;
    if (!g) return;
    const dx = event.clientX - g.x;
    const dy = event.clientY - g.y;
    if (!g.axis) {
      if (Math.abs(dx) < SWIPE_LOCK_PX && Math.abs(dy) < SWIPE_LOCK_PX) return;
      g.axis = Math.abs(dx) > Math.abs(dy) ? "h" : "v";
      if (g.axis === "h") {
        try {
          event.currentTarget.setPointerCapture(event.pointerId); // keep receiving moves off-row
        } catch {
          /* pointer already gone: the drag simply ends */
        }
        setDragging(true);
      }
      return;
    }
    if (g.axis !== "h") return;
    justSwiped.current = true;
    setOffset(Math.max(-endWidth(), Math.min(startWidth(), g.from + dx)));
  };

  const onPointerEnd = () => {
    const g = gesture.current;
    gesture.current = null;
    if (g?.axis !== "h") return;
    setDragging(false);
    // Snap open past halfway, otherwise back to closed.
    if (offset > startWidth() / 2) settle(startWidth());
    else if (offset < -endWidth() / 2) settle(-endWidth());
    else settle(0);
  };

  const renderActions = (actions: SwipeAction[]) =>
    actions.map((action) => (
      <button
        key={action.label}
        type="button"
        tabIndex={offset === 0 ? -1 : 0}
        onClick={() => {
          settle(0);
          action.onSelect();
        }}
        className={clsx(
          "flex w-[4.5rem] flex-col items-center justify-center gap-1 text-[0.75rem] font-medium text-white",
          action.className,
        )}
      >
        <Icon name={action.icon} size={22} />
        {action.label}
      </button>
    ));

  return (
    <div className="relative overflow-hidden">
      <div
        ref={startRef}
        aria-hidden={offset <= 0}
        className="absolute inset-y-0 left-0 flex md:hidden"
      >
        {renderActions(startActions)}
      </div>
      <div
        ref={endRef}
        aria-hidden={offset >= 0}
        className="absolute inset-y-0 right-0 flex md:hidden"
      >
        {renderActions(endActions)}
      </div>
      <div
        className={clsx(
          "max-md:bg-chat relative touch-pan-y",
          !dragging && "transition-transform duration-200",
        )}
        style={{ transform: offset === 0 ? undefined : `translateX(${offset}px)` }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerEnd}
        onPointerCancel={onPointerEnd}
        onClickCapture={(event) => {
          // A swipe (or tapping while a row is open) must not open the chat behind it.
          if (justSwiped.current || offset !== 0) {
            event.preventDefault();
            event.stopPropagation();
            justSwiped.current = false;
            if (offset !== 0) settle(0);
          }
        }}
      >
        {children}
      </div>
    </div>
  );
}
