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

  const toggle = () => {
    const element = audio.current;
    if (!element) return;
    if (playing) element.pause();
    else void element.play();
  };

  return (
    <div className="flex w-[16.25rem] max-w-full items-center gap-3 py-1 md:w-[18rem]">
      <audio
        ref={audio}
        src={mediaUrl(attachment.url)}
        preload="none"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
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
        <Waveform seed={seed} />
        <span className="text-[0.875rem] opacity-80">
          {formatDuration(attachment.durationSec ?? 0)}
        </span>
      </div>
    </div>
  );
}
