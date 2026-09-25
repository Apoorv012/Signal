"use client";

import { useRouter } from "next/navigation";

import { type Toast, useUiStore } from "@/stores/ui";

/** Second line of a toast: merged toasts show a count instead of only the latest text. */
function toastText(toast: Toast): string {
  if (toast.count <= 1) return toast.message;
  return toast.title ? `${toast.count} new messages` : `${toast.message} (×${toast.count})`;
}

/**
 * Stack of compact notifications: top-right on desktop, a top banner on phones (so they never
 * cover the composer). Tapping one opens its chat (if it has a link) and dismisses it.
 */
export function ToastViewport() {
  const toasts = useUiStore((state) => state.toasts);
  const dismiss = useUiStore((state) => state.dismissToast);
  const router = useRouter();

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-3 top-[max(env(safe-area-inset-top),0.75rem)] z-[60] flex flex-col items-stretch gap-2 md:inset-x-auto md:top-4 md:right-4 md:w-80"
    >
      {toasts.map((toast) => (
        <button
          key={toast.id}
          type="button"
          onClick={() => {
            if (toast.href) router.push(toast.href);
            dismiss(toast.id);
          }}
          className="pointer-events-auto flex flex-col rounded-2xl bg-[#2b2b2b] px-4 py-2.5 text-left text-white shadow-lg ring-1 ring-white/10"
        >
          {toast.title && (
            <span className="truncate text-[0.875rem] font-semibold">{toast.title}</span>
          )}
          <span className="truncate text-[0.9375rem]">{toastText(toast)}</span>
        </button>
      ))}
    </div>
  );
}
