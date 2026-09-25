"use client";

import { useEffect, useRef, useState } from "react";

import { Icon } from "@/components/icons/Icon";
import { IconButton } from "@/components/ui/IconButton";
import { useComingSoon } from "@/hooks/useComingSoon";
import { useSendMessage } from "@/hooks/useSendMessage";
import { useTypingBroadcast } from "@/hooks/useTyping";

import { AttachmentTray } from "./AttachmentTray";

/**
 * Message input row.
 * Desktop: [emoji] [ input ] [sticker] [mic|send] [+]
 * iPhone:  [+] [ input · sticker ] [camera] [mic|send]   (the + turns into a close button when open)
 */
export function Composer({ conversationId }: { conversationId: number }) {
  const [trayOpen, setTrayOpen] = useState(false);
  const soon = useComingSoon();
  const [text, setText] = useState("");
  const { send } = useSendMessage(conversationId);
  const { onInput, stop } = useTypingBroadcast(conversationId);
  const canSend = text.trim().length > 0;
  const inputRef = useRef<HTMLInputElement>(null);

  // Desktop: opening a chat lets you start typing straight away (not on the phone, where it
  // would pop the keyboard open over the messages).
  useEffect(() => {
    if (window.matchMedia("(min-width: 768px)").matches) inputRef.current?.focus();
  }, [conversationId]);

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
          className="bg-field flex h-11 min-w-0 flex-1 items-center rounded-full px-4 md:h-[2.4rem]"
          onSubmit={(event) => {
            event.preventDefault();
            submit();
          }}
        >
          <input
            ref={inputRef}
            value={text}
            onChange={(event) => {
              setText(event.target.value);
              if (event.target.value) onInput();
              else stop();
            }}
            onBlur={stop}
            placeholder="Message"
            autoComplete="off"
            enterKeyHint="send"
            className="text-text placeholder:text-secondary min-w-0 flex-1 bg-transparent text-[1.0625rem] outline-none md:text-[1rem]"
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
