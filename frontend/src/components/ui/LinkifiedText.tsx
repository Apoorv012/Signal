import { HighlightedText } from "./HighlightedText";

// http(s):// or www. links only (never javascript: or other schemes).
const URL_PATTERN = /\b(?:https?:\/\/|www\.)[^\s<]+/gi;
const TRAILING_PUNCTUATION = /[.,!?;:'")\]]+$/;

/** Message text with URLs turned into links; `query` (search term) is highlighted everywhere. */
export function LinkifiedText({ text, query }: { text: string; query?: string }) {
  const parts: React.ReactNode[] = [];
  let from = 0;

  for (const match of text.matchAll(URL_PATTERN)) {
    const url = match[0].replace(TRAILING_PUNCTUATION, "");
    const start = match.index;
    if (start > from) {
      parts.push(<HighlightedText key={`t${from}`} text={text.slice(from, start)} query={query} />);
    }
    parts.push(
      <a
        key={`l${start}`}
        href={/^www\./i.test(url) ? `https://${url}` : url}
        target="_blank"
        rel="noopener noreferrer"
        className="underline underline-offset-2"
      >
        <HighlightedText text={url} query={query} />
      </a>,
    );
    from = start + url.length;
  }
  if (from < text.length) {
    parts.push(<HighlightedText key={`t${from}`} text={text.slice(from)} query={query} />);
  }
  return <>{parts}</>;
}
