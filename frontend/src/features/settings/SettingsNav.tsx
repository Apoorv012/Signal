"use client";

import clsx from "clsx";
import Link from "next/link";
import { useParams } from "next/navigation";

import { Icon } from "@/components/icons/Icon";

import { SETTINGS_SECTIONS } from "./sections";

/** Settings list column. On iPhone it is a full screen that gives way to the selected section. */
export function SettingsNav() {
  const { section } = useParams<{ section?: string }>();

  return (
    <aside
      className={clsx(
        "bg-chat md:bg-list md:border-divider min-h-0 w-full shrink-0 flex-col md:flex md:w-[24rem] md:border-r",
        section ? "hidden" : "flex",
      )}
    >
      <h1 className="text-text flex h-14 items-center px-4 text-[1.0625rem] font-semibold max-md:justify-center md:h-[5.25rem] md:px-[1.8rem] md:text-[1.3rem]">
        Settings
      </h1>
      <nav className="flex-1 scrollbar-thin overflow-y-auto px-2 pb-4">
        {SETTINGS_SECTIONS.map((item) => (
          <Link
            key={item.id}
            href={`/settings/${item.id}`}
            className={clsx(
              "text-text flex items-center gap-4 rounded-xl px-4 py-3.5 text-[1rem] transition-colors",
              section === item.id ? "md:bg-selected" : "hover:bg-hover",
            )}
          >
            <Icon name={item.icon} size={24} />
            <span className="flex-1">{item.title}</span>
            <Icon name="chevron-right" size={20} className="text-secondary md:hidden" />
          </Link>
        ))}
      </nav>
    </aside>
  );
}
