"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";

import { Icon } from "@/components/icons/Icon";
import { IconButton } from "@/components/ui/IconButton";
import { useComingSoon } from "@/hooks/useComingSoon";
import { settingKey, useSetting } from "@/hooks/useSetting";
import { useSendMessage } from "@/hooks/useSendMessage";
import { useTypingBroadcast } from "@/hooks/useTyping";

import { AttachmentTray } from "./AttachmentTray";

/**
 * Message input row. Enter sends on desktop (Shift+Enter = new line); on the phone Enter is a new line.
 * Desktop: [emoji] [ input ] [sticker] [mic|send] [+]
 * iPhone:  [+] [ input · sticker ] [camera] [mic|send]   (the + turns into a close button when open)
 */
export function Composer({ conversationId }: { conversationId: number }) {
  const [trayOpen, setTrayOpen] = useState(false);
  const soon = useComingSoon();
  const [text, setText] = useState("");
  const { send } = useSendMessage(conversationId);
  const { onInput, stop } = useTypingBroadcast(conversationId);
  const [sendWithEnter] = useSetting(settingKey("chats", "Send with Enter"), true);
  const canSend = text.trim().length > 0;
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Desktop: opening a chat lets you start typing straight away (not on the phone, where it
  // would pop the keyboard open over the messages).
  useEffect(() => {
    if (window.matchMedia("(min-width: 768px)").matches) inputRef.current?.focus();
  }, [conversationId]);

  // Grow with the text (CSS max-height caps it; beyond that the box scrolls).
  useLayoutEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [text]);

  const submit = () => {
    if (!canSend) return;
    stop();
    const body = text;
    setText("");
    void send({ body });
  };

  const toggleTray = (
    <IconButton
      icon={trayOpen ? "x" : "plus"}
      label={trayOpen ? "Close attachments" : "Attach"}
      onClick={() => setTrayOpen((open) => !open)}
      className={trayOpen ? "bg-secondary/60 hover:bg-secondary/70 rounded-full text-white" : ""}
    />
  );

  const micOrSend = canSend ? (
    <IconButton
      icon="send-fill"
      label="Send"
      onClick={submit}
      className="bg-unread hover:bg-unread rounded-full text-white hover:brightness-110"
    />
  ) : (
    <IconButton icon="mic" label="Voice message" onClick={soon("Voice messages")} />
  );

  return (
    <div className="bg-chat/90 shrink-0 pb-[max(env(safe-area-inset-bottom),8px)] backdrop-blur">
      <div className="flex items-center gap-1 px-3 py-2 md:gap-2 md:px-5 md:py-3">
        <div className="md:hidden">{toggleTray}</div>
        <IconButton
          icon="emoji"
          label="Emoji"
          className="max-md:hidden"
          onClick={soon("Emoji picker")}
        />

        <form
          className="bg-field flex min-h-11 min-w-0 flex-1 items-center rounded-[1.375rem] px-4 md:min-h-[2.4rem]"
          onSubmit={(event) => {
            event.preventDefault();
            submit();
          }}
        >
          <textarea
            ref={inputRef}
            rows={1}
            maxLength={5000}
            value={text}
            onChange={(event) => {
              setText(event.target.value);
              if (event.target.value) onInput();
              else stop();
            }}
            onKeyDown={(event) => {
              const isDesktop = window.matchMedia("(min-width: 768px)").matches;
              // "Send with Enter" on: Enter sends, Shift+Enter is a new line. Off: Ctrl/Cmd+Enter sends.
              const wantsSend = sendWithEnter ? !event.shiftKey : event.ctrlKey || event.metaKey;
              if (
                event.key === "Enter" &&
                wantsSend &&
                !event.nativeEvent.isComposing &&
                isDesktop
              ) {
                event.preventDefault();
                submit();
              }
            }}
            onBlur={stop}
            placeholder="Message"
            autoComplete="off"
            className="text-text placeholder:text-secondary max-h-40 min-w-0 flex-1 resize-none scrollbar-thin self-center bg-transparent py-[0.6875rem] text-[1.0625rem] leading-[1.3] outline-none md:py-[0.5rem] md:text-[1rem]"
          />
          <Icon name="sticker" size={26} className="text-text ml-2 md:hidden" />
        </form>

        <IconButton
          icon="sticker"
          label="Stickers"
          className="max-md:hidden"
          onClick={soon("Stickers")}
        />
        <IconButton icon="camera" label="Camera" className="md:hidden" onClick={soon("Camera")} />
        {micOrSend}
        <div className="max-md:hidden">{toggleTray}</div>
      </div>
      {trayOpen && <AttachmentTray />}
    </div>
  );
}
