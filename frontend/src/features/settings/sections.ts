import type { IconName } from "@/components/icons/Icon";

export type SettingRow =
  | { kind: "toggle"; label: string; description?: string; defaultOn: boolean }
  | { kind: "info"; label: string; value: string };

export interface SettingsSection {
  id: string;
  title: string;
  icon: IconName;
  rows: SettingRow[];
}

/**
 * Settings are placeholders per the assignment (privacy, notifications, appearance, ...).
 * Appearance is the only functional one (theme); it is rendered by AppearanceSettings.
 */
export const SETTINGS_SECTIONS: SettingsSection[] = [
  {
    id: "general",
    title: "General",
    icon: "settings",
    rows: [
      { kind: "info", label: "Language", value: "English" },
      { kind: "toggle", label: "Open at login", defaultOn: false },
    ],
  },
  { id: "appearance", title: "Appearance", icon: "color", rows: [] },
  { id: "devices", title: "Linked devices", icon: "device-laptop", rows: [] },
  {
    id: "chats",
    title: "Chats",
    icon: "chat",
    rows: [
      {
        kind: "toggle",
        label: "Generate link previews",
        description: "Preview links sent in chats.",
        defaultOn: true,
      },
      { kind: "toggle", label: "Spell check", defaultOn: true },
      {
        kind: "toggle",
        label: "Send with Enter",
        description: "Press Enter to send, Shift+Enter for a new line.",
        defaultOn: true,
      },
    ],
  },
  {
    id: "calls",
    title: "Calls",
    icon: "phone",
    rows: [
      {
        kind: "toggle",
        label: "Enable incoming calls",
        description: "Voice and video calls are coming soon.",
        defaultOn: false,
      },
    ],
  },
  {
    id: "notifications",
    title: "Notifications",
    icon: "bell-ring-fill-light",
    rows: [
      { kind: "toggle", label: "Enable notifications", defaultOn: true },
      {
        kind: "toggle",
        label: "Show message content",
        description: "Show sender and message text in notifications.",
        defaultOn: true,
      },
      { kind: "toggle", label: "Play sounds", defaultOn: true },
    ],
  },
  {
    id: "privacy",
    title: "Privacy",
    icon: "lock",
    rows: [
      {
        kind: "toggle",
        label: "Read receipts",
        description: "Let people know when you have read their messages.",
        defaultOn: true,
      },
      {
        kind: "toggle",
        label: "Typing indicators",
        description: "Show when you are typing.",
        defaultOn: true,
      },
      { kind: "toggle", label: "Screen lock", defaultOn: false },
      { kind: "info", label: "Blocked contacts", value: "0" },
      { kind: "info", label: "Default disappearing timer", value: "Off" },
    ],
  },
  {
    id: "data",
    title: "Data usage",
    icon: "folder",
    rows: [
      { kind: "info", label: "Media auto-download", value: "Wi-Fi" },
      { kind: "info", label: "Stored media", value: "0 MB" },
    ],
  },
  {
    id: "help",
    title: "Help",
    icon: "help-light",
    rows: [
      { kind: "info", label: "Version", value: "Signal Clone 1.0" },
      { kind: "info", label: "End-to-end encryption", value: "Simulated (demo)" },
    ],
  },
];
