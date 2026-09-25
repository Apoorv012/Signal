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

export function MemberRow({ member, isMe, canManage, onToggleAdmin, onRemove }: MemberRowProps) {
  const { user, role } = member;
  return (
    <li className="flex items-center gap-3 px-4 py-2.5">
      <Avatar name={user.displayName} src={user.avatarUrl} size={44} />
      <div className="min-w-0 flex-1">
        <p className="text-text truncate text-[1rem] font-medium">
          {user.displayName}
          {isMe && <span className="text-secondary font-normal"> (You)</span>}
        </p>
        {role === "admin" && <p className="text-secondary text-[0.8125rem]">Admin</p>}
      </div>
      {canManage && !isMe && (
        <div className="flex shrink-0 gap-2 text-[0.8125rem] font-medium">
          <button type="button" onClick={onToggleAdmin} className="text-unread hover:underline">
            {role === "admin" ? "Remove admin" : "Make admin"}
          </button>
          <button type="button" onClick={onRemove} className="text-danger hover:underline">
            Remove
          </button>
        </div>
      )}
    </li>
  );
}
