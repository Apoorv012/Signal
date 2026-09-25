/** Wraps every case-insensitive occurrence of `query` in <mark>; plain text when it is empty. */
export function HighlightedText({ text, query }: { text: string; query?: string }) {
  const term = query?.trim().toLowerCase();
  if (!term) return <>{text}</>;

  const parts: React.ReactNode[] = [];
  const lower = text.toLowerCase();
  let from = 0;
  for (let at = lower.indexOf(term); at !== -1; at = lower.indexOf(term, from)) {
    if (at > from) parts.push(text.slice(from, at));
    parts.push(
      <mark key={at} className="rounded-sm bg-yellow-300/70 text-inherit">
        {text.slice(at, at + term.length)}
      </mark>,
    );
    from = at + term.length;
  }
  parts.push(text.slice(from));
  return <>{parts}</>;
}
