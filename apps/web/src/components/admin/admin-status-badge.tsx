import type { UserStatus } from "@/features/auth/types";
import type { Venue } from "@/features/venues/types";

export type VenueStatus = Venue["status"];

const userStatusStyles: Record<UserStatus, string> = {
  ACTIVE:
    "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900",
  PENDING:
    "bg-zinc-100 text-zinc-700 ring-1 ring-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:ring-zinc-700",
  REJECTED:
    "bg-red-50 text-red-700 ring-1 ring-red-200 dark:bg-red-950/30 dark:text-red-400 dark:ring-red-900/40",
  SUSPENDED:
    "bg-zinc-200 text-zinc-600 ring-1 ring-zinc-300 dark:bg-zinc-700 dark:text-zinc-300 dark:ring-zinc-600",
};

const venueStatusLabels: Record<VenueStatus, string> = {
  DRAFT: "Draft",
  PENDING_APPROVAL: "Pending",
  ACTIVE: "Published",
  REJECTED: "Rejected",
  SUSPENDED: "Suspended",
};

const venueStatusStyles: Record<VenueStatus, string> = {
  DRAFT:
    "bg-zinc-100 text-zinc-600 ring-1 ring-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:ring-zinc-700",
  PENDING_APPROVAL:
    "bg-zinc-100 text-zinc-800 ring-1 ring-zinc-300 dark:bg-zinc-800 dark:text-zinc-200 dark:ring-zinc-600",
  ACTIVE:
    "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900",
  REJECTED:
    "bg-red-50 text-red-700 ring-1 ring-red-200 dark:bg-red-950/30 dark:text-red-400 dark:ring-red-900/40",
  SUSPENDED:
    "bg-zinc-200 text-zinc-600 ring-1 ring-zinc-300 dark:bg-zinc-700 dark:text-zinc-300 dark:ring-zinc-600",
};

export function UserStatusBadge({ status }: { status: UserStatus }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${userStatusStyles[status]}`}
    >
      {status}
    </span>
  );
}

export function VenueStatusBadge({ status }: { status: VenueStatus }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${venueStatusStyles[status]}`}
    >
      {venueStatusLabels[status]}
    </span>
  );
}
