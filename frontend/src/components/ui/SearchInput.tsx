import clsx from "clsx";
import type { InputHTMLAttributes } from "react";

import { Icon } from "@/components/icons/Icon";

export function SearchInput({ className, ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label
      className={clsx(
        "bg-field text-secondary focus-within:ring-unread/60 flex h-10 items-center gap-2.5 rounded-[10px] px-3 focus-within:ring-2",
        className,
      )}
    >
      <Icon name="search" size={20} />
      <input
        type="search"
        placeholder="Search"
        className="text-text placeholder:text-secondary min-w-0 flex-1 bg-transparent text-[16px] outline-none"
        {...rest}
      />
    </label>
  );
}
