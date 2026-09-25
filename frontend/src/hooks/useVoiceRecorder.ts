"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { useUiStore } from "@/stores/ui";

export interface Recording {
  blob: Blob;
  durationSec: number;
  extension: string;
}

/**
 * Voice messages via MediaRecorder. Browsers only allow the microphone on HTTPS or localhost, so on
 * an http://<lan-ip> test page `start()` explains that and returns false.
 */
export function useVoiceRecorder() {
  const pushToast = useUiStore((state) => state.pushToast);
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const recorder = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const chunks = useRef<Blob[]>([]);
  const startedAt = useRef(0);
  const ticker = useRef<ReturnType<typeof setInterval> | null>(null);

  const release = useCallback(() => {
    if (ticker.current) clearInterval(ticker.current);
    ticker.current = null;
    stream.current?.getTracks().forEach((track) => track.stop());
    stream.current = null;
    recorder.current = null;
    setRecording(false);
    setSeconds(0);
  }, []);

  useEffect(() => release, [release]); // stop the microphone if the composer goes away

  const start = useCallback(async (): Promise<boolean> => {
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      pushToast("Voice messages need a secure connection (HTTPS or localhost)");
      return false;
    }
    try {
      stream.current = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      pushToast("Microphone access was blocked");
      return false;
    }
    chunks.current = [];
    const instance = new MediaRecorder(stream.current);
    instance.ondataavailable = (event) => event.data.size > 0 && chunks.current.push(event.data);
    instance.start();
    recorder.current = instance;
    startedAt.current = Date.now();
    setRecording(true);
    ticker.current = setInterval(
      () => setSeconds(Math.round((Date.now() - startedAt.current) / 1000)),
      250,
    );
    return true;
  }, [pushToast]);

  /** Stops and returns the recording (null if nothing usable was captured). */
  const finish = useCallback(
    () =>
      new Promise<Recording | null>((resolve) => {
        const instance = recorder.current;
        if (!instance) return resolve(null);
        const durationSec = Math.max(1, Math.round((Date.now() - startedAt.current) / 1000));
        instance.onstop = () => {
          const type = instance.mimeType || "audio/webm";
          const blob = new Blob(chunks.current, { type });
          release();
          resolve(
            blob.size > 0
              ? { blob, durationSec, extension: type.includes("mp4") ? "m4a" : "webm" }
              : null,
          );
        };
        instance.stop();
      }),
    [release],
  );

  const cancel = useCallback(() => {
    if (recorder.current) recorder.current.onstop = null;
    if (recorder.current?.state === "recording") recorder.current.stop();
    release();
  }, [release]);

  return { recording, seconds, start, finish, cancel };
}
