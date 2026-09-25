"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { useSessionReady } from "@/hooks/useSession";
import { useSessionStore } from "@/stores/session";

/** Entry point: signed-in users go to their chats, everyone else to the login flow. */
export default function RootPage() {
  const ready = useSessionReady();
  const token = useSessionStore((state) => state.token);
  const router = useRouter();

  useEffect(() => {
    if (ready) router.replace(token ? "/chats" : "/register");
  }, [ready, token, router]);

  return <div className="bg-chat h-dvh" />;
}
