import { prisma } from "../config/prisma.js";
import type { VenueStatus } from "../generated/prisma/enums.js";
import {
  generateUniqueSlug,
  normalizeAmenityNames,
} from "../utils/slug.util.js";
import { isVenueEditable, venueInclude } from "../utils/venue.util.js";
import type {
  CreateVenueInput,
  UpdateVenueInput,
} from "../validations/venue.validation.js";

type ServiceResult = {
  success: boolean;
  statusCode: number;
  message: string;
  data?: unknown;
  errors?: unknown;
};

async function slugExists(slug: string, excludeVenueId?: string): Promise<boolean> {
  const existing = await prisma.venue.findFirst({
    where: {
      slug,
      deletedAt: null,
      ...(excludeVenueId ? { id: { not: excludeVenueId } } : {}),
    },
  });
  return existing != null;
}

async function validateEventTypeIds(eventTypeIds: string[]) {
  if (eventTypeIds.length === 0) return { ok: true as const };

  const types = await prisma.eventType.findMany({
    where: { id: { in: eventTypeIds }, isActive: true },
  });

  if (types.length !== eventTypeIds.length) {
    return {
      ok: false as const,
      message: "One or more event types are invalid or inactive",
    };
  }

  return { ok: true as const };
}

async function syncEventTypes(venueId: string, eventTypeIds: string[]) {
  await prisma.venueEventType.deleteMany({ where: { venueId } });
  if (eventTypeIds.length > 0) {
    await prisma.venueEventType.createMany({
      data: eventTypeIds.map((eventTypeId) => ({ venueId, eventTypeId })),
    });
  }
}

async function syncAmenities(venueId: string, amenityNames: string[]) {
  const names = normalizeAmenityNames(amenityNames);
  await prisma.venueAmenity.deleteMany({ where: { venueId } });
  if (names.length > 0) {
    await prisma.venueAmenity.createMany({
      data: names.map((name) => ({ venueId, name })),
    });
  }
}

async function validateSubmitReadiness(venueId: string) {
  const venue = await prisma.venue.findFirst({
    where: { id: venueId, deletedAt: null },
    include: {
      images: true,
      eventTypes: true,
      amenities: true,
    },
  });

  if (!venue) {
    return { ok: false as const, message: "Venue not found", statusCode: 404 };
  }

  const errors: string[] = [];

  if (venue.capacityMin == null || venue.capacityMax == null) {
    errors.push("capacityMin and capacityMax are required");
  } else if (venue.capacityMin > venue.capacityMax) {
    errors.push("capacityMin cannot be greater than capacityMax");
  }
  if (venue.eventTypes.length === 0) {
    errors.push("At least one event type is required");
  }
  if (venue.amenities.length === 0) {
    errors.push("At least one amenity is required");
  }
  if (venue.images.length === 0) {
    errors.push("At least one image is required");
  } else {
    const primaryCount = venue.images.filter((i) => i.isPrimary).length;
    if (primaryCount !== 1) {
      errors.push("Exactly one primary image is required");
    }
  }

  if (errors.length > 0) {
    return {
      ok: false as const,
      message: "Venue is not ready for approval",
      statusCode: 400,
      errors,
    };
  }

  return { ok: true as const };
}

export async function createVenueService(
  data: CreateVenueInput
): Promise<ServiceResult> {
  const owner = await prisma.profile.findUnique({
    where: { id: data.ownerId },
  });

  if (!owner) {
    return {
      success: false,
      statusCode: 404,
      message: "Owner profile not found",
    };
  }

  if (data.eventTypeIds?.length) {
    const eventCheck = await validateEventTypeIds(data.eventTypeIds);
    if (!eventCheck.ok) {
      return { success: false, statusCode: 400, message: eventCheck.message };
    }
  }

  const slug = await generateUniqueSlug(data.name, (s) => slugExists(s));

  const venue = await prisma.$transaction(async (tx) => {
    const created = await tx.venue.create({
      data: {
        ownerId: data.ownerId,
        name: data.name,
        slug,
        shortDescription: data.shortDescription ?? null,
        description: data.description ?? null,
        capacityMin: data.capacityMin ?? null,
        capacityMax: data.capacityMax ?? null,
        addressLine1: data.addressLine1,
        addressLine2: data.addressLine2 ?? null,
        city: data.city,
        district: data.district ?? null,
        state: data.state,
        country: data.country ?? "India",
        postalCode: data.postalCode ?? null,
        status: (data.status as VenueStatus) ?? "DRAFT",
      },
    });

    if (data.eventTypeIds?.length) {
      await tx.venueEventType.createMany({
        data: data.eventTypeIds.map((eventTypeId) => ({
          venueId: created.id,
          eventTypeId,
        })),
      });
    }

    if (data.amenityNames?.length) {
      const names = normalizeAmenityNames(data.amenityNames);
      if (names.length > 0) {
        await tx.venueAmenity.createMany({
          data: names.map((name) => ({ venueId: created.id, name })),
        });
      }
    }

    return created;
  });

  if (data.status === "PENDING_APPROVAL") {
    const submitCheck = await validateSubmitReadiness(venue.id);
    if (!submitCheck.ok) {
      await prisma.venue.update({
        where: { id: venue.id },
        data: { status: "DRAFT" },
      });
      return {
        success: false,
        statusCode: submitCheck.statusCode,
        message: submitCheck.message,
        errors: submitCheck.errors,
      };
    }
  }

  const full = await prisma.venue.findUnique({
    where: { id: venue.id },
    include: venueInclude,
  });

  return {
    success: true,
    statusCode: 201,
    message: "Venue created successfully",
    data: { venue: full },
  };
}

export async function getVenueService(venueId: string): Promise<ServiceResult> {
  const venue = await prisma.venue.findFirst({
    where: { id: venueId, deletedAt: null },
    include: venueInclude,
  });

  if (!venue) {
    return { success: false, statusCode: 404, message: "Venue not found" };
  }

  return {
    success: true,
    statusCode: 200,
    message: "Venue fetched successfully",
    data: { venue },
  };
}

export async function updateVenueService(
  venueId: string,
  data: UpdateVenueInput
): Promise<ServiceResult> {
  const venue = await prisma.venue.findFirst({
    where: { id: venueId, deletedAt: null },
  });

  if (!venue) {
    return { success: false, statusCode: 404, message: "Venue not found" };
  }

  if (!isVenueEditable(venue.status)) {
    return {
      success: false,
      statusCode: 409,
      message: `Venue cannot be edited while status is ${venue.status}`,
    };
  }

  if (data.eventTypeIds !== undefined) {
    const eventCheck = await validateEventTypeIds(data.eventTypeIds);
    if (!eventCheck.ok) {
      return { success: false, statusCode: 400, message: eventCheck.message };
    }
  }

  if (data.status === "PENDING_APPROVAL") {
    const submitCheck = await validateSubmitReadiness(venueId);
    if (!submitCheck.ok) {
      return {
        success: false,
        statusCode: submitCheck.statusCode,
        message: submitCheck.message,
        errors: submitCheck.errors,
      };
    }
  }

  let slug = venue.slug;
  if (data.name && data.name !== venue.name) {
    slug = await generateUniqueSlug(data.name, (s) => slugExists(s, venueId));
  }

  await prisma.$transaction(async (tx) => {
    await tx.venue.update({
      where: { id: venueId },
      data: {
        ...(data.name !== undefined ? { name: data.name, slug } : {}),
        ...(data.shortDescription !== undefined
          ? { shortDescription: data.shortDescription }
          : {}),
        ...(data.description !== undefined
          ? { description: data.description }
          : {}),
        ...(data.capacityMin !== undefined
          ? { capacityMin: data.capacityMin }
          : {}),
        ...(data.capacityMax !== undefined
          ? { capacityMax: data.capacityMax }
          : {}),
        ...(data.addressLine1 !== undefined
          ? { addressLine1: data.addressLine1 }
          : {}),
        ...(data.addressLine2 !== undefined
          ? { addressLine2: data.addressLine2 }
          : {}),
        ...(data.city !== undefined ? { city: data.city } : {}),
        ...(data.district !== undefined ? { district: data.district } : {}),
        ...(data.state !== undefined ? { state: data.state } : {}),
        ...(data.country !== undefined ? { country: data.country } : {}),
        ...(data.postalCode !== undefined ? { postalCode: data.postalCode } : {}),
        ...(data.status !== undefined ? { status: data.status as VenueStatus } : {}),
        ...(data.status === "PENDING_APPROVAL"
          ? { rejectionReason: null }
          : {}),
      },
    });

    if (data.eventTypeIds !== undefined) {
      await syncEventTypes(venueId, data.eventTypeIds);
    }

    if (data.amenityNames !== undefined) {
      await syncAmenities(venueId, data.amenityNames);
    }
  });

  const full = await prisma.venue.findUnique({
    where: { id: venueId },
    include: venueInclude,
  });

  return {
    success: true,
    statusCode: 200,
    message: "Venue updated successfully",
    data: { venue: full },
  };
}

export async function deleteVenueService(venueId: string): Promise<ServiceResult> {
  const venue = await prisma.venue.findFirst({
    where: { id: venueId, deletedAt: null },
  });

  if (!venue) {
    return { success: false, statusCode: 404, message: "Venue not found" };
  }

  if (!isVenueEditable(venue.status)) {
    return {
      success: false,
      statusCode: 409,
      message: `Venue cannot be deleted while status is ${venue.status}`,
    };
  }

  await prisma.venue.update({
    where: { id: venueId },
    data: { deletedAt: new Date() },
  });

  return {
    success: true,
    statusCode: 200,
    message: "Venue deleted successfully",
  };
}
