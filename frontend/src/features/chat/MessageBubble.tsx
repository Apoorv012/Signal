import clsx from "clsx";

import { Icon } from "@/components/icons/Icon";
import { Avatar } from "@/components/ui/Avatar";
import { LinkifiedText } from "@/components/ui/LinkifiedText";
import type { Message, User } from "@/types";

import { FileContent } from "./content/FileContent";
import { ImageContent } from "./content/ImageContent";
import { VoiceContent } from "./content/VoiceContent";
import { MessageMeta } from "./MessageMeta";
import { ReactionPills } from "./ReactionPills";
import { ReplyQuote } from "./ReplyQuote";

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
  /** Search term to highlight inside the text. */
  highlight?: string;
  /** Briefly tint the row (a search result was just opened). */
  flash?: boolean;
  /** Selection mode: shows a check circle and a click toggles the message. */
  selecting?: boolean;
  selected?: boolean;
  onToggleSelect?: () => void;
  /** Tap on a reaction pill: add / remove my reaction with that emoji. */
  onReact?: (emoji: string) => void;
  /** Tap on the quoted message of a reply: jump to the original. */
  onOpenQuote?: () => void;
  /** Right-click / long-press handlers from `useContextMenu().menuProps`. */
  menuProps?: React.HTMLAttributes<HTMLDivElement>;
  onRetry: (message: Message) => void;
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
  highlight,
  flash,
  selecting,
  selected,
  onToggleSelect,
  menuProps,
  onReact,
  onOpenQuote,
  onRetry,
}: MessageBubbleProps) {
  const meta = <MessageMeta message={message} outgoing={outgoing} showTimer={showTimer} />;
  const hasBody = message.body.length > 0;
  const isImage = message.kind === "image" && message.attachment !== null;

  return (
    <div
      data-message-id={message.id}
      {...menuProps}
      // Capture: while selecting, a click anywhere on the row (even on a link) only toggles it.
      onClickCapture={(event) => {
        menuProps?.onClickCapture?.(event); // swallows the click that ends a long press
        if (event.isPropagationStopped() || !selecting) return;
        event.preventDefault();
        event.stopPropagation();
        onToggleSelect?.();
      }}
      className={clsx(
        "touch-menu-target relative flex items-end gap-2",
        selecting ? "cursor-pointer pr-4 pl-11 md:pr-5 md:pl-12" : "px-4 md:px-5",
        selected && "bg-unread/10",
        flash && "message-flash",
        outgoing ? "justify-end" : "justify-start",
        isRunStart ? "mt-3 md:mt-5" : "mt-[0.125rem]",
      )}
    >
      {selecting && (
        <span
          aria-hidden
          className={clsx(
            "absolute top-1/2 left-4 flex size-6 -translate-y-1/2 items-center justify-center rounded-full border-2 md:left-5",
            selected ? "border-unread bg-unread text-white" : "border-secondary/50",
          )}
        >
          {selected && <Icon name="check" size={16} />}
        </span>
      )}

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

          {message.replyTo && (
            <div className={clsx(isImage && "px-3 pt-2")}>
              <ReplyQuote
                quote={message.replyTo}
                outgoing={outgoing}
                onOpen={() => onOpenQuote?.()}
              />
            </div>
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

          {message.kind === "voice" && message.attachment && (
            <>
              <VoiceContent
                attachment={message.attachment}
                outgoing={outgoing}
                seed={message.attachment.id}
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
                "text-[1.0625rem] leading-[1.3] [overflow-wrap:anywhere] whitespace-pre-wrap md:text-[1rem]",
                isImage && "px-3.5 py-2 md:px-[0.9rem] md:py-[0.6rem]",
              )}
            >
              <LinkifiedText text={message.body} query={highlight} />
              <span className="float-right mt-[0.5625rem] ml-3">{meta}</span>
            </p>
          )}
        </div>

        <ReactionPills reactions={message.reactions} outgoing={outgoing} onToggle={onReact} />

        {message.status === "failed" && (
          <button
            type="button"
            onClick={() => onRetry(message)}
            className="text-danger mt-1 text-[0.8125rem] font-medium"
          >
            Not sent · Tap to retry
          </button>
        )}
      </div>
    </div>
  );
}
