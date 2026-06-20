import { prisma } from "../config/prisma.js";
import {
  assertStartBeforeEnd,
  doTimeRangesOverlap,
} from "../utils/time.js";
import type {
  CreateVenueAvailabilityInput,
  UpdateVenueAvailabilityInput,
} from "../validations/venue-availability.validation.js";

type ServiceResult = {
  success: boolean;
  statusCode: number;
  message: string;
  data?: unknown;
  errors?: unknown;
};

type TransactionClient = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

function serviceError(statusCode: number, message: string): ServiceResult {
  return { success: false, statusCode, message };
}

export async function ensureOwnerVenue(
  tx: TransactionClient,
  ownerId: string,
  venueId: string
) {
  const venue = await tx.venue.findFirst({
    where: {
      id: venueId,
      ownerId,
      deletedAt: null,
    },
  });

  if (!venue) {
    throw Object.assign(new Error("Venue not found"), { statusCode: 404 });
  }

  return venue;
}

export async function ensureNoAvailabilityOverlap(
  tx: TransactionClient,
  venueId: string,
  dayOfWeek: number,
  startTime: string,
  endTime: string,
  excludeAvailabilityId?: string
) {
  const existingSlots = await tx.venueAvailability.findMany({
    where: {
      venueId,
      dayOfWeek,
      isActive: true,
      ...(excludeAvailabilityId ? { id: { not: excludeAvailabilityId } } : {}),
    },
  });

  const hasOverlap = existingSlots.some((slot) =>
    doTimeRangesOverlap(slot.startTime, slot.endTime, startTime, endTime)
  );

  if (hasOverlap) {
    throw Object.assign(
      new Error("Availability slot overlaps with an existing active slot"),
      { statusCode: 409 }
    );
  }
}

function toServiceResult(error: unknown): ServiceResult {
  if (error instanceof Error && "statusCode" in error) {
    return serviceError(
      Number((error as Error & { statusCode: number }).statusCode),
      error.message
    );
  }

  return serviceError(500, "Unexpected availability error");
}

export async function listVenueAvailabilityService(
  ownerId: string,
  venueId: string
): Promise<ServiceResult> {
  try {
    await ensureOwnerVenue(prisma, ownerId, venueId);

    const availability = await prisma.venueAvailability.findMany({
      where: { venueId },
      orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
    });

    return {
      success: true,
      statusCode: 200,
      message: "Venue availability fetched successfully",
      data: availability,
    };
  } catch (error) {
    return toServiceResult(error);
  }
}

export async function createVenueAvailabilityService(
  ownerId: string,
  venueId: string,
  payload: CreateVenueAvailabilityInput
): Promise<ServiceResult> {
  try {
    const availability = await prisma.$transaction(async (tx) => {
      await ensureOwnerVenue(tx, ownerId, venueId);
      assertStartBeforeEnd(payload.startTime, payload.endTime);
      await ensureNoAvailabilityOverlap(
        tx,
        venueId,
        payload.dayOfWeek,
        payload.startTime,
        payload.endTime
      );

      return tx.venueAvailability.create({
        data: {
          venueId,
          dayOfWeek: payload.dayOfWeek,
          startTime: payload.startTime,
          endTime: payload.endTime,
        },
      });
    });

    return {
      success: true,
      statusCode: 201,
      message: "Venue availability created successfully",
      data: availability,
    };
  } catch (error) {
    return toServiceResult(error);
  }
}

export async function updateVenueAvailabilityService(
  ownerId: string,
  venueId: string,
  availabilityId: string,
  payload: UpdateVenueAvailabilityInput
): Promise<ServiceResult> {
  try {
    const availability = await prisma.$transaction(async (tx) => {
      await ensureOwnerVenue(tx, ownerId, venueId);

      const current = await tx.venueAvailability.findFirst({
        where: { id: availabilityId, venueId },
      });

      if (!current) {
        throw Object.assign(new Error("Availability slot not found"), {
          statusCode: 404,
        });
      }

      const next = {
        dayOfWeek: payload.dayOfWeek ?? current.dayOfWeek,
        startTime: payload.startTime ?? current.startTime,
        endTime: payload.endTime ?? current.endTime,
        isActive: payload.isActive ?? current.isActive,
      };

      assertStartBeforeEnd(next.startTime, next.endTime);

      if (next.isActive) {
        await ensureNoAvailabilityOverlap(
          tx,
          venueId,
          next.dayOfWeek,
          next.startTime,
          next.endTime,
          availabilityId
        );
      }

      return tx.venueAvailability.update({
        where: { id: availabilityId },
        data: {
          ...(payload.dayOfWeek !== undefined
            ? { dayOfWeek: payload.dayOfWeek }
            : {}),
          ...(payload.startTime !== undefined
            ? { startTime: payload.startTime }
            : {}),
          ...(payload.endTime !== undefined ? { endTime: payload.endTime } : {}),
          ...(payload.isActive !== undefined
            ? { isActive: payload.isActive }
            : {}),
        },
      });
    });

    return {
      success: true,
      statusCode: 200,
      message: "Venue availability updated successfully",
      data: availability,
    };
  } catch (error) {
    return toServiceResult(error);
  }
}

export async function deleteVenueAvailabilityService(
  ownerId: string,
  venueId: string,
  availabilityId: string
): Promise<ServiceResult> {
  try {
    await prisma.$transaction(async (tx) => {
      await ensureOwnerVenue(tx, ownerId, venueId);

      const availability = await tx.venueAvailability.findFirst({
        where: { id: availabilityId, venueId },
      });

      if (!availability) {
        throw Object.assign(new Error("Availability slot not found"), {
          statusCode: 404,
        });
      }

      await tx.venueAvailability.delete({ where: { id: availabilityId } });
    });

    return {
      success: true,
      statusCode: 200,
      message: "Venue availability deleted successfully",
    };
  } catch (error) {
    return toServiceResult(error);
  }
}
