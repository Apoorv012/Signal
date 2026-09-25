"use client";

import { useEffect } from "react";

import { Icon } from "@/components/icons/Icon";

interface ModalProps {
  title: string;
  onClose: () => void;
  /** Optional back arrow (multi-step flows). */
  onBack?: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

/** Centered dialog on desktop, bottom sheet on iPhone. Closes on Esc or backdrop click. */
export function Modal({ title, onClose, onBack, children, footer }: ModalProps) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 md:items-center"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="bg-chat text-text flex max-h-[85dvh] w-full flex-col overflow-hidden rounded-t-3xl shadow-2xl md:w-[26rem] md:rounded-2xl"
      >
        <header className="border-divider relative flex h-14 shrink-0 items-center justify-center border-b px-12">
          {onBack && (
            <button
              type="button"
              aria-label="Back"
              onClick={onBack}
              className="hover:bg-hover absolute left-3 flex size-9 items-center justify-center rounded-lg"
            >
              <Icon name="chevron-left" size={22} />
            </button>
          )}
          <h2 className="text-[1.0625rem] font-semibold">{title}</h2>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="hover:bg-hover absolute right-3 flex size-9 items-center justify-center rounded-lg"
          >
            <Icon name="x" size={22} />
          </button>
        </header>

        <div className="min-h-0 flex-1 scrollbar-thin overflow-y-auto">{children}</div>
        {footer && <footer className="border-divider shrink-0 border-t p-4">{footer}</footer>}
      </div>
    </div>
  );
}
