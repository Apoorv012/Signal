import { AuthShell } from "@/features/auth/AuthShell";
import { ProfileForm } from "@/features/auth/ProfileForm";

export default function ProfilePage() {
  return (
    <AuthShell title="Your profile" subtitle="Signal profiles are end-to-end encrypted.">
      <ProfileForm />
    </AuthShell>
  );
}
