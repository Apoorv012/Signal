import clsx from "clsx";

import { Icon, type IconName } from "@/components/icons/Icon";
import { Avatar } from "@/components/ui/Avatar";
import type { User } from "@/types";

interface ContactRowProps {
  user: User;
  onSelect: () => void;
  /** Multi-select mode (new group): shows a check mark instead of navigating. */
  selected?: boolean;
}

export function ContactRow({ user, onSelect, selected }: ContactRowProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="hover:bg-hover flex w-full items-center gap-3 px-4 py-2.5 text-left"
    >
      <Avatar name={user.displayName} src={user.avatarUrl} size={44} />
      <span className="text-text min-w-0 flex-1 truncate text-[1rem] font-medium">
        {user.displayName}
      </span>
      {selected !== undefined && (
        <span
          className={clsx(
            "flex size-6 items-center justify-center rounded-full border-2",
            selected ? "border-unread bg-unread text-white" : "border-secondary/50",
          )}
        >
          {selected && <Icon name="check" size={16} />}
        </span>
      )}
    </button>
  );
}

interface ActionRowProps {
  icon: IconName;
  label: string;
  onSelect: () => void;
}

/** "New group" / "Add contact" style row with a round icon. */
export function ActionRow({ icon, label, onSelect }: ActionRowProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="hover:bg-hover flex w-full items-center gap-3 px-4 py-2.5 text-left"
    >
      <span className="bg-field text-text flex size-11 items-center justify-center rounded-full">
        <Icon name={icon} size={22} />
      </span>
      <span className="text-text text-[1rem] font-medium">{label}</span>
    </button>
  );
}
