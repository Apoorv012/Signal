import clsx from "clsx";
import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "danger";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  fullWidth?: boolean;
}

const VARIANTS: Record<Variant, string> = {
  primary: "bg-unread text-white hover:brightness-110",
  secondary: "bg-field text-text hover:brightness-95",
  danger: "bg-danger text-white hover:brightness-110",
};

export function Button({ variant = "primary", fullWidth, className, ...rest }: ButtonProps) {
  return (
    <button
      type="button"
      className={clsx(
        "h-11 rounded-full px-6 text-[1rem] font-medium transition disabled:cursor-not-allowed disabled:opacity-40",
        VARIANTS[variant],
        fullWidth && "w-full",
        className,
      )}
      {...rest}
    />
  );
}
