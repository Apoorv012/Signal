import type { Message } from "@/types";

import { minutesAgo } from "./time";

let counter = 0;

function msg(
  conversationId: string,
  senderId: string,
  minutes: number,
  rest: Partial<Message>,
): Message {
  return {
    id: `${conversationId}-${++counter}`,
    conversationId,
    senderId,
    kind: "text",
    body: "",
    createdAt: minutesAgo(minutes),
    status: senderId === "me" ? "read" : "sent",
    reactions: [],
    ...rest,
  };
}

export const MESSAGES: Record<string, Message[]> = {
  maya: [
    msg("maya", "me", 30, { body: "I’m on my way! What’s the address?" }),
    msg("maya", "maya", 27, {
      kind: "system",
      body: "Maya set disappearing message time to 1 day.",
    }),
    msg("maya", "maya", 25, { body: "We’re at 118 68th Ave." }),
    msg("maya", "me", 20, { body: "Is there a buzzer? Don’t want to ruin the surprise" }),
    msg("maya", "maya", 18, {
      body: "Buzz 2F if you get here before 7pm otherwise text me and I’ll come down to get you",
      reactions: [{ emoji: "💯", count: 1, reactedByMe: true }],
    }),
    msg("maya", "me", 10, { kind: "voice", attachment: { durationSec: 92 } }),
    msg("maya", "maya", 8, { body: "Ok - stay there I’ll come down and grab you in a moment" }),
    msg("maya", "me", 8, { body: "Thanks!" }),
  ],
  family: [
    msg("family", "mom", 15, {
      kind: "image",
      body: "Dad 1972 LA outside João’s house",
      attachment: { url: "/mock/photo-dad.jpg", width: 900, height: 600 },
    }),
    msg("family", "me", 12, { body: "Remind me, who was João?" }),
    msg("family", "mom", 7, {
      kind: "voice",
      attachment: { durationSec: 70 },
      reactions: [{ emoji: "❤️", count: 1, reactedByMe: true }],
    }),
    msg("family", "julian", 3, {
      kind: "file",
      attachment: { fileName: "Family Tree & Stories.pdf", sizeLabel: "44KB" },
    }),
  ],
  "soup-club": [
    msg("soup-club", "maya", 30, {
      kind: "image",
      attachment: { url: "/mock/photo-soup.jpg", width: 900, height: 900 },
    }),
    msg("soup-club", "me", 25, {
      body: "Monthly soup gathering is here! Next Thursday, 8pm, my house. I’m making the soup so please come with sweets & sides",
      reactions: [
        { emoji: "❤️", count: 2, reactedByMe: false },
        { emoji: "🍲", count: 1, reactedByMe: false },
        { emoji: "🥄", count: 1, reactedByMe: false },
      ],
    }),
    msg("soup-club", "kai", 21, { body: "I’ll bring bread and make a nice salad" }),
    msg("soup-club", "paige", 18, { body: "I’ve got a matcha mille crêpe recipe to test out 🧑🏾‍🔬" }),
    msg("soup-club", "michael", 15, {
      body: "I’ll bring something fun to drink and will do all the dishes.",
    }),
    msg("soup-club", "me", 5, { body: "Perfect, see you all in a few days!" }),
  ],
  paige: [
    msg("paige", "paige", 55, { body: "Did you get the invite to the group?" }),
    msg("paige", "me", 45, { body: "Just sent you the link!" }),
    msg("paige", "paige", 40, {
      body: "Yeah, I just got the group link - thanks for adding me 😎",
    }),
  ],
  climbers: [
    msg("climbers", "michael", 90, { body: "Weather looks perfect for Saturday" }),
    msg("climbers", "michael", 70, {
      body: "Ok, I’m picking everyone up at 8am tomorrow. Be ready to pile into the minivan.",
    }),
  ],
  roommates: [
    msg("roommates", "kai", 1500, {
      body: "Working late - can one of you please feed Spooky? One tin of wet food please.",
    }),
  ],
  "note-to-self": [
    msg("note-to-self", "me", 1440, {
      body: "Groceries: Coffee, yogurt, grapefruit, biscuits",
      status: "sent",
    }),
  ],
};
