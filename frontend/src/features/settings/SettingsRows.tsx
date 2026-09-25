"use client";

import { Toggle } from "@/components/ui/Toggle";
import { settingKey, useSetting } from "@/hooks/useSetting";

import type { SettingRow } from "./sections";

function ToggleRow({
  sectionId,
  row,
}: {
  sectionId: string;
  row: Extract<SettingRow, { kind: "toggle" }>;
}) {
  const [on, setOn] = useSetting(settingKey(sectionId, row.label), row.defaultOn);
  return (
    <div className="flex items-center gap-4 py-3.5">
      <div className="min-w-0 flex-1">
        <p className="text-text text-[1rem]">{row.label}</p>
        {row.description && (
          <p className="text-secondary mt-0.5 text-[0.875rem]">{row.description}</p>
        )}
      </div>
      <Toggle checked={on} onChange={setOn} label={row.label} />
    </div>
  );
}

/** List of setting rows. Toggles are saved per account in localStorage. */
export function SettingsRows({ sectionId, rows }: { sectionId: string; rows: SettingRow[] }) {
  return (
    <div className="divide-divider divide-y">
      {rows.map((row) =>
        row.kind === "toggle" ? (
          <ToggleRow key={row.label} sectionId={sectionId} row={row} />
        ) : (
          <div key={row.label} className="flex items-center justify-between py-3.5">
            <span className="text-text text-[1rem]">{row.label}</span>
            <span className="text-secondary text-[1rem]">{row.value}</span>
          </div>
        ),
      )}
    </div>
  );
}
