import { prisma } from "../config/prisma.js";
import { assertStartBeforeEnd } from "../utils/time.js";
import type {
  CreateVenueSlotTemplateInput,
  UpdateVenueSlotTemplateInput,
} from "../validations/venue-availability.validation.js";
import {
  ensureOwnerVenue,
  throwServiceError,
  toServiceResult,
  type TransactionClient,
  type ServiceResult,
} from "./venue-calendar-availability.helpers.js";

async function ensureNoDuplicateActiveTemplate(
  tx: TransactionClient,
  venueId: string,
  startTime: string,
  endTime: string,
  excludeTemplateId?: string
) {
  const duplicate = await tx.venueSlotTemplate.findFirst({
    where: {
      venueId,
      startTime,
      endTime,
      isActive: true,
      ...(excludeTemplateId ? { id: { not: excludeTemplateId } } : {}),
    },
  });

  if (duplicate) {
    throwServiceError(409, "An active slot template with this time range already exists");
  }
}

export async function listVenueSlotTemplatesService(
  ownerId: string,
  venueId: string
): Promise<ServiceResult> {
  try {
    await ensureOwnerVenue(prisma, ownerId, venueId);

    const slotTemplates = await prisma.venueSlotTemplate.findMany({
      where: { venueId },
      orderBy: [{ isActive: "desc" }, { startTime: "asc" }],
    });

    return {
      success: true,
      statusCode: 200,
      message: "Venue slot templates fetched successfully",
      data: slotTemplates,
    };
  } catch (error) {
    return toServiceResult(error);
  }
}

export async function createVenueSlotTemplateService(
  ownerId: string,
  venueId: string,
  payload: CreateVenueSlotTemplateInput
): Promise<ServiceResult> {
  try {
    const slotTemplate = await prisma.$transaction(async (tx) => {
      await ensureOwnerVenue(tx, ownerId, venueId);
      assertStartBeforeEnd(payload.startTime, payload.endTime);
      await ensureNoDuplicateActiveTemplate(
        tx,
        venueId,
        payload.startTime,
        payload.endTime
      );

      return tx.venueSlotTemplate.create({
        data: {
          venueId,
          name: payload.name ?? null,
          startTime: payload.startTime,
          endTime: payload.endTime,
        },
      });
    });

    return {
      success: true,
      statusCode: 201,
      message: "Venue slot template created successfully",
      data: slotTemplate,
    };
  } catch (error) {
    return toServiceResult(error);
  }
}

export async function updateVenueSlotTemplateService(
  ownerId: string,
  venueId: string,
  slotTemplateId: string,
  payload: UpdateVenueSlotTemplateInput
): Promise<ServiceResult> {
  try {
    const slotTemplate = await prisma.$transaction(async (tx) => {
      await ensureOwnerVenue(tx, ownerId, venueId);

      const current = await tx.venueSlotTemplate.findFirst({
        where: { id: slotTemplateId, venueId },
      });

      if (!current) {
        throwServiceError(404, "Slot template not found");
      }

      const next = {
        startTime: payload.startTime ?? current.startTime,
        endTime: payload.endTime ?? current.endTime,
        isActive: payload.isActive ?? current.isActive,
      };

      assertStartBeforeEnd(next.startTime, next.endTime);

      if (next.isActive) {
        const duplicate = await tx.venueSlotTemplate.findFirst({
          where: {
            venueId,
            startTime: next.startTime,
            endTime: next.endTime,
            isActive: true,
            id: { not: slotTemplateId },
          },
        });

        if (duplicate) {
          throwServiceError(
            409,
            "An active slot template with this time range already exists"
          );
        }
      }

      return tx.venueSlotTemplate.update({
        where: { id: slotTemplateId },
        data: {
          ...(payload.name !== undefined ? { name: payload.name } : {}),
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
      message: "Venue slot template updated successfully",
      data: slotTemplate,
    };
  } catch (error) {
    return toServiceResult(error);
  }
}

export async function deleteVenueSlotTemplateService(
  ownerId: string,
  venueId: string,
  slotTemplateId: string
): Promise<ServiceResult> {
  try {
    await prisma.$transaction(async (tx) => {
      await ensureOwnerVenue(tx, ownerId, venueId);

      const slotTemplate = await tx.venueSlotTemplate.findFirst({
        where: { id: slotTemplateId, venueId },
      });

      if (!slotTemplate) {
        throwServiceError(404, "Slot template not found");
      }

      await tx.venueSlotTemplate.delete({ where: { id: slotTemplateId } });
    });

    return {
      success: true,
      statusCode: 200,
      message: "Venue slot template deleted successfully",
    };
  } catch (error) {
    return toServiceResult(error);
  }
}
