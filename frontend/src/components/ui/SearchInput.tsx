import clsx from "clsx";
import type { InputHTMLAttributes } from "react";

import { Icon } from "@/components/icons/Icon";

export function SearchInput({ className, ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label
      className={clsx(
        "bg-field text-secondary focus-within:ring-unread/60 flex h-10 items-center gap-2.5 rounded-[0.625rem] px-3 focus-within:ring-2 md:h-[2.1rem]",
        className,
      )}
    >
      <Icon name="search" size={20} />
      <input
        type="search"
        placeholder="Search"
        className="text-text placeholder:text-secondary min-w-0 flex-1 bg-transparent text-[1rem] outline-none"
        {...rest}
      />
    </label>
  );
}
