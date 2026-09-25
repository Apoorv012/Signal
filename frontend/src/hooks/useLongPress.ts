"use client";

import { useCallback, useRef } from "react";

const HOLD_MS = 450;
const MOVE_TOLERANCE_PX = 10;

export interface PressPoint {
  x: number;
  y: number;
}

/**
 * Touch long-press. iOS Safari never fires `contextmenu` for a long press, so it is detected
 * with pointer events (touch only: a mouse keeps using right-click). Holding still for 450 ms
 * fires `onPress` once; moving more than 10 px (a scroll or swipe) cancels it.
 * `bind(onPress)` returns props to spread on the pressable element.
 */
export function useLongPress() {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const origin = useRef<PressPoint | null>(null);
  const fired = useRef(false);

  const cancel = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    origin.current = null;
  }, []);

  const bind = useCallback(
    (onPress: (point: PressPoint) => void) => ({
      onPointerDown: (event: React.PointerEvent) => {
        if (event.pointerType !== "touch") return;
        fired.current = false;
        const point = { x: event.clientX, y: event.clientY };
        origin.current = point;
        timer.current = setTimeout(() => {
          fired.current = true;
          navigator.vibrate?.(10); // tiny haptic where supported (not iOS)
          onPress(point);
        }, HOLD_MS);
      },
      onPointerMove: (event: React.PointerEvent) => {
        const start = origin.current;
        if (
          start &&
          Math.hypot(event.clientX - start.x, event.clientY - start.y) > MOVE_TOLERANCE_PX
        )
          cancel();
      },
      onPointerUp: cancel,
      onPointerCancel: cancel,
      // Releasing after a long press must not also count as a tap (e.g. open the chat link).
      onClickCapture: (event: React.MouseEvent) => {
        if (!fired.current) return;
        fired.current = false;
        event.preventDefault();
        event.stopPropagation();
      },
    }),
    [cancel],
  );

  return { bind };
}
