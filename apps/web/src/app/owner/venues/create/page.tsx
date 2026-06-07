import { RoleGuard } from "@/components/auth/role-guard";
import { LogoutButton } from "@/features/auth/logout-button";

export default function CreateVenuePage() {
  return (
    <RoleGuard allowedRoles={["OWNER"]} allowedStatuses={["ACTIVE"]}>
      <main className="flex min-h-screen flex-col items-center justify-center gap-4">
        <h1 className="text-2xl font-semibold">Create Venue</h1>
        <LogoutButton />
      </main>
    </RoleGuard>
  );
}
