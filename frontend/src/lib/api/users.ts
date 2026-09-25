import type { User } from "@/types";

import { request } from "./http";

export const getMe = () => request<User>("/me");

export const updateMe = (patch: { displayName?: string; about?: string; username?: string }) =>
  request<User>("/me", { method: "PATCH", body: patch });

/** Adds or changes the phone number of this account (mocked OTP). */
export const attachPhone = (phone: string, code: string) =>
  request<User>("/me/phone", { method: "POST", body: { phone, code } });

export const setPassword = (password: string, currentPassword?: string) =>
  request<User>("/me/password", { method: "POST", body: { password, currentPassword } });

export const uploadAvatar = (file: File) => {
  const form = new FormData();
  form.append("file", file);
  return request<User>("/me/avatar", { method: "POST", form });
};

export const searchUsers = (q: string) => request<User[]>("/users/search", { query: { q } });

export const listContacts = () => request<User[]>("/contacts");

export const addContact = (identifier: string) =>
  request<User>("/contacts", { method: "POST", body: { identifier } });

export const removeContact = (contactId: number) =>
  request<void>(`/contacts/${contactId}`, { method: "DELETE" });
