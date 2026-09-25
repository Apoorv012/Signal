import { Icon } from "@/components/icons/Icon";

/** Centered event line, e.g. "Maya set disappearing message time to 1 day." */
export function SystemMessage({ text }: { text: string }) {
  return (
    <div className="text-secondary my-4 flex items-center justify-center gap-2 px-6 text-center text-[15px]">
      <Icon name="timer-compact" size={20} />
      <span>{text}</span>
    </div>
  );
}
