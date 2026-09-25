import { ToastViewport } from "@/components/ui/ToastViewport";
import { RequireAuth } from "@/features/auth/AuthGuards";
import { MobileTabBar } from "@/features/shell/MobileTabBar";
import { ModalHost } from "@/features/shell/ModalHost";
import { NavRail } from "@/features/shell/NavRail";
import { RealtimeProvider } from "@/features/shell/RealtimeProvider";

/** Authenticated app frame: nav rail on desktop, tab bar on mobile, global modals and toasts. */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth>
      <RealtimeProvider>
        <div className="bg-chat flex h-dvh w-full overflow-hidden">
          <NavRail />
          <div className="flex min-w-0 flex-1 flex-col">
            <div className="flex min-h-0 flex-1">{children}</div>
            <MobileTabBar />
          </div>
          <ModalHost />
          <ToastViewport />
        </div>
      </RealtimeProvider>
    </RequireAuth>
  );
}
