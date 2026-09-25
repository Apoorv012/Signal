"use client";

import { useEffect } from "react";

import { Button } from "./Button";

interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}

/** Small "are you sure?" dialog for destructive actions. Layers above other modals. */
export function ConfirmDialog({
  title,
  message,
  confirmLabel,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  useEffect(() => {
    // Capture phase + stopPropagation: Esc closes only this dialog, not the modal beneath it.
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.stopPropagation();
      onCancel();
    };
    document.addEventListener("keydown", onKey, true);
    return () => document.removeEventListener("keydown", onKey, true);
  }, [onCancel]);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-6"
      onMouseDown={(event) => event.target === event.currentTarget && onCancel()}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-label={title}
        className="bg-chat text-text w-full max-w-[21rem] rounded-2xl p-5 shadow-2xl"
      >
        <h2 className="text-[1.0625rem] font-semibold">{title}</h2>
        <p className="text-secondary mt-1.5 text-[0.9375rem]">{message}</p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" className="h-10 px-5" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="danger" className="h-10 px-5" autoFocus onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
