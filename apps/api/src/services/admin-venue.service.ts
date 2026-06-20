import { prisma } from "../config/prisma.js";
import { venueInclude } from "../utils/venue.util.js";
import type { VenueStatus } from "../generated/prisma/enums.js";
import type {
  ApproveVenueInput,
  RejectVenueInput,
} from "../validations/venue.validation.js";

type ServiceResult = {
  success: boolean;
  statusCode: number;
  message: string;
  data?: unknown;
  errors?: unknown;
};

export async function approveVenueService(
  venueId: string,
  data: ApproveVenueInput
): Promise<ServiceResult> {
  const venue = await prisma.venue.findFirst({
    where: { id: venueId, deletedAt: null },
  });

  if (!venue) {
    return { success: false, statusCode: 404, message: "Venue not found" };
  }

  if (venue.status !== "PENDING_APPROVAL") {
    return {
      success: false,
      statusCode: 409,
      message: `Venue cannot be approved while status is ${venue.status}`,
    };
  }

  const updated = await prisma.venue.update({
    where: { id: venueId },
    data: {
      status: "ACTIVE",
      rejectionReason: null,
      reviewedBy: data.reviewedBy ?? null,
      reviewedAt: new Date(),
    },
    include: venueInclude,
  });

  return {
    success: true,
    statusCode: 200,
    message: "Venue approved successfully",
    data: { venue: updated },
  };
}

export async function rejectVenueService(
  venueId: string,
  data: RejectVenueInput
): Promise<ServiceResult> {
  const venue = await prisma.venue.findFirst({
    where: { id: venueId, deletedAt: null },
  });

  if (!venue) {
    return { success: false, statusCode: 404, message: "Venue not found" };
  }

  if (venue.status !== "PENDING_APPROVAL") {
    return {
      success: false,
      statusCode: 409,
      message: `Venue cannot be rejected while status is ${venue.status}`,
    };
  }

  const updated = await prisma.venue.update({
    where: { id: venueId },
    data: {
      status: "REJECTED",
      rejectionReason: data.rejectionReason,
      reviewedAt: new Date(),
    },
    include: venueInclude,
  });

  return {
    success: true,
    statusCode: 200,
    message: "Venue rejected successfully",
    data: { venue: updated },
  };
}

export async function listAdminVenuesService(status?: string): Promise<ServiceResult> {
  const venues = await prisma.venue.findMany({
    where: {
      deletedAt: null,
      status: status ? (status as VenueStatus) : undefined,
    },
    include: venueInclude,
    orderBy: { createdAt: "desc" },
  });

  return {
    success: true,
    statusCode: 200,
    message: "Admin venues fetched successfully",
    data: { venues },
  };
}
