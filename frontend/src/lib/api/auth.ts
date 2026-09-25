import type { AuthResult } from "@/types";

import { request } from "./http";

export const requestOtp = (phone: string) =>
  request<{ sent: boolean; demoCode: string }>("/auth/request-otp", {
    method: "POST",
    body: { phone },
    anonymous: true,
  });

export const verifyOtp = (phone: string, code: string) =>
  request<AuthResult>("/auth/verify-otp", {
    method: "POST",
    body: { phone, code },
    anonymous: true,
  });

export const logout = () => request<void>("/auth/logout", { method: "POST" });
