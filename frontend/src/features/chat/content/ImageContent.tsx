import { mediaUrl } from "@/lib/api/config";
import type { Attachment } from "@/types";

/** Image edge-to-edge inside the bubble (the bubble supplies caption + meta). */
export function ImageContent({ attachment }: { attachment: Attachment }) {
  const ratio =
    attachment.width && attachment.height ? attachment.width / attachment.height : 4 / 3;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={mediaUrl(attachment.url)}
      alt={attachment.fileName}
      loading="lazy"
      style={{ aspectRatio: ratio }}
      className="block w-full max-w-[21.25rem] object-cover md:w-[21.25rem]"
    />
  );
}
