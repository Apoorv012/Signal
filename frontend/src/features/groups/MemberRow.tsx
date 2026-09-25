import { Icon, type IconName } from "@/components/icons/Icon";
import { Avatar } from "@/components/ui/Avatar";
import type { Member } from "@/types";

interface MemberRowProps {
  member: Member;
  isMe: boolean;
  /** Admin-only actions, shown for other members. */
  canManage: boolean;
  onToggleAdmin: () => void;
  onRemove: () => void;
}

function ActionButton({
  icon,
  label,
  className,
  onClick,
}: {
  icon: IconName;
  label: string;
  className: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={`hover:bg-hover flex size-9 items-center justify-center rounded-lg transition-colors ${className}`}
    >
      <Icon name={icon} size={22} />
    </button>
  );
}

export function MemberRow({ member, isMe, canManage, onToggleAdmin, onRemove }: MemberRowProps) {
  const { user, role } = member;
  const isAdmin = role === "admin";
  return (
    <li className="flex items-center gap-3 px-4 py-2.5">
      <Avatar name={user.displayName} src={user.avatarUrl} size={44} />
      <div className="min-w-0 flex-1">
        <p className="text-text truncate text-[1rem] font-medium">
          {user.displayName}
          {isMe && <span className="text-secondary font-normal"> (You)</span>}
        </p>
        {isAdmin && (
          <p className="text-unread flex items-center gap-1 text-[0.8125rem]">
            <Icon name="key" size={14} />
            Admin
          </p>
        )}
      </div>
      {canManage && !isMe && (
        <div className="flex shrink-0 gap-1">
          <ActionButton
            icon={isAdmin ? "block" : "key"}
            label={isAdmin ? "Remove admin" : "Make admin"}
            className={isAdmin ? "text-secondary" : "text-unread"}
            onClick={onToggleAdmin}
          />
          <ActionButton
            icon="x-circle"
            label="Remove from group"
            className="text-danger"
            onClick={onRemove}
          />
        </div>
      )}
    </li>
  );
}
