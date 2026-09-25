import type { Attachment } from "@/types";

function extensionOf(fileName = ""): string {
  const ext = fileName.split(".").pop() ?? "";
  return ext.length <= 4 ? ext.toUpperCase() : "FILE";
}

/** File card: document glyph with the extension, file name and size. */
export function FileContent({ attachment }: { attachment: Attachment }) {
  return (
    <div className="flex items-center gap-3 py-1 pr-2">
      <span className="bg-chat text-text flex h-14 w-11 shrink-0 items-end justify-center rounded-[6px] rounded-tr-[14px] pb-2 text-[11px] font-bold shadow-sm">
        {extensionOf(attachment.fileName)}
      </span>
      <div className="min-w-0">
        <p className="truncate text-[17px] leading-tight md:text-[16px]">{attachment.fileName}</p>
        <p className="text-[14px] opacity-70">{attachment.sizeLabel}</p>
      </div>
    </div>
  );
}
