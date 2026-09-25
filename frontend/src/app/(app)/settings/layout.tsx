import { SettingsNav } from "@/features/settings/SettingsNav";

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SettingsNav />
      <main className="flex min-w-0 flex-1 flex-col">{children}</main>
    </>
  );
}
