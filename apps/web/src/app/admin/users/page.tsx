"use client";

import { ShieldAlert, Users } from "lucide-react";

import { RoleGuard } from "@/components/auth/role-guard";
import { AdminLayout } from "@/components/layout/admin-layout";

export default function AdminUsersPage() {
  return (
    <RoleGuard allowedRoles={["ADMIN"]}>
      <AdminLayout>
        <div className="space-y-8 animate-fade-in-up">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-zinc-950 dark:text-white">
              Users Directory
            </h1>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Manage platform members, guest accounts, and credentials directory.
            </p>
          </div>

          {/* Directory Empty Slate */}
          <div className="flex flex-col items-center justify-center py-24 text-center rounded-2xl border border-dashed border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/10">
            <div className="flex size-14 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-400 mb-4">
              <Users className="size-7" />
            </div>
            <h4 className="text-lg font-bold text-zinc-900 dark:text-white">Directory search locked</h4>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 max-w-sm">
              User profile directory search is restricted to active system operators. Full database query features are disabled in this build phase.
            </p>
          </div>
        </div>
      </AdminLayout>
    </RoleGuard>
  );
}
