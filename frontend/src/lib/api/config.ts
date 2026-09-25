/**
 * Where the backend lives. Set NEXT_PUBLIC_API_URL in production; in development it defaults to
 * port 8000 on the same host the page was opened from, so opening the app from a phone via the
 * laptop's LAN address (http://192.168.x.x:3000) also reaches the API.
 */
export function apiBaseUrl(): string {
  const configured = process.env.NEXT_PUBLIC_API_URL;
  if (configured) return configured.replace(/\/$/, "");
  if (typeof window !== "undefined") return `http://${window.location.hostname}:8000`;
  return "http://localhost:8000";
}

export function wsUrl(token: string): string {
  const base = apiBaseUrl().replace(/^http/, "ws");
  return `${base}/ws?token=${encodeURIComponent(token)}`;
}

/** Turns a backend media path ("/media/...") into a loadable URL. */
export function mediaUrl(path: string | null | undefined): string | undefined {
  if (!path) return undefined;
  return path.startsWith("http") || path.startsWith("blob:") ? path : `${apiBaseUrl()}${path}`;
}
