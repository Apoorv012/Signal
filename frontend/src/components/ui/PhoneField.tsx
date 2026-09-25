"use client";

import clsx from "clsx";
import { useState } from "react";

import { Icon } from "@/components/icons/Icon";
import { COUNTRIES, type Country, DEFAULT_COUNTRY, isValidNumber, toE164 } from "@/lib/countries";

/** State for a phone input: the chosen country, the typed national number, and the E.164 result. */
export function usePhoneInput() {
  const [country, setCountry] = useState<Country>(DEFAULT_COUNTRY);
  const [national, setNational] = useState("");

  return {
    country,
    setCountry,
    national,
    setNational,
    e164: toE164(country, national),
    valid: isValidNumber(country, national),
  };
}

export type PhoneInputState = ReturnType<typeof usePhoneInput>;

interface PhoneFieldProps {
  state: PhoneInputState;
  label?: string;
  error?: string;
  disabled?: boolean;
  autoFocus?: boolean;
  onChange?: () => void;
}

/** Country picker (dial code) next to the national number, like Signal's registration screen. */
export function PhoneField({
  state,
  label,
  error,
  disabled,
  autoFocus,
  onChange,
}: PhoneFieldProps) {
  const { country, setCountry, national, setNational } = state;

  return (
    <div className="flex flex-col gap-1.5">
      {label && <span className="text-secondary text-[0.875rem] font-medium">{label}</span>}
      <div className="flex gap-2">
        <label
          className={clsx(
            "bg-field text-text relative flex h-12 shrink-0 items-center gap-1.5 rounded-xl px-3 text-[1rem]",
            disabled && "opacity-60",
          )}
        >
          <span className="font-medium">{country.iso}</span>
          <span className="text-secondary">+{country.dial}</span>
          <Icon name="chevron-down" size={16} className="text-secondary" />
          {/* Native select on top: full-screen picker on phones, dropdown on desktop. */}
          <select
            aria-label="Country"
            value={country.iso}
            disabled={disabled}
            onChange={(e) => {
              setCountry(COUNTRIES.find((c) => c.iso === e.target.value) ?? DEFAULT_COUNTRY);
              onChange?.();
            }}
            className="[&>option]:bg-chat [&>option]:text-text absolute inset-0 cursor-pointer opacity-0"
          >
            {COUNTRIES.map((c) => (
              <option key={c.iso} value={c.iso}>
                {c.name} (+{c.dial})
              </option>
            ))}
          </select>
        </label>

        <input
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          aria-label="Phone number"
          autoFocus={autoFocus}
          disabled={disabled}
          placeholder="555 000 0001"
          value={national}
          onChange={(e) => {
            setNational(e.target.value);
            onChange?.();
          }}
          className={clsx(
            "bg-field text-text placeholder:text-secondary h-12 min-w-0 flex-1 rounded-xl px-4 text-[1rem] outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60",
            error ? "ring-danger/70 ring-2" : "focus:ring-unread/60",
          )}
        />
      </div>
      {error && <p className="text-danger text-[0.875rem]">{error}</p>}
    </div>
  );
}
