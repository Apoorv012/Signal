import { Avatar } from "@/components/ui/Avatar";
import type { User } from "@/types";

/** Incoming-style bubble with three bouncing dots, shown while someone is typing. */
export function TypingIndicator({ users, isGroup }: { users: User[]; isGroup: boolean }) {
  if (users.length === 0) return null;
  return (
    <div className="mt-3 flex items-end gap-2 px-4 md:px-5" aria-label="Typing">
      {isGroup && <Avatar name={users[0].displayName} src={users[0].avatarUrl} size={28} />}
      <div className="bg-bubble-in flex items-center gap-1 rounded-[1.25rem] px-4 py-3.5">
        {[0, 150, 300].map((delay) => (
          <span
            key={delay}
            className="bg-secondary size-2 animate-bounce rounded-full"
            style={{ animationDelay: `${delay}ms` }}
          />
        ))}
      </div>
    </div>
  );
}
