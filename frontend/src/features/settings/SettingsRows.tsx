"use client";

import { useState } from "react";

import { Toggle } from "@/components/ui/Toggle";

import type { SettingRow } from "./sections";

function ToggleRow({ row }: { row: Extract<SettingRow, { kind: "toggle" }> }) {
  const [on, setOn] = useState(row.defaultOn);
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

/** Generic list of setting rows (placeholders: state is local, nothing is persisted). */
export function SettingsRows({ rows }: { rows: SettingRow[] }) {
  return (
    <div className="divide-divider divide-y">
      {rows.map((row) =>
        row.kind === "toggle" ? (
          <ToggleRow key={row.label} row={row} />
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
