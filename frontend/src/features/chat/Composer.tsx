"use client";

import clsx from "clsx";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

import { Icon } from "@/components/icons/Icon";
import { IconButton } from "@/components/ui/IconButton";
import { useComingSoon } from "@/hooks/useComingSoon";
import { useSendMessage } from "@/hooks/useSendMessage";
import { settingKey, useSetting } from "@/hooks/useSetting";
import { useTypingBroadcast } from "@/hooks/useTyping";
import { useVoiceRecorder } from "@/hooks/useVoiceRecorder";
import { uploadAttachment } from "@/lib/api/messages";
import { useUiStore } from "@/stores/ui";
import type { Attachment } from "@/types";

import { AttachmentTray } from "./AttachmentTray";

const MAX_UPLOAD_BYTES = 25 * 1024 * 1024; // the server enforces the same limit

/** A file picked (or dropped / pasted) that is uploading or ready to be sent with the next message. */
interface Pending {
  key: number;
  fileName: string;
  previewUrl: string | null;
  attachment: Attachment | null; // null while uploading
}

const formatClock = (total: number) =>
  `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;

/**
 * Message input row. Enter sends with a mouse/keyboard (Shift+Enter = new line); on touch devices Enter is a new line.
 * Above it: the message being replied to and/or the attachment about to be sent.
 * Desktop: [emoji] [ input ] [sticker] [mic|send] [+]
 * iPhone:  [+] [ input · sticker ] [camera] [mic|send]   (the + turns into a close button when open)
 */
export function Composer({ conversationId }: { conversationId: number }) {
  const [trayOpen, setTrayOpen] = useState(false);
  const soon = useComingSoon();
  const pushToast = useUiStore((state) => state.pushToast);
  const reply = useUiStore((state) =>
    state.replyDraft?.conversationId === conversationId ? state.replyDraft : null,
  );
  const clearReplyDraft = useUiStore((state) => state.clearReplyDraft);
  const [text, setText] = useState("");
  const [pending, setPending] = useState<Pending | null>(null);
  const [dragging, setDragging] = useState(false);
  const { send } = useSendMessage(conversationId);
  const { onInput, stop } = useTypingBroadcast(conversationId);
  const voice = useVoiceRecorder();
  const [sendWithEnter] = useSetting(settingKey("chats", "Send with Enter"), true);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const photoInput = useRef<HTMLInputElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const nextKey = useRef(1);

  const uploading = pending !== null && pending.attachment === null;
  const canSend = (text.trim().length > 0 || pending?.attachment) && !uploading;

  // Desktop: opening a chat lets you start typing straight away (not on the phone, where it
  // would pop the keyboard open over the messages).
  useEffect(() => {
    if (window.matchMedia("(min-width: 768px)").matches) inputRef.current?.focus();
  }, [conversationId]);

  // Choosing "Reply" puts the cursor in the box.
  useEffect(() => {
    if (reply) inputRef.current?.focus();
  }, [reply]);

  // Grow with the text (CSS max-height caps it; beyond that the box scrolls).
  useLayoutEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [text]);

  // A new chat starts with a clean slate.
  useEffect(() => {
    return () => setPending(null);
  }, [conversationId]);

  const discardPending = () => {
    if (pending?.previewUrl) URL.revokeObjectURL(pending.previewUrl);
    setPending(null);
  };

  /** Uploads right away so "send" is instant; the preview shows while it uploads. */
  const attachFile = async (file: File) => {
    if (file.size > MAX_UPLOAD_BYTES) {
      pushToast("That file is too large (max 25 MB)");
      return;
    }
    if (pending?.previewUrl) URL.revokeObjectURL(pending.previewUrl);
    const key = nextKey.current++;
    setPending({
      key,
      fileName: file.name,
      previewUrl: file.type.startsWith("image/") ? URL.createObjectURL(file) : null,
      attachment: null,
    });
    setTrayOpen(false);
    try {
      const attachment = await uploadAttachment(file, file.name);
      setPending((current) => (current?.key === key ? { ...current, attachment } : current));
    } catch (error) {
      pushToast(error instanceof Error ? error.message : "Upload failed");
      setPending((current) => (current?.key === key ? null : current));
    }
  };

  const submit = () => {
    if (!canSend) return;
    stop();
    void send({
      body: text,
      attachment: pending?.attachment ?? undefined,
      replyTo: reply?.quote,
    });
    setText("");
    discardPending();
    if (reply) clearReplyDraft();
  };

  const toggleRecording = async () => {
    if (voice.recording) {
      const recording = await voice.finish();
      if (!recording) return;
      try {
        const attachment = await uploadAttachment(
          recording.blob,
          `voice-message.${recording.extension}`,
          recording.durationSec,
        );
        void send({ body: "", attachment, replyTo: reply?.quote });
        if (reply) clearReplyDraft();
      } catch (error) {
        pushToast(error instanceof Error ? error.message : "Could not send the voice message");
      }
    } else {
      await voice.start();
    }
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
    <IconButton icon="mic" label="Voice message" onClick={() => void toggleRecording()} />
  );

  const onFilesPicked = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = ""; // allow picking the same file again
    if (file) void attachFile(file);
  };

  return (
    <div
      className={clsx(
        "bg-chat/90 shrink-0 pb-[max(env(safe-area-inset-bottom),8px)] backdrop-blur",
        dragging && "ring-unread ring-2 ring-inset",
      )}
      onDragOver={(event) => {
        if (!event.dataTransfer.types.includes("Files")) return;
        event.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(event) => {
        event.preventDefault();
        setDragging(false);
        const file = event.dataTransfer.files[0];
        if (file) void attachFile(file);
      }}
    >
      <input ref={photoInput} type="file" accept="image/*" hidden onChange={onFilesPicked} />
      <input ref={fileInput} type="file" hidden onChange={onFilesPicked} />

      {reply && (
        <div className="bg-field mx-3 mt-2 flex items-center gap-3 rounded-xl border-l-4 border-l-[var(--unread)] px-3 py-2 md:mx-5">
          <div className="min-w-0 flex-1">
            <p className="text-unread truncate text-[0.8125rem] font-semibold">
              Replying to {reply.quote.senderName}
            </p>
            <p className="text-secondary line-clamp-1 text-[0.875rem]">{reply.quote.preview}</p>
          </div>
          <IconButton
            icon="x"
            label="Cancel reply"
            iconSize={20}
            className="size-8"
            onClick={clearReplyDraft}
          />
        </div>
      )}

      {pending && (
        <div className="mx-3 mt-2 flex items-center gap-3 md:mx-5">
          <div className="bg-field text-text relative flex h-16 min-w-16 items-center gap-3 overflow-hidden rounded-xl pr-8">
            {pending.previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={pending.previewUrl} alt="" className="size-16 object-cover" />
            ) : (
              <span className="flex size-16 items-center justify-center">
                <Icon name="file" size={28} />
              </span>
            )}
            {!pending.previewUrl && (
              <span className="max-w-40 truncate pr-2 text-[0.875rem]">{pending.fileName}</span>
            )}
            {uploading && (
              <span
                role="status"
                aria-label="Uploading"
                className="absolute inset-0 flex items-center justify-center bg-black/40"
              >
                <span className="size-6 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              </span>
            )}
            <button
              type="button"
              aria-label="Remove attachment"
              onClick={discardPending}
              className="absolute top-1 right-1 flex size-6 items-center justify-center rounded-full bg-black/55 text-white"
            >
              <Icon name="x" size={14} />
            </button>
          </div>
        </div>
      )}

      {voice.recording ? (
        <div className="flex items-center gap-3 px-3 py-2 md:px-5 md:py-3">
          <IconButton icon="x" label="Cancel recording" onClick={voice.cancel} />
          <span className="bg-danger size-3 animate-pulse rounded-full" aria-hidden />
          <span className="text-text flex-1 text-[1rem] tabular-nums" role="timer">
            {formatClock(voice.seconds)}
          </span>
          <IconButton
            icon="send-fill"
            label="Send voice message"
            onClick={() => void toggleRecording()}
            className="bg-unread hover:bg-unread rounded-full text-white hover:brightness-110"
          />
        </div>
      ) : (
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
              onPaste={(event) => {
                const image = Array.from(event.clipboardData.files).find((f) =>
                  f.type.startsWith("image/"),
                );
                if (image) {
                  event.preventDefault();
                  void attachFile(image);
                }
              }}
              onKeyDown={(event) => {
                if (event.key === "Escape") {
                  // Esc backs out of a reply, then of an attachment.
                  if (reply) clearReplyDraft();
                  else if (pending) discardPending();
                  return;
                }
                // Decided by input device, not width: a narrow laptop window still has a keyboard.
                const hasKeyboard = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
                // "Send with Enter" on: Enter sends, Shift+Enter is a new line. Off: Ctrl/Cmd+Enter sends.
                const wantsSend = sendWithEnter ? !event.shiftKey : event.ctrlKey || event.metaKey;
                if (
                  event.key === "Enter" &&
                  wantsSend &&
                  !event.nativeEvent.isComposing &&
                  hasKeyboard
                ) {
                  event.preventDefault();
                  submit();
                }
              }}
              onBlur={stop}
              placeholder={pending ? "Add a caption" : "Message"}
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
          <IconButton
            icon="camera"
            label="Camera"
            className="md:hidden"
            onClick={() => photoInput.current?.click()}
          />
          {micOrSend}
          <div className="max-md:hidden">{toggleTray}</div>
        </div>
      )}
      {trayOpen && (
        <AttachmentTray
          onPickPhoto={() => photoInput.current?.click()}
          onPickFile={() => fileInput.current?.click()}
        />
      )}
    </div>
  );
}
