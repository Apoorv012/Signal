import clsx from "clsx";
import type { InputHTMLAttributes } from "react";

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function TextField({ label, error, className, id, ...rest }: TextFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-secondary text-[0.875rem] font-medium">
          {label}
        </label>
      )}
      <input
        id={id}
        className={clsx(
          "bg-field text-text placeholder:text-secondary h-12 rounded-xl px-4 text-[1rem] outline-none focus:ring-2",
          error ? "ring-danger/70 ring-2" : "focus:ring-unread/60",
          className,
        )}
        {...rest}
      />
      {error && <p className="text-danger text-[0.875rem]">{error}</p>}
    </div>
  );
}
