import clsx from "clsx";

import { Icon } from "@/components/icons/Icon";
import { formatDuration } from "@/lib/format/time";

import { Waveform } from "./Waveform";

interface VoiceContentProps {
  durationSec: number;
  outgoing: boolean;
  seed: number;
}

/** Voice note: play button, waveform and duration. Meta (time/status) is rendered by the bubble. */
export function VoiceContent({ durationSec, outgoing, seed }: VoiceContentProps) {
  return (
    <div className="flex w-[260px] max-w-full items-center gap-3 py-1 md:w-[300px]">
      <span
        className={clsx(
          "flex size-12 shrink-0 items-center justify-center rounded-full",
          outgoing ? "text-on-bubble-out bg-white/25" : "bg-chat text-text",
        )}
      >
        <Icon name="play-fill" size={24} />
      </span>
      <div className="min-w-0 flex-1">
        <Waveform seed={seed} />
        <span className="text-[14px] opacity-80">{formatDuration(durationSec)}</span>
      </div>
    </div>
  );
}
