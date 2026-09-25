"use client";

import { useUiStore } from "@/stores/ui";

/** Renders the toast queue from the UI store, stacked at the bottom centre. */
export function ToastViewport() {
  const toasts = useUiStore((state) => state.toasts);
  const dismiss = useUiStore((state) => state.dismissToast);

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-24 z-[60] flex flex-col items-center gap-2 px-4"
    >
      {toasts.map((toast) => (
        <button
          key={toast.id}
          type="button"
          onClick={() => dismiss(toast.id)}
          className="pointer-events-auto max-w-sm rounded-full bg-[#2b2b2b] px-5 py-3 text-[0.9375rem] text-white shadow-lg"
        >
          {toast.message}
        </button>
      ))}
    </div>
  );
}
