"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { useSessionReady } from "@/hooks/useSession";
import { useSessionStore } from "@/stores/session";

const Blank = () => <div className="bg-chat h-dvh" />;

/**
 * Renders children only for signed-in users; everyone else is sent to the login flow.
 * A signed-in user who has not finished onboarding (no name yet) is sent to the profile step,
 * unless the page itself is that step (`requireProfile={false}`).
 */
export function RequireAuth({
  children,
  requireProfile = true,
}: {
  children: React.ReactNode;
  requireProfile?: boolean;
}) {
  const ready = useSessionReady();
  const token = useSessionStore((state) => state.token);
  const user = useSessionStore((state) => state.user);
  const router = useRouter();

  // `=== false`: sessions saved before this field existed count as complete.
  const needsProfile = requireProfile && user !== null && user.hasProfile === false;

  useEffect(() => {
    if (!ready) return;
    if (!token) router.replace("/register");
    else if (needsProfile) router.replace("/profile");
  }, [ready, token, needsProfile, router]);

  return ready && token && !needsProfile ? children : <Blank />;
}

/**
 * Login-flow pages (register, verify). Fully signed-in users skip ahead to their chats; a
 * half-registered user (no name yet) may stay, e.g. to go back and fix a mistyped number.
 */
export function RedirectIfAuthed({ children }: { children: React.ReactNode }) {
  const ready = useSessionReady();
  const token = useSessionStore((state) => state.token);
  const profileIncomplete = useSessionStore((state) => state.user?.hasProfile === false);
  const router = useRouter();

  const done = token !== null && !profileIncomplete;

  useEffect(() => {
    if (ready && done) router.replace("/chats");
  }, [ready, done, router]);

  return ready && !done ? children : <Blank />;
}
