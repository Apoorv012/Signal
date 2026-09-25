"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";

/** Verification is mocked: every number receives the same fixed code. */
export const DEMO_OTP = "123456";

export function VerifyForm() {
  const router = useRouter();
  const phone = useSearchParams().get("phone") ?? "your number";
  const [code, setCode] = useState("");
  const [error, setError] = useState<string>();

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (code === DEMO_OTP) router.push("/profile");
    else setError("That code is incorrect");
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-5">
      <p className="text-secondary text-center text-[0.9375rem]">
        Code sent to {phone}. Demo code: <b className="text-text">{DEMO_OTP}</b>
      </p>
      <TextField
        id="otp"
        inputMode="numeric"
        autoComplete="one-time-code"
        autoFocus
        maxLength={6}
        placeholder="------"
        className="text-center text-[1.5rem] tracking-[0.5em]"
        value={code}
        error={error}
        onChange={(e) => {
          setError(undefined);
          setCode(e.target.value.replace(/\D/g, ""));
        }}
      />
      <Button type="submit" fullWidth disabled={code.length !== 6}>
        Verify
      </Button>
      <Link href="/register" className="text-unread text-center text-[0.9375rem]">
        Wrong number?
      </Link>
    </form>
  );
}
