import type { Request, Response } from "express";
import {
  createVenueAvailabilityService,
  deleteVenueAvailabilityService,
  listVenueAvailabilityService,
  updateVenueAvailabilityService,
} from "../services/venue-availability.service.js";
import { paramString } from "../utils/params.util.js";
import {
  createVenueAvailabilitySchema,
  updateVenueAvailabilitySchema,
} from "../validations/venue-availability.validation.js";

export async function listVenueAvailability(req: Request, res: Response) {
  const ownerId = req.user!.profile.id;
  const venueId = paramString(req.params.venueId, "venueId");
  const result = await listVenueAvailabilityService(ownerId, venueId);
  return res.status(result.statusCode).json(result);
}

export async function createVenueAvailability(req: Request, res: Response) {
  const parsed = createVenueAvailabilitySchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: parsed.error.flatten().fieldErrors,
    });
  }

  const ownerId = req.user!.profile.id;
  const venueId = paramString(req.params.venueId, "venueId");
  const result = await createVenueAvailabilityService(
    ownerId,
    venueId,
    parsed.data
  );
  return res.status(result.statusCode).json(result);
}

export async function updateVenueAvailability(req: Request, res: Response) {
  const parsed = updateVenueAvailabilitySchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: parsed.error.flatten().fieldErrors,
    });
  }

  const ownerId = req.user!.profile.id;
  const venueId = paramString(req.params.venueId, "venueId");
  const availabilityId = paramString(
    req.params.availabilityId,
    "availabilityId"
  );
  const result = await updateVenueAvailabilityService(
    ownerId,
    venueId,
    availabilityId,
    parsed.data
  );
  return res.status(result.statusCode).json(result);
}

export async function deleteVenueAvailability(req: Request, res: Response) {
  const ownerId = req.user!.profile.id;
  const venueId = paramString(req.params.venueId, "venueId");
  const availabilityId = paramString(
    req.params.availabilityId,
    "availabilityId"
  );
  const result = await deleteVenueAvailabilityService(
    ownerId,
    venueId,
    availabilityId
  );
  return res.status(result.statusCode).json(result);
}
