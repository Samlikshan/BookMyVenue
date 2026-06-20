"use client";

import { Building2, Mail, Phone, ShieldCheck, User } from "lucide-react";

import { RoleGuard } from "@/components/auth/role-guard";
import { OwnerLayout } from "@/components/layout/owner-layout";
import { useAppSelector } from "@/store/hooks";

export default function OwnerProfilePage() {
  const { user } = useAppSelector((state) => state.auth);

  return (
    <RoleGuard allowedRoles={["OWNER"]}>
      <OwnerLayout>
        <div className="max-w-3xl mx-auto space-y-8 animate-fade-in-up">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-zinc-950 dark:text-white">
              My Profile
            </h1>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              View your account details and business registry statistics.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {/* Left Side: Avatar Card */}
            <div className="md:col-span-1 rounded-2xl border border-zinc-200 bg-white p-6 text-center shadow-xs dark:border-zinc-850 dark:bg-zinc-900/50">
              <div className="flex size-20 mx-auto items-center justify-center rounded-full bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 mb-4">
                <User className="size-10" />
              </div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white">
                {user?.fullName}
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 uppercase tracking-wider font-semibold">
                {user?.role}
              </p>

              <div className="mt-6 border-t border-zinc-100 pt-6 dark:border-zinc-800 flex justify-center">
                {user?.status === "PENDING" && (
                  <span className="inline-flex items-center rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800 dark:bg-amber-950/20 dark:text-amber-400 border border-amber-250">
                    Application Pending
                  </span>
                )}
                {user?.status === "ACTIVE" && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-250">
                    <ShieldCheck className="size-4" />
                    Verified Partner
                  </span>
                )}
                {user?.status === "REJECTED" && (
                  <span className="inline-flex items-center rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-800 dark:bg-red-950/20 dark:text-red-400 border border-red-250">
                    Rejected
                  </span>
                )}
              </div>
            </div>

            {/* Right Side: Fields */}
            <div className="md:col-span-2 rounded-2xl border border-zinc-200 bg-white p-6 shadow-xs dark:border-zinc-850 dark:bg-zinc-900/50 space-y-6">
              <h3 className="text-base font-bold text-zinc-900 dark:text-white border-b border-zinc-100 pb-3 dark:border-zinc-800">
                Registry Information
              </h3>

              <div className="space-y-4">
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex size-9 items-center justify-center rounded-lg bg-zinc-50 text-zinc-500 dark:bg-zinc-800/40 dark:text-zinc-400">
                    <Mail className="size-4.5" />
                  </div>
                  <div>
                    <p className="text-2xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase">Email Address</p>
                    <p className="font-semibold text-zinc-800 dark:text-zinc-200 mt-0.5">{user?.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-sm pt-4 border-t border-zinc-100 dark:border-zinc-800">
                  <div className="flex size-9 items-center justify-center rounded-lg bg-zinc-50 text-zinc-500 dark:bg-zinc-800/40 dark:text-zinc-400">
                    <Phone className="size-4.5" />
                  </div>
                  <div>
                    <p className="text-2xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase">Phone Number</p>
                    <p className="font-semibold text-zinc-800 dark:text-zinc-200 mt-0.5">{user?.phone || "Not Configured"}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-sm pt-4 border-t border-zinc-100 dark:border-zinc-800">
                  <div className="flex size-9 items-center justify-center rounded-lg bg-zinc-50 text-zinc-500 dark:bg-zinc-800/40 dark:text-zinc-400">
                    <Building2 className="size-4.5" />
                  </div>
                  <div>
                    <p className="text-2xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase">Business Name</p>
                    <p className="font-semibold text-zinc-800 dark:text-zinc-200 mt-0.5">
                      {user?.ownerApplication?.businessName || "N/A"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-sm pt-4 border-t border-zinc-100 dark:border-zinc-800">
                  <div className="flex size-9 items-center justify-center rounded-lg bg-zinc-50 text-zinc-500 dark:bg-zinc-800/40 dark:text-zinc-400">
                    <Building2 className="size-4.5" />
                  </div>
                  <div>
                    <p className="text-2xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase">Base City</p>
                    <p className="font-semibold text-zinc-800 dark:text-zinc-200 mt-0.5">
                      {user?.ownerApplication?.city || "N/A"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </OwnerLayout>
    </RoleGuard>
  );
}
