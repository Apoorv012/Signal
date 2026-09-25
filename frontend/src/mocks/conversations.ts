import type { Conversation } from "@/types";

import { daysAgo, minutesAgo } from "./time";

const avatar = (file: string) => `/mock/${file}.jpg`;

export const CONVERSATIONS: Conversation[] = [
  {
    id: "family",
    type: "group",
    title: "Family",
    avatarUrl: avatar("family"),
    isPinned: true,
    unreadCount: 1,
    memberIds: ["me", "mom", "julian"],
    lastMessage: {
      kind: "image",
      text: "Look at these old photos I found from back when we lived in M…",
      senderName: "Mom",
      createdAt: minutesAgo(20),
    },
    theme: { bubbleBackground: "#cf163f" },
  },
  {
    id: "paige",
    type: "direct",
    title: "Paige Hall",
    avatarUrl: avatar("paige"),
    isPinned: true,
    unreadCount: 0,
    memberIds: ["me", "paige"],
    lastMessage: {
      kind: "text",
      text: "Yeah, I just got the group link - thanks for adding me 😎",
      createdAt: minutesAgo(40),
      status: "read",
    },
  },
  {
    id: "climbers",
    type: "group",
    title: "Rock climbers",
    avatarUrl: avatar("climbers"),
    isPinned: false,
    unreadCount: 0,
    memberIds: ["me", "michael", "kai"],
    lastMessage: {
      kind: "text",
      text: "Ok, I’m picking everyone up at 8am tomorrow. Be ready to pile into the min…",
      createdAt: minutesAgo(70),
    },
  },
  {
    id: "maya",
    type: "direct",
    title: "Maya Johnson",
    avatarUrl: avatar("maya"),
    isPinned: false,
    unreadCount: 1,
    disappearingSeconds: 86_400,
    memberIds: ["me", "maya"],
    lastMessage: { kind: "voice", text: "Voice Message", createdAt: minutesAgo(8), status: "read" },
  },
  {
    id: "note-to-self",
    type: "note_to_self",
    title: "Note to Self",
    isPinned: false,
    unreadCount: 0,
    memberIds: ["me"],
    lastMessage: {
      kind: "text",
      text: "Groceries: Coffee, yogurt, grapefruit, biscuits",
      createdAt: daysAgo(1),
    },
  },
  {
    id: "roommates",
    type: "group",
    title: "Roommates",
    avatarUrl: avatar("roommates"),
    isPinned: false,
    unreadCount: 0,
    memberIds: ["me", "kai", "paige"],
    lastMessage: {
      kind: "text",
      text: "Working late - can one of you please feed Spooky? One tin of wet fo…",
      senderName: "Kai",
      createdAt: daysAgo(1, 9),
    },
  },
  {
    id: "soup-club",
    type: "group",
    title: "Winter Soup Club 🍲",
    avatarUrl: avatar("soup"),
    isPinned: false,
    unreadCount: 0,
    memberIds: ["me", "maya", "kai", "paige", "michael"],
    lastMessage: {
      kind: "text",
      text: "Perfect, see you all in a few days!",
      createdAt: minutesAgo(5),
      status: "read",
    },
    theme: {
      bubbleBackground: "linear-gradient(180deg, #677ccb 0%, #885681 100%)",
      wallpaper: "linear-gradient(180deg, #d8dcf4 0%, #d6a8ba 100%)",
    },
  },
];
