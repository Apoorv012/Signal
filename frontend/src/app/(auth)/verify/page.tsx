import { Suspense } from "react";

import { AuthShell } from "@/features/auth/AuthShell";
import { VerifyForm } from "@/features/auth/VerifyForm";

export default function VerifyPage() {
  return (
    <AuthShell title="Enter the code" subtitle="We sent you a 6-digit verification code.">
      {/* useSearchParams needs a Suspense boundary during static rendering. */}
      <Suspense>
        <VerifyForm />
      </Suspense>
    </AuthShell>
  );
}
