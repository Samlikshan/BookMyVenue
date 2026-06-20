import { prisma } from "../config/prisma.js";
import { assertStartBeforeEnd, doTimeRangesOverlap } from "../utils/time.js";
import type {
  ApplyVenueSlotTemplatesInput,
  CreateCustomVenueDateSlotInput,
  ListVenueDateSlotsQuery,
  UpdateVenueDateSlotInput,
} from "../validations/venue-availability.validation.js";
import {
  ensureNoDateSlotOverlap,
  ensureOwnerVenue,
  formatDateOnly,
  normalizeDateOnly,
  throwServiceError,
  toServiceResult,
  validateDateRange,
  type ServiceResult,
} from "./venue-calendar-availability.helpers.js";

function uniqueStrings(values: string[]): string[] {
  return Array.from(new Set(values));
}

export async function listVenueDateSlotsService(
  ownerId: string,
  venueId: string,
  query: ListVenueDateSlotsQuery
): Promise<ServiceResult> {
  try {
    const { fromDate, toDate } = validateDateRange(query.from, query.to);
    await ensureOwnerVenue(prisma, ownerId, venueId);

    const dateSlots = await prisma.venueDateSlot.findMany({
      where: {
        venueId,
        date: { gte: fromDate, lte: toDate },
      },
      orderBy: [{ date: "asc" }, { startTime: "asc" }],
    });

    return {
      success: true,
      statusCode: 200,
      message: "Venue date slots fetched successfully",
      data: dateSlots,
    };
  } catch (error) {
    return toServiceResult(error);
  }
}

export async function applyVenueSlotTemplatesService(
  ownerId: string,
  venueId: string,
  payload: ApplyVenueSlotTemplatesInput
): Promise<ServiceResult> {
  try {
    const result = await prisma.$transaction(async (tx) => {
      await ensureOwnerVenue(tx, ownerId, venueId);

      const dates = uniqueStrings(payload.dates).map(normalizeDateOnly);
      const templateIds = uniqueStrings(payload.slotTemplateIds);
      const templates = await tx.venueSlotTemplate.findMany({
        where: {
          id: { in: templateIds },
          venueId,
          isActive: true,
        },
        orderBy: { startTime: "asc" },
      });

      if (templates.length !== templateIds.length) {
        throwServiceError(404, "One or more slot templates were not found");
      }

      const existingSlots = await tx.venueDateSlot.findMany({
        where: {
          venueId,
          date: { in: dates },
          isAvailable: true,
        },
      });

      const slotsByDate = new Map<string, typeof existingSlots>();
      for (const slot of existingSlots) {
        const key = formatDateOnly(slot.date);
        slotsByDate.set(key, [...(slotsByDate.get(key) ?? []), slot]);
      }

      const createRows: {
        venueId: string;
        slotTemplateId: string;
        date: Date;
        startTime: string;
        endTime: string;
        isAvailable: boolean;
        source: "TEMPLATE";
      }[] = [];
      const skippedDuplicates: {
        date: string;
        startTime: string;
        endTime: string;
      }[] = [];
      const plannedByDate = new Map<
        string,
        { startTime: string; endTime: string }[]
      >();

      for (const date of dates) {
        const dateKey = formatDateOnly(date);
        const existingForDate = slotsByDate.get(dateKey) ?? [];
        const plannedForDate = plannedByDate.get(dateKey) ?? [];

        for (const template of templates) {
          const exactExisting = existingForDate.some(
            (slot) =>
              slot.startTime === template.startTime &&
              slot.endTime === template.endTime
          );
          const exactPlanned = plannedForDate.some(
            (slot) =>
              slot.startTime === template.startTime &&
              slot.endTime === template.endTime
          );

          if (exactExisting || exactPlanned) {
            skippedDuplicates.push({
              date: dateKey,
              startTime: template.startTime,
              endTime: template.endTime,
            });
            continue;
          }

          const overlapsExisting = existingForDate.some((slot) =>
            doTimeRangesOverlap(
              slot.startTime,
              slot.endTime,
              template.startTime,
              template.endTime
            )
          );
          const overlapsPlanned = plannedForDate.some((slot) =>
            doTimeRangesOverlap(
              slot.startTime,
              slot.endTime,
              template.startTime,
              template.endTime
            )
          );

          if (overlapsExisting || overlapsPlanned) {
            throwServiceError(
              409,
              `Slot ${template.startTime} - ${template.endTime} overlaps an existing slot on ${dateKey}`
            );
          }

          plannedForDate.push({
            startTime: template.startTime,
            endTime: template.endTime,
          });
          plannedByDate.set(dateKey, plannedForDate);

          createRows.push({
            venueId,
            slotTemplateId: template.id,
            date,
            startTime: template.startTime,
            endTime: template.endTime,
            isAvailable: true,
            source: "TEMPLATE",
          });
        }
      }

      const created =
        createRows.length > 0
          ? await tx.venueDateSlot.createManyAndReturn({
              data: createRows,
            })
          : [];

      return { created, skippedDuplicates };
    }, { timeout: 15000 });

    return {
      success: true,
      statusCode: 201,
      message: "Slot templates applied successfully",
      data: result,
    };
  } catch (error) {
    return toServiceResult(error);
  }
}

export async function createCustomVenueDateSlotService(
  ownerId: string,
  venueId: string,
  payload: CreateCustomVenueDateSlotInput
): Promise<ServiceResult> {
  try {
    const dateSlot = await prisma.$transaction(async (tx) => {
      await ensureOwnerVenue(tx, ownerId, venueId);
      const date = normalizeDateOnly(payload.date);
      assertStartBeforeEnd(payload.startTime, payload.endTime);
      await ensureNoDateSlotOverlap(
        tx,
        venueId,
        date,
        payload.startTime,
        payload.endTime
      );

      return tx.venueDateSlot.create({
        data: {
          venueId,
          slotTemplateId: null,
          date,
          startTime: payload.startTime,
          endTime: payload.endTime,
          isAvailable: true,
          source: "CUSTOM",
        },
      });
    });

    return {
      success: true,
      statusCode: 201,
      message: "Custom date slot created successfully",
      data: dateSlot,
    };
  } catch (error) {
    return toServiceResult(error);
  }
}

export async function updateVenueDateSlotService(
  ownerId: string,
  venueId: string,
  dateSlotId: string,
  payload: UpdateVenueDateSlotInput
): Promise<ServiceResult> {
  try {
    const dateSlot = await prisma.$transaction(async (tx) => {
      await ensureOwnerVenue(tx, ownerId, venueId);

      const current = await tx.venueDateSlot.findFirst({
        where: { id: dateSlotId, venueId },
      });

      if (!current) {
        throwServiceError(404, "Date slot not found");
      }

      const next = {
        startTime: payload.startTime ?? current.startTime,
        endTime: payload.endTime ?? current.endTime,
        isAvailable: payload.isAvailable ?? current.isAvailable,
      };

      assertStartBeforeEnd(next.startTime, next.endTime);

      if (next.isAvailable) {
        await ensureNoDateSlotOverlap(
          tx,
          venueId,
          current.date,
          next.startTime,
          next.endTime,
          dateSlotId
        );
      }

      const timeChanged =
        payload.startTime !== undefined || payload.endTime !== undefined;

      return tx.venueDateSlot.update({
        where: { id: dateSlotId },
        data: {
          ...(payload.startTime !== undefined
            ? { startTime: payload.startTime }
            : {}),
          ...(payload.endTime !== undefined ? { endTime: payload.endTime } : {}),
          ...(payload.isAvailable !== undefined
            ? { isAvailable: payload.isAvailable }
            : {}),
          ...(timeChanged ? { source: "CUSTOM" } : {}),
        },
      });
    });

    return {
      success: true,
      statusCode: 200,
      message: "Date slot updated successfully",
      data: dateSlot,
    };
  } catch (error) {
    return toServiceResult(error);
  }
}

export async function deleteVenueDateSlotService(
  ownerId: string,
  venueId: string,
  dateSlotId: string
): Promise<ServiceResult> {
  try {
    await prisma.$transaction(async (tx) => {
      await ensureOwnerVenue(tx, ownerId, venueId);

      const dateSlot = await tx.venueDateSlot.findFirst({
        where: { id: dateSlotId, venueId },
      });

      if (!dateSlot) {
        throwServiceError(404, "Date slot not found");
      }

      await tx.venueDateSlot.delete({ where: { id: dateSlotId } });
    });

    return {
      success: true,
      statusCode: 200,
      message: "Date slot deleted successfully",
    };
  } catch (error) {
    return toServiceResult(error);
  }
}
