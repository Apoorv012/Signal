import { Icon } from "@/components/icons/Icon";

/** Centered event line, e.g. "Maya set disappearing message time to 1 day." */
export function SystemMessage({ text }: { text: string }) {
  return (
    <p className="text-secondary my-5 px-8 text-center text-[0.9375rem] leading-snug md:text-[0.95rem]">
      <Icon name="timer-compact" size={20} className="mr-2 -mb-[0.3rem]" />
      {text}
    </p>
  );
}
