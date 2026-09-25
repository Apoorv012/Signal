import type { User } from "@/types";

const avatar = (file: string) => `/mock/${file}.jpg`;

export const ME: User = {
  id: "me",
  displayName: "You",
  avatarUrl: avatar("me"),
  nameColor: "#2c6bed",
};

export const USERS: Record<string, User> = {
  me: ME,
  maya: {
    id: "maya",
    displayName: "Maya Johnson",
    avatarUrl: avatar("maya"),
    nameColor: "#2c6bed",
  },
  paige: {
    id: "paige",
    displayName: "Paige Hall",
    avatarUrl: avatar("paige"),
    nameColor: "#8a5a14",
  },
  mom: { id: "mom", displayName: "Mom", avatarUrl: avatar("mom"), nameColor: "#2e7d0b" },
  julian: {
    id: "julian",
    displayName: "Julian Rocha",
    avatarUrl: avatar("julian"),
    nameColor: "#4b4be0",
  },
  kai: { id: "kai", displayName: "Kai Guo", avatarUrl: avatar("kai"), nameColor: "#7b3fe4" },
  michael: {
    id: "michael",
    displayName: "Michael Lundberg",
    avatarUrl: avatar("michael"),
    nameColor: "#c8102e",
  },
};
