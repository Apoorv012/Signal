"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { PhoneField, usePhoneInput } from "@/components/ui/PhoneField";
import { requestOtp } from "@/lib/api/auth";

export function RegisterForm() {
  const router = useRouter();
  const phone = usePhoneInput();
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!phone.valid || busy) return;
    setBusy(true);
    try {
      await requestOtp(phone.e164);
      router.push(`/verify?phone=${encodeURIComponent(phone.e164)}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-5">
      <PhoneField
        state={phone}
        label="Phone number"
        error={error}
        disabled={busy}
        autoFocus
        onChange={() => setError(undefined)}
      />
      <Button type="submit" fullWidth disabled={!phone.valid || busy}>
        {busy ? "Sending…" : "Next"}
      </Button>
      <p className="text-secondary text-center text-[0.8125rem]">
        Demo accounts: +1 555 000 0001 (Riley) or +1 555 000 0002 (Maya)
      </p>
    </form>
  );
}
