"use client";

import { CalendarClock, Filter } from "lucide-react";
import { useState } from "react";

import { RoleGuard } from "@/components/auth/role-guard";
import { OwnerLayout } from "@/components/layout/owner-layout";
import { Button } from "@/components/ui/button";

export default function OwnerBookingsPage() {
  const [filter, setFilter] = useState("all");

  return (
    <RoleGuard allowedRoles={["OWNER"]}>
      <OwnerLayout>
        <div className="space-y-8 animate-fade-in-up">
          {/* Header */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-zinc-950 dark:text-white">
                Bookings Manager
              </h1>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                Track reservation requests, approve dates, and view historical bookings.
              </p>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="gap-2 border-zinc-205">
                <Filter className="size-4" />
                Filter
              </Button>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="flex gap-1.5 rounded-lg bg-zinc-100 p-1 w-fit dark:bg-zinc-900">
            {["all", "pending", "confirmed", "cancelled"].map((item) => (
              <button
                key={item}
                onClick={() => setFilter(item)}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold capitalize transition-all duration-200 ${
                  filter === item
                    ? "bg-white text-zinc-900 shadow-xs dark:bg-zinc-800 dark:text-white"
                    : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
                }`}
              >
                {item}
              </button>
            ))}
          </div>

          {/* Bookings Empty Slate */}
          <div className="flex flex-col items-center justify-center py-24 text-center rounded-2xl border border-dashed border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/10">
            <div className="flex size-14 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-400 mb-4">
              <CalendarClock className="size-7" />
            </div>
            <h4 className="text-lg font-bold text-zinc-900 dark:text-white">No booking requests</h4>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 max-w-sm">
              Booking transactions are disabled in this phase. Once users can submit booking requests, they will populate here for your review.
            </p>
          </div>
        </div>
      </OwnerLayout>
    </RoleGuard>
  );
}
