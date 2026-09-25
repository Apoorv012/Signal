const BAR_COUNT = 44;

/** Deterministic pseudo-waveform (real amplitude data would come with recorded audio). */
function barHeights(seed: number): number[] {
  return Array.from({ length: BAR_COUNT }, (_, i) => {
    const wave = Math.abs(Math.sin((i + seed) * 0.9) * Math.cos((i + seed) * 0.37));
    return (4 + Math.round(wave * 24)) / 16; // rem
  });
}

export function Waveform({ seed = 1 }: { seed?: number }) {
  return (
    <div className="flex h-8 flex-1 items-center gap-[0.1875rem]" aria-hidden>
      <span className="h-8 w-[0.125rem] rounded-full bg-current" />
      {barHeights(seed).map((height, i) => (
        <span
          key={i}
          className="w-[0.125rem] rounded-full bg-current opacity-60"
          style={{ height: `${height}rem` }}
        />
      ))}
    </div>
  );
}
