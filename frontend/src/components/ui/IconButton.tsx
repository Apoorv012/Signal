import clsx from "clsx";
import type { ButtonHTMLAttributes } from "react";

import { Icon, type IconName } from "@/components/icons/Icon";

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: IconName;
  label: string;
  iconSize?: number;
  active?: boolean;
}

export function IconButton({
  icon,
  label,
  iconSize = 24,
  active,
  className,
  ...rest
}: IconButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={clsx(
        "text-text hover:bg-hover flex size-10 shrink-0 items-center justify-center rounded-lg transition-colors",
        active && "bg-selected",
        className,
      )}
      {...rest}
    >
      <Icon name={icon} size={iconSize} />
    </button>
  );
}
