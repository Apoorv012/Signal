"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { Icon } from "@/components/icons/Icon";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Modal } from "@/components/ui/Modal";
import { listDevices, unlinkDevice } from "@/lib/api/devices";
import { formatTimestamp } from "@/lib/format/time";
import { queryKeys } from "@/lib/query/keys";
import { useUiStore } from "@/stores/ui";
import type { Device } from "@/types";

import { DemoQr } from "./DemoQr";

const isPhone = (device: Device) => /iPhone|iPad|Android/.test(device.name);

/**
 * Linked devices = the places this account is signed in. Signing in on another browser or phone
 * links it; unlinking revokes that login.
 */
export function LinkedDevices() {
  const queryClient = useQueryClient();
  const pushToast = useUiStore((state) => state.pushToast);
  const [linking, setLinking] = useState(false);
  const [unlinkTarget, setUnlinkTarget] = useState<Device | null>(null);

  const devices = useQuery({
    queryKey: queryKeys.devices,
    queryFn: listDevices,
    refetchInterval: 10_000, // a device linked elsewhere shows up without a reload
  });

  const unlink = useMutation({
    mutationFn: (device: Device) => unlinkDevice(device.id),
    onSuccess: (_, device) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.devices });
      pushToast(`${device.name} was unlinked`);
    },
    onError: (error) => pushToast(error instanceof Error ? error.message : "Could not unlink"),
  });

  return (
    <div className="flex flex-col gap-4">
      <p className="text-secondary text-[0.9375rem]">
        These are the devices where you are signed in. Unlink any you do not recognise.
      </p>

      <ul className="divide-divider divide-y">
        {(devices.data ?? []).map((device) => (
          <li key={device.id} className="flex items-center gap-3 py-3">
            <span className="bg-field text-text flex size-11 shrink-0 items-center justify-center rounded-full">
              <Icon name={isPhone(device) ? "phone" : "device-laptop"} size={22} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-text truncate text-[1rem] font-medium">
                {device.name}
                {device.isCurrent && (
                  <span className="bg-unread/15 text-unread ml-2 rounded-full px-2 py-0.5 text-[0.75rem] font-medium">
                    This device
                  </span>
                )}
              </p>
              <p className="text-secondary text-[0.8125rem]">
                {device.isCurrent
                  ? "Active now"
                  : `Last active ${device.lastActiveAt ? formatTimestamp(device.lastActiveAt) : "unknown"}`}
              </p>
            </div>
            {!device.isCurrent && (
              <button
                type="button"
                onClick={() => setUnlinkTarget(device)}
                className="text-danger hover:bg-hover rounded-lg px-3 py-1.5 text-[0.875rem] font-medium"
              >
                Unlink
              </button>
            )}
          </li>
        ))}
        {devices.isLoading && <li className="text-secondary py-4 text-[0.9375rem]">Loading…</li>}
      </ul>

      <Button className="self-start" onClick={() => setLinking(true)}>
        Link a new device
      </Button>

      {linking && <LinkDeviceDialog onClose={() => setLinking(false)} />}
      {unlinkTarget && (
        <ConfirmDialog
          title={`Unlink ${unlinkTarget.name}?`}
          message="That device will be signed out and will need to sign in again."
          confirmLabel="Unlink"
          onCancel={() => setUnlinkTarget(null)}
          onConfirm={() => {
            unlink.mutate(unlinkTarget);
            setUnlinkTarget(null);
          }}
        />
      )}
    </div>
  );
}

function LinkDeviceDialog({ onClose }: { onClose: () => void }) {
  const registerUrl = typeof window === "undefined" ? "" : `${window.location.origin}/register`;

  return (
    <Modal title="Link a new device" onClose={onClose}>
      <div className="flex flex-col items-center gap-4 p-5 text-center">
        <DemoQr seed={registerUrl} />
        <p className="text-secondary text-[0.75rem]">Demo QR code (decorative, not scannable)</p>
        <ol className="text-text flex list-decimal flex-col gap-1.5 pl-5 text-left text-[0.9375rem]">
          <li>
            On the new device, open <b className="break-all">{registerUrl}</b>
          </li>
          <li>Sign in with the same phone number, or your username and password.</li>
          <li>It appears in this list within a few seconds.</li>
        </ol>
        <p className="text-secondary text-[0.8125rem]">
          Real Signal links a desktop app by scanning a QR code with your phone. This demo links a
          device when you sign in to the same account on it.
        </p>
        <Button fullWidth variant="secondary" onClick={onClose}>
          Done
        </Button>
      </div>
    </Modal>
  );
}
