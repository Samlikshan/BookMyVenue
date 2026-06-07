import { AuthGuard } from "@/components/auth/auth-guard";
import { LogoutButton } from "@/features/auth/logout-button";

export default function ProfilePage() {
  return (
    <AuthGuard>
      <main className="flex min-h-screen flex-col items-center justify-center gap-4">
        <h1 className="text-2xl font-semibold">Profile</h1>
        <LogoutButton />
      </main>
    </AuthGuard>
  );
}
