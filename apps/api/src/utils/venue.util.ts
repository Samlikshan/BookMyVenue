import type { VenueStatus } from "../generated/prisma/enums.js";

export const EDITABLE_VENUE_STATUSES: VenueStatus[] = ["DRAFT", "REJECTED"];

export function isVenueEditable(status: VenueStatus): boolean {
  return EDITABLE_VENUE_STATUSES.includes(status);
}

export const venueInclude = {
  images: { orderBy: { createdAt: "asc" as const } },
  videos: { orderBy: { createdAt: "asc" as const } },
  amenities: { orderBy: { name: "asc" as const } },
  eventTypes: { include: { eventType: true } },
} as const;
