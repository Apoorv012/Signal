import clsx from "clsx";

import { Avatar } from "@/components/ui/Avatar";
import type { Message, User } from "@/types";

import { FileContent } from "./content/FileContent";
import { ImageContent } from "./content/ImageContent";
import { VoiceContent } from "./content/VoiceContent";
import { MessageMeta } from "./MessageMeta";
import { ReactionPills } from "./ReactionPills";

interface MessageBubbleProps {
  message: Message;
  sender?: User;
  outgoing: boolean;
  /** Group conversations show sender name + avatar on incoming messages. */
  isGroup: boolean;
  showSenderName: boolean;
  showAvatar: boolean;
  isRunStart: boolean;
  showTimer: boolean;
}

/** One chat message: avatar gutter (groups), bubble with kind-specific content, reactions. */
export function MessageBubble({
  message,
  sender,
  outgoing,
  isGroup,
  showSenderName,
  showAvatar,
  isRunStart,
  showTimer,
}: MessageBubbleProps) {
  const meta = <MessageMeta message={message} outgoing={outgoing} showTimer={showTimer} />;
  const hasBody = message.body.length > 0;
  const isImage = message.kind === "image";

  return (
    <div
      className={clsx(
        "flex items-end gap-2 px-4 md:px-5",
        outgoing ? "justify-end" : "justify-start",
        isRunStart ? "mt-3" : "mt-[0.125rem]",
      )}
    >
      {!outgoing && isGroup && (
        <div className="w-7 shrink-0 self-end">
          {showAvatar && sender && (
            <Avatar name={sender.displayName} src={sender.avatarUrl} size={28} />
          )}
        </div>
      )}

      <div
        className={clsx(
          "flex max-w-[82%] min-w-0 flex-col md:max-w-[68%]",
          outgoing && "items-end",
        )}
      >
        <div
          className={clsx(
            "flow-root overflow-hidden rounded-[1.25rem]",
            isImage ? "p-0" : "px-3.5 py-2 md:px-[0.9rem] md:py-[0.6rem]",
            outgoing ? "bubble-out" : "bg-bubble-in text-text",
          )}
        >
          {showSenderName && sender && (
            <p
              className={clsx("mb-0.5 text-[0.9375rem] font-semibold", isImage && "px-3.5 pt-2")}
              style={{
                color: `color-mix(in srgb, ${sender.nameColor}, white var(--name-lighten))`,
              }}
            >
              {sender.displayName}
            </p>
          )}

          {isImage && message.attachment && (
            <div className="relative">
              <ImageContent attachment={message.attachment} />
              {!hasBody && (
                <span className="absolute right-2 bottom-2 rounded-full bg-black/45 px-2 py-1 text-white">
                  <MessageMeta
                    message={message}
                    outgoing={false}
                    showTimer={showTimer}
                    className="text-white"
                  />
                </span>
              )}
            </div>
          )}

          {message.kind === "voice" && message.attachment?.durationSec !== undefined && (
            <>
              <VoiceContent
                durationSec={message.attachment.durationSec}
                outgoing={outgoing}
                seed={message.id.length}
              />
              <div className="flex justify-end pt-1">{meta}</div>
            </>
          )}

          {message.kind === "file" && message.attachment && (
            <>
              <FileContent attachment={message.attachment} />
              <div className="flex justify-end">{meta}</div>
            </>
          )}

          {/* Text bodies (also image captions): meta floats to the bottom-right of the last line. */}
          {(message.kind === "text" || (isImage && hasBody)) && (
            <p
              className={clsx(
                "text-[1.0625rem] leading-[1.3] break-words whitespace-pre-wrap md:text-[1rem]",
                isImage && "px-3.5 py-2 md:px-[0.9rem] md:py-[0.6rem]",
              )}
            >
              {message.body}
              <span className="float-right mt-[0.5625rem] ml-3">{meta}</span>
            </p>
          )}
        </div>

        <ReactionPills reactions={message.reactions} outgoing={outgoing} />
      </div>
    </div>
  );
}
