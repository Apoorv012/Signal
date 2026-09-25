import { useSessionStore } from "@/stores/session";

import { apiBaseUrl } from "./config";

const REQUEST_TIMEOUT_MS = 10_000;

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  form?: FormData;
  query?: Record<string, string | number | undefined>;
  /** Skip the Authorization header (login endpoints). */
  anonymous?: boolean;
}

function buildUrl(path: string, query: RequestOptions["query"]): string {
  const url = new URL(`${apiBaseUrl()}/api${path}`);
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined) url.searchParams.set(key, String(value));
  }
  return url.toString();
}

/** Turns an error body into text. FastAPI validation errors (422) carry an array in `detail`. */
function errorMessage(payload: unknown, fallback: string): string {
  const detail = (payload as { detail?: unknown } | null)?.detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail) && detail.length > 0) {
    const { loc, msg } = detail[0] as { loc?: unknown[]; msg?: string };
    const field = loc?.[loc.length - 1];
    if (msg) return typeof field === "string" ? `${field}: ${msg}` : msg;
  }
  return fallback;
}

/** Thin fetch wrapper: JSON in/out, bearer token, and errors as ApiError with the server message. */
export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, form, query, anonymous } = options;
  const headers: Record<string, string> = {};
  const token = useSessionStore.getState().token;
  if (token && !anonymous) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers["Content-Type"] = "application/json";

  // Without a timeout, an unreachable server (e.g. a firewall silently dropping packets) leaves
  // the UI waiting forever.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(buildUrl(path, query), {
      method,
      headers,
      body: form ?? (body !== undefined ? JSON.stringify(body) : undefined),
      signal: controller.signal,
    });
  } catch {
    throw new ApiError(0, `Cannot reach the server at ${apiBaseUrl()}. Is the backend running?`);
  } finally {
    clearTimeout(timer);
  }

  if (response.status === 401 && !anonymous) {
    useSessionStore.getState().clear(); // session expired or revoked: the auth guard sends you to login
  }
  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new ApiError(response.status, errorMessage(payload, response.statusText));
  }
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}
