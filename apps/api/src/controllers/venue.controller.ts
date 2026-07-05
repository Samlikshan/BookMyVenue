import type { Request, Response } from "express";
import {
  createVenueService,
  deleteVenueService,
  getVenueService,
  listMyVenuesService,
  listPublicVenuesService,
  updateVenueService,
} from "../services/venue.service.js";
import { paramString } from "../utils/params.util.js";
import {
  createVenueSchema,
  updateVenueSchema,
} from "../validations/venue.validation.js";

export async function createVenue(req: Request, res: Response) {
  const parsed = createVenueSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: parsed.error.flatten().fieldErrors,
    });
  }

  const result = await createVenueService(req.user!.profile.id, parsed.data);
  return res.status(result.statusCode).json(result);
}

export async function getVenue(req: Request, res: Response) {
  const venueId = paramString(req.params.venueId, "venueId");
  const result = await getVenueService(venueId);
  return res.status(result.statusCode).json(result);
}

export async function updateVenue(req: Request, res: Response) {
  const parsed = updateVenueSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: parsed.error.flatten().fieldErrors,
    });
  }

  const venueId = paramString(req.params.venueId, "venueId");
  const result = await updateVenueService(req.user!.profile.id, venueId, parsed.data);
  return res.status(result.statusCode).json(result);
}

export async function deleteVenue(req: Request, res: Response) {
  const venueId = paramString(req.params.venueId, "venueId");
  const result = await deleteVenueService(req.user!.profile.id, venueId);
  return res.status(result.statusCode).json(result);
}

export async function listMyVenues(req: Request, res: Response) {
  const ownerId = req.user!.profile.id;
  const result = await listMyVenuesService(ownerId);
  return res.status(result.statusCode).json(result);
}

export async function listPublicVenues(_req: Request, res: Response) {
  const result = await listPublicVenuesService();
  return res.status(result.statusCode).json(result);
}
