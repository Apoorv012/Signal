import { Icon, type IconName } from "@/components/icons/Icon";
import type { MessageStatus } from "@/types";

const ICON_BY_STATUS: Record<MessageStatus, IconName> = {
  sending: "messagestatus-sending",
  failed: "error-circle-compact",
  sent: "messagestatus-sent",
  delivered: "messagestatus-delivered",
  read: "messagestatus-read",
};

/** Signal's receipt glyphs: sending → sent → delivered (double) → read (filled). */
export function MessageStatusIcon({ status }: { status: MessageStatus }) {
  return <Icon name={ICON_BY_STATUS[status]} width={18} height={12} />;
}
