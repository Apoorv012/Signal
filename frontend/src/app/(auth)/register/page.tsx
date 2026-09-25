import { AuthShell } from "@/features/auth/AuthShell";
import { RedirectIfAuthed } from "@/features/auth/AuthGuards";
import { RegisterForm } from "@/features/auth/RegisterForm";

export default function RegisterPage() {
  return (
    <RedirectIfAuthed>
      <AuthShell
        title="Your phone number"
        subtitle="Enter your phone number to get started with Signal."
      >
        <RegisterForm />
      </AuthShell>
    </RedirectIfAuthed>
  );
}
