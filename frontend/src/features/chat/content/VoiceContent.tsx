"use client";

import clsx from "clsx";
import { useRef, useState } from "react";

import { Icon } from "@/components/icons/Icon";
import { mediaUrl } from "@/lib/api/config";
import { formatDuration } from "@/lib/format/time";
import type { Attachment } from "@/types";

import { Waveform } from "./Waveform";

interface VoiceContentProps {
  attachment: Attachment;
  outgoing: boolean;
  /** Varies the (decorative) waveform between messages. */
  seed: number;
}

/** Voice note: play/pause button, waveform and duration. Meta (time/status) is rendered by the bubble. */
export function VoiceContent({ attachment, outgoing, seed }: VoiceContentProps) {
  const audio = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  // Prefer the saved duration; otherwise read it from the file's metadata.
  const [loaded, setLoaded] = useState(0);
  const total = attachment.durationSec || loaded;

  const toggle = () => {
    const element = audio.current;
    if (!element) return;
    if (playing) element.pause();
    else void element.play();
  };

  /** Jumps to the pointer's horizontal position within the waveform (tap or drag). */
  const seek = (e: React.PointerEvent<HTMLDivElement>) => {
    const element = audio.current;
    if (!element || total <= 0) return;
    const box = e.currentTarget.getBoundingClientRect();
    const fraction = Math.min(Math.max((e.clientX - box.left) / box.width, 0), 1);
    element.currentTime = fraction * total;
    setCurrent(element.currentTime);
  };

  return (
    <div className="flex w-[16.25rem] max-w-full items-center gap-3 py-1 md:w-[18rem]">
      <audio
        ref={audio}
        src={mediaUrl(attachment.url)}
        preload="metadata"
        // Browser-recorded webm can report Infinity, so only accept finite values.
        onLoadedMetadata={(e) => {
          const { duration } = e.currentTarget;
          if (Number.isFinite(duration)) setLoaded(duration);
        }}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onTimeUpdate={(e) => setCurrent(e.currentTarget.currentTime)}
        onEnded={() => {
          setPlaying(false);
          setCurrent(0);
        }}
      />
      <button
        type="button"
        aria-label={playing ? "Pause voice message" : "Play voice message"}
        onClick={toggle}
        className={clsx(
          "flex size-12 shrink-0 items-center justify-center rounded-full",
          outgoing ? "text-on-bubble-out bg-white/25" : "bg-control-in text-text",
        )}
      >
        <Icon name={playing ? "pause-fill" : "play-fill"} size={24} />
      </button>
      <div className="min-w-0 flex-1">
        {/* Pointer capture keeps a drag tracking even when the finger leaves the bar; pan-y lets the page still scroll vertically. */}
        <div
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            seek(e);
          }}
          onPointerMove={(e) => {
            if (e.currentTarget.hasPointerCapture(e.pointerId)) seek(e);
          }}
          className="cursor-pointer touch-pan-y"
        >
          <Waveform seed={seed} progress={total > 0 ? Math.min(current / total, 1) : 0} />
        </div>
        {/* Elapsed while playing, full length otherwise (like Signal). */}
        <span className="text-[0.875rem] tabular-nums opacity-80">
          {formatDuration(playing ? current : total)}
        </span>
      </div>
    </div>
  );
}
