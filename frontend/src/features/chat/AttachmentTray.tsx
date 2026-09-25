import { Icon, type IconName } from "@/components/icons/Icon";

const RECENT_PHOTOS = ["/mock/photo-dad.jpg", "/mock/photo-soup.jpg", "/mock/family.jpg"];

const ACTIONS: { label: string; icon?: IconName; text?: string }[] = [
  { label: "Photos", icon: "photo-square" },
  { label: "GIF", text: "GIF" },
  { label: "File", icon: "file" },
  { label: "Contact", icon: "person" },
];

/** Panel opened by the + button: recent photos and attachment actions. Wired up in Phase 4. */
export function AttachmentTray() {
  return (
    <div className="shrink-0 px-4 pt-3 pb-4 md:px-6">
      <div className="flex scrollbar-thin gap-3 overflow-x-auto pb-3">
        {RECENT_PHOTOS.map((src) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={src}
            src={src}
            alt=""
            className="size-40 shrink-0 rounded-[1.375rem] object-cover md:size-32"
          />
        ))}
      </div>
      <div className="flex scrollbar-thin gap-4 overflow-x-auto">
        {ACTIONS.map((action) => (
          <button
            key={action.label}
            type="button"
            className="text-secondary flex shrink-0 flex-col items-center gap-1.5"
          >
            <span className="bg-field text-text flex h-14 w-[5.5rem] items-center justify-center rounded-full md:w-16">
              {action.icon ? (
                <Icon name={action.icon} size={28} />
              ) : (
                <b className="text-[0.9375rem]">{action.text}</b>
              )}
            </span>
            <span className="text-[0.9375rem]">{action.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
