import { MobileTabBar } from "@/features/shell/MobileTabBar";
import { NavRail } from "@/features/shell/NavRail";

/** Authenticated app frame: nav rail on desktop, tab bar on mobile. */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-chat flex h-dvh w-full overflow-hidden">
      <NavRail />
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex min-h-0 flex-1">{children}</div>
        <MobileTabBar />
      </div>
    </div>
  );
}
