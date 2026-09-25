"use client";

import { useState } from "react";

import { AuthShell } from "./AuthShell";
import { RegisterForm } from "./RegisterForm";
import { UsernameForm } from "./UsernameForm";

/** First onboarding screen: sign up with a phone number (default) or with a username. */
export function RegisterScreen() {
  const [method, setMethod] = useState<"phone" | "username">("phone");
  const usePhone = method === "phone";

  return (
    <AuthShell
      title={usePhone ? "Your phone number" : "Your username"}
      subtitle={
        usePhone
          ? "Enter your phone number to get started with Signal."
          : "Choose a username and password. No phone number needed."
      }
    >
      {usePhone ? <RegisterForm /> : <UsernameForm />}
      <button
        type="button"
        onClick={() => setMethod(usePhone ? "username" : "phone")}
        className="text-unread mt-5 block w-full text-center text-[0.9375rem]"
      >
        {usePhone ? "Use a username instead" : "Use a phone number instead"}
      </button>
    </AuthShell>
  );
}
