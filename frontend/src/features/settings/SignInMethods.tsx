"use client";

import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { PhoneField, usePhoneInput } from "@/components/ui/PhoneField";
import { TextField } from "@/components/ui/TextField";
import { useCurrentUser } from "@/hooks/useSession";
import { attachPhone, setPassword } from "@/lib/api/users";
import { useSessionStore } from "@/stores/session";
import { useUiStore } from "@/stores/ui";

const DEMO_CODE = "123456";

type Dialog = "phone" | "password" | null;

/**
 * Ways to sign in to this one account. A phone account can add a username + password, and a
 * username account can add a phone number. Two existing accounts are never merged.
 */
export function SignInMethods() {
  const me = useCurrentUser();
  const [dialog, setDialog] = useState<Dialog>(null);

  return (
    <section className="border-divider mb-4 flex flex-col gap-1 border-b pb-6">
      <h2 className="text-secondary pb-1 text-[0.875rem] font-medium">Sign-in methods</h2>
      <Row
        label="Phone number"
        value={me.phone ?? "Not added"}
        action={me.phone ? "Change" : "Add"}
        onAction={() => setDialog("phone")}
      />
      <Row
        label="Username & password"
        value={
          me.username
            ? me.hasPassword
              ? `@${me.username}`
              : `@${me.username} · no password yet`
            : "Choose a username below first"
        }
        action={me.hasPassword ? "Change password" : "Set password"}
        disabled={!me.username}
        onAction={() => setDialog("password")}
      />
      {dialog === "phone" && <PhoneDialog onClose={() => setDialog(null)} />}
      {dialog === "password" && <PasswordDialog onClose={() => setDialog(null)} />}
    </section>
  );
}

function Row({
  label,
  value,
  action,
  disabled,
  onAction,
}: {
  label: string;
  value: string;
  action: string;
  disabled?: boolean;
  onAction: () => void;
}) {
  return (
    <div className="flex items-center gap-3 py-2">
      <div className="min-w-0 flex-1">
        <p className="text-text text-[1rem]">{label}</p>
        <p className="text-secondary truncate text-[0.875rem]">{value}</p>
      </div>
      <button
        type="button"
        disabled={disabled}
        onClick={onAction}
        className="text-unread text-[0.9375rem] font-medium disabled:opacity-40"
      >
        {action}
      </button>
    </div>
  );
}

function PhoneDialog({ onClose }: { onClose: () => void }) {
  const setUser = useSessionStore((state) => state.setUser);
  const pushToast = useUiStore((state) => state.pushToast);
  const phone = usePhoneInput();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    try {
      setUser(await attachPhone(phone.e164, code));
      pushToast("Phone number saved");
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save the number");
      setBusy(false);
    }
  };

  return (
    <Modal
      title="Phone number"
      onClose={onClose}
      footer={
        <Button
          fullWidth
          disabled={!phone.valid || code.length !== 6 || busy}
          onClick={() => void submit()}
        >
          {busy ? "Saving…" : "Save"}
        </Button>
      }
    >
      <div className="flex flex-col gap-4 p-4">
        <PhoneField
          state={phone}
          label="New number"
          autoFocus
          onChange={() => setError(undefined)}
        />
        <TextField
          id="attach-code"
          label="Verification code"
          inputMode="numeric"
          maxLength={6}
          placeholder="------"
          value={code}
          error={error}
          onChange={(e) => {
            setError(undefined);
            setCode(e.target.value.replace(/\D/g, ""));
          }}
        />
        <p className="text-secondary text-[0.8125rem]">
          Demo code: <b className="text-text">{DEMO_CODE}</b>. A number that already belongs to
          another account cannot be added: accounts are never merged.
        </p>
      </div>
    </Modal>
  );
}

function PasswordDialog({ onClose }: { onClose: () => void }) {
  const me = useCurrentUser();
  const setUser = useSessionStore((state) => state.setUser);
  const pushToast = useUiStore((state) => state.pushToast);
  const [current, setCurrent] = useState("");
  const [password, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);
  const valid = password.length >= 8 && password === confirm && (!me.hasPassword || current);

  const submit = async () => {
    setBusy(true);
    try {
      setUser(await setPassword(password, me.hasPassword ? current : undefined));
      pushToast("Password saved");
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save the password");
      setBusy(false);
    }
  };

  return (
    <Modal
      title={me.hasPassword ? "Change password" : "Set password"}
      onClose={onClose}
      footer={
        <Button fullWidth disabled={!valid || busy} onClick={() => void submit()}>
          {busy ? "Saving…" : "Save"}
        </Button>
      }
    >
      <div className="flex flex-col gap-4 p-4">
        {me.hasPassword && (
          <TextField
            id="current-password"
            label="Current password"
            type="password"
            autoComplete="current-password"
            autoFocus
            value={current}
            onChange={(e) => {
              setError(undefined);
              setCurrent(e.target.value);
            }}
          />
        )}
        <TextField
          id="new-password"
          label="New password"
          type="password"
          autoComplete="new-password"
          autoFocus={!me.hasPassword}
          maxLength={128}
          value={password}
          onChange={(e) => setNewPassword(e.target.value)}
        />
        <TextField
          id="new-password-confirm"
          label="Confirm new password"
          type="password"
          autoComplete="new-password"
          maxLength={128}
          value={confirm}
          error={error ?? (confirm && confirm !== password ? "Passwords do not match" : undefined)}
          onChange={(e) => {
            setError(undefined);
            setConfirm(e.target.value);
          }}
        />
        <p className="text-secondary text-[0.8125rem]">At least 8 characters.</p>
      </div>
    </Modal>
  );
}
