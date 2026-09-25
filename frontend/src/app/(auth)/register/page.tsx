import { RedirectIfAuthed } from "@/features/auth/AuthGuards";
import { RegisterScreen } from "@/features/auth/RegisterScreen";

export default function RegisterPage() {
  return (
    <RedirectIfAuthed>
      <RegisterScreen />
    </RedirectIfAuthed>
  );
}
