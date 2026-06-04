import { prisma } from "../config/prisma.js";
import type { CreateEventTypeInput } from "../validations/catalog.validation.js";

type ServiceResult = {
  success: boolean;
  statusCode: number;
  message: string;
  data?: unknown;
};

export async function listEventTypesService(): Promise<ServiceResult> {
  const eventTypes = await prisma.eventType.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });

  return {
    success: true,
    statusCode: 200,
    message: "Event types fetched successfully",
    data: { eventTypes },
  };
}

export async function createEventTypeService(
  data: CreateEventTypeInput
): Promise<ServiceResult> {
  const existing = await prisma.eventType.findUnique({
    where: { name: data.name },
  });

  if (existing) {
    return {
      success: false,
      statusCode: 409,
      message: "An event type with this name already exists",
      data: { eventType: existing },
    };
  }

  const eventType = await prisma.eventType.create({
    data: { name: data.name },
  });

  return {
    success: true,
    statusCode: 201,
    message: "Event type created successfully",
    data: { eventType },
  };
}
