"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";

const MIN_DIGITS = 7;

export function RegisterForm() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const digits = phone.replace(/\D/g, "");
  const valid = digits.length >= MIN_DIGITS;

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (valid) router.push(`/verify?phone=${encodeURIComponent(phone.trim())}`);
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-5">
      <TextField
        id="phone"
        type="tel"
        inputMode="tel"
        autoFocus
        label="Phone number"
        placeholder="+1 555 123 4567"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
      />
      <Button type="submit" fullWidth disabled={!valid}>
        Next
      </Button>
    </form>
  );
}
