import { Icon } from "@/components/icons/Icon";

interface AuthShellProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}

/** Shared frame for the onboarding screens: brand mark, heading, and a centered form column. */
export function AuthShell({ title, subtitle, children }: AuthShellProps) {
  return (
    <main className="bg-chat flex min-h-dvh items-center justify-center px-6 py-10">
      <div className="flex w-full max-w-[26rem] flex-col items-center gap-6 text-center">
        <span className="bg-unread flex size-20 items-center justify-center rounded-[1.6rem] text-white">
          <Icon name="chat-fill" size={44} />
        </span>
        <div className="flex flex-col gap-2">
          <h1 className="text-text text-[1.625rem] font-semibold">{title}</h1>
          <p className="text-secondary text-[1rem] leading-snug">{subtitle}</p>
        </div>
        <div className="w-full text-left">{children}</div>
      </div>
    </main>
  );
}
