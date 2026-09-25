import type { SafetyNumber } from "@/types";

import { request } from "./http";

/** Simulated end-to-end encryption: the safety number of a one-to-one chat. */
export const getSafetyNumber = (conversationId: number) =>
  request<SafetyNumber>(`/conversations/${conversationId}/safety-number`);

export const setSafetyVerified = (conversationId: number, verified: boolean) =>
  request<SafetyNumber>(`/conversations/${conversationId}/safety-number/verify`, {
    method: "POST",
    body: { verified },
  });
