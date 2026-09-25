import type { IconName } from "@/components/icons/Icon";
import { Icon } from "@/components/icons/Icon";

interface ComingSoonProps {
  icon: IconName;
  title: string;
  description?: string;
}

/** Placeholder for sections the assignment allows as "Coming soon" (calls, stories, ...). */
export function ComingSoon({ icon, title, description }: ComingSoonProps) {
  return (
    <div className="bg-chat flex h-full flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
      <span className="bg-field text-secondary flex size-16 items-center justify-center rounded-full">
        <Icon name={icon} size={32} />
      </span>
      <h1 className="text-text text-xl font-semibold">{title}</h1>
      <p className="text-secondary max-w-xs text-[15px]">{description ?? "Coming soon"}</p>
    </div>
  );
}
