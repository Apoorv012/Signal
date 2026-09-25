import type { Attachment } from "@/types";

function extensionOf(fileName = ""): string {
  const ext = fileName.split(".").pop() ?? "";
  return ext.length <= 4 ? ext.toUpperCase() : "FILE";
}

/** File card: document glyph with the extension, file name and size. */
export function FileContent({ attachment }: { attachment: Attachment }) {
  return (
    <div className="flex items-center gap-3 py-1 pr-2">
      <span className="bg-control-in text-text flex h-14 w-11 shrink-0 items-end justify-center rounded-[0.375rem] rounded-tr-[0.875rem] pb-2 text-[0.6875rem] font-bold shadow-sm">
        {extensionOf(attachment.fileName)}
      </span>
      <div className="min-w-0">
        <p className="truncate text-[1.0625rem] leading-tight md:text-[1rem]">
          {attachment.fileName}
        </p>
        <p className="text-[0.875rem] opacity-70">{attachment.sizeLabel}</p>
      </div>
    </div>
  );
}
