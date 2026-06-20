import { prisma } from "../config/prisma.js";
import { doTimeRangesOverlap } from "../utils/time.js";

export type ServiceResult = {
  success: boolean;
  statusCode: number;
  message: string;
  data?: unknown;
  errors?: unknown;
};

export type TransactionClient = Parameters<
  Parameters<typeof prisma.$transaction>[0]
>[0];

export function serviceError(statusCode: number, message: string): ServiceResult {
  return { success: false, statusCode, message };
}

export function toServiceResult(error: unknown): ServiceResult {
  if (error instanceof Error && "statusCode" in error) {
    return serviceError(
      Number((error as Error & { statusCode: number }).statusCode),
      error.message
    );
  }

  return serviceError(500, "Unexpected availability error");
}

export function throwServiceError(statusCode: number, message: string): never {
  throw Object.assign(new Error(message), { statusCode });
}

export async function ensureOwnerVenue(
  tx: TransactionClient,
  ownerId: string,
  venueId: string
) {
  const venue = await tx.venue.findFirst({
    where: { id: venueId, ownerId, deletedAt: null },
  });

  if (!venue) {
    throwServiceError(404, "Venue not found");
  }

  return venue;
}

export function normalizeDateOnly(dateString: string): Date {
  const date = new Date(`${dateString}T00:00:00.000Z`);

  if (
    Number.isNaN(date.getTime()) ||
    date.toISOString().slice(0, 10) !== dateString
  ) {
    throwServiceError(400, "Invalid date");
  }

  return date;
}

export function formatDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function validateDateRange(
  from: string,
  to: string,
  maxDays = 90
): { fromDate: Date; toDate: Date } {
  const fromDate = normalizeDateOnly(from);
  const toDate = normalizeDateOnly(to);

  if (fromDate > toDate) {
    throwServiceError(400, "from must be before or equal to to");
  }

  const dayMs = 24 * 60 * 60 * 1000;
  const rangeDays = Math.floor((toDate.getTime() - fromDate.getTime()) / dayMs) + 1;

  if (rangeDays > maxDays) {
    throwServiceError(400, `Date range cannot exceed ${maxDays} days`);
  }

  return { fromDate, toDate };
}

export async function ensureNoDateSlotOverlap(
  tx: TransactionClient,
  venueId: string,
  date: Date,
  startTime: string,
  endTime: string,
  excludeDateSlotId?: string
) {
  const existingSlots = await tx.venueDateSlot.findMany({
    where: {
      venueId,
      date,
      isAvailable: true,
      ...(excludeDateSlotId ? { id: { not: excludeDateSlotId } } : {}),
    },
  });

  const overlapping = existingSlots.find((slot) =>
    doTimeRangesOverlap(slot.startTime, slot.endTime, startTime, endTime)
  );

  if (overlapping) {
    throwServiceError(
      409,
      `Slot ${startTime} - ${endTime} overlaps an existing slot on ${formatDateOnly(date)}`
    );
  }
}
