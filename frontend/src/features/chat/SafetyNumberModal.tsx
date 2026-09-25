"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { Icon } from "@/components/icons/Icon";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { getSafetyNumber, setSafetyVerified } from "@/lib/api/security";
import { useUiStore } from "@/stores/ui";

/** Simulated end-to-end encryption: compare a 60-digit number with the other person. */
export function SafetyNumberModal() {
  const queryClient = useQueryClient();
  const closeModal = useUiStore((state) => state.closeModal);
  const pushToast = useUiStore((state) => state.pushToast);
  const conversationId = useUiStore((state) => state.modalConversationId) ?? 0;
  const key = ["safety-number", conversationId];

  const safety = useQuery({ queryKey: key, queryFn: () => getSafetyNumber(conversationId) });
  const toggle = useMutation({
    mutationFn: (verified: boolean) => setSafetyVerified(conversationId, verified),
    onSuccess: (updated) => queryClient.setQueryData(key, updated),
    onError: (error) => pushToast(error instanceof Error ? error.message : "Could not update"),
  });

  const data = safety.data;

  return (
    <Modal title="Safety number" onClose={closeModal}>
      <div className="flex flex-col gap-4 p-5">
        {data ? (
          <>
            <div className="flex items-center gap-2">
              <Icon
                name={data.verified ? "check-circle" : "lock"}
                size={22}
                className={data.verified ? "text-unread" : "text-secondary"}
              />
              <p className="text-text text-[1rem] font-medium">
                {data.verified ? `Verified with ${data.peerName}` : `Not verified yet`}
              </p>
            </div>
            <ol
              aria-label="Safety number"
              className="bg-field text-text grid grid-cols-3 gap-x-4 gap-y-3 rounded-xl p-4 text-center font-mono text-[1.0625rem] tracking-wider"
            >
              {data.number.split(" ").map((group, index) => (
                <li key={index}>{group}</li>
              ))}
            </ol>
            <p className="text-secondary text-[0.875rem]">
              To verify that messages with {data.peerName} are end-to-end encrypted, compare this
              number with the one on their device. If both match, no one is in the middle.
            </p>
            <p className="border-divider text-secondary rounded-lg border px-3 py-2 text-[0.8125rem]">
              Demo: encryption is simulated here. The number comes from stored demo keys and
              messages are not actually encrypted end to end.
            </p>
            <Button
              variant={data.verified ? "secondary" : "primary"}
              fullWidth
              disabled={toggle.isPending}
              onClick={() => toggle.mutate(!data.verified)}
            >
              {data.verified ? "Mark as not verified" : "Mark as verified"}
            </Button>
          </>
        ) : (
          <p className="text-secondary py-6 text-center text-[0.9375rem]">
            {safety.isError ? "Safety numbers are only available in one-to-one chats." : "Loading…"}
          </p>
        )}
      </div>
    </Modal>
  );
}
