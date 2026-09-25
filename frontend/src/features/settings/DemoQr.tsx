const CELLS = 25;

/** Small deterministic hash so the same seed always draws the same pattern. */
function makeRandom(seed: string): () => number {
  let state = 2166136261;
  for (const char of seed) state = Math.imul(state ^ char.charCodeAt(0), 16777619);
  return () => {
    state = Math.imul(state ^ (state >>> 15), 2246822519);
    state = Math.imul(state ^ (state >>> 13), 3266489917);
    return ((state ^= state >>> 16) >>> 0) / 4294967296;
  };
}

/** True for the three big square "finder" markers in the corners. */
function inFinder(x: number, y: number): boolean {
  const near = (v: number) => v < 8;
  const far = (v: number) => v >= CELLS - 8;
  return (near(x) && near(y)) || (far(x) && near(y)) || (near(x) && far(y));
}

function finderCell(x: number, y: number): boolean {
  const fx = x >= CELLS - 8 ? x - (CELLS - 8) : x;
  const fy = y >= CELLS - 8 ? y - (CELLS - 8) : y;
  const ring = Math.max(Math.abs(fx - 3.5), Math.abs(fy - 3.5));
  return ring <= 3 && (ring > 2 || ring <= 1);
}

/** A QR-looking picture for the demo (decorative: it does not encode anything scannable). */
export function DemoQr({ seed }: { seed: string }) {
  const random = makeRandom(seed);
  const squares: React.ReactNode[] = [];
  for (let y = 0; y < CELLS; y++) {
    for (let x = 0; x < CELLS; x++) {
      const on = inFinder(x, y) ? finderCell(x, y) : random() > 0.52;
      if (on) squares.push(<rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} />);
    }
  }
  return (
    <svg
      role="img"
      aria-label="Demo QR code"
      viewBox={`-1 -1 ${CELLS + 2} ${CELLS + 2}`}
      className="size-44 rounded-xl bg-white p-1 text-black"
      fill="currentColor"
    >
      {squares}
    </svg>
  );
}
