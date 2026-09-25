import type { Message } from "@/types";

/** One-line description of a message for the conversation list (mirrors the backend's preview). */
export function previewText(message: Pick<Message, "kind" | "body">): string {
  switch (message.kind) {
    case "voice":
      return "Voice Message";
    case "file":
      return "File";
    case "image":
      return message.body || "Photo";
    default:
      return message.body;
  }
}
