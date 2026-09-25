import { Icon } from "@/components/icons/Icon";

/** Desktop empty state; on iPhone the section list fills the screen. */
export default function SettingsIndexPage() {
  return (
    <div className="text-secondary hidden h-full flex-col items-center justify-center gap-3 md:flex">
      <Icon name="settings" size={48} />
      <p className="text-[0.9375rem]">Choose a setting</p>
    </div>
  );
}
