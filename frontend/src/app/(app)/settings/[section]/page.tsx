import Link from "next/link";
import { notFound } from "next/navigation";

import { Icon } from "@/components/icons/Icon";
import { AccountCard } from "@/features/settings/AccountCard";
import { AppearanceSettings } from "@/features/settings/AppearanceSettings";
import { SETTINGS_SECTIONS } from "@/features/settings/sections";
import { SettingsRows } from "@/features/settings/SettingsRows";

export default async function SettingsSectionPage({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section: sectionId } = await params;
  const section = SETTINGS_SECTIONS.find((s) => s.id === sectionId);
  if (!section) notFound();

  return (
    <div className="bg-chat flex h-full flex-col">
      <header className="flex h-14 shrink-0 items-center gap-1 px-2 md:h-[5.25rem] md:px-8">
        <Link
          href="/settings"
          aria-label="Back"
          className="text-text flex size-10 items-center justify-center md:hidden"
        >
          <Icon name="chevron-left" size={28} />
        </Link>
        <h1 className="text-text text-[1.0625rem] font-semibold md:text-[1.3rem]">
          {section.title}
        </h1>
      </header>
      <div className="min-h-0 flex-1 scrollbar-thin overflow-y-auto px-4 pb-8 md:px-8">
        <div className="max-w-2xl">
          {section.id === "general" && <AccountCard />}
          {section.id === "appearance" ? (
            <AppearanceSettings />
          ) : (
            <SettingsRows rows={section.rows} />
          )}
        </div>
      </div>
    </div>
  );
}
