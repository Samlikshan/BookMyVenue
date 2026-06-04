import type { Request, Response } from "express";
import {
  approveVenueService,
  rejectVenueService,
} from "../services/admin-venue.service.js";
import { paramString } from "../utils/params.util.js";
import {
  approveVenueSchema,
  rejectVenueSchema,
} from "../validations/venue.validation.js";

export async function approveVenue(req: Request, res: Response) {
  const parsed = approveVenueSchema.safeParse(req.body ?? {});

  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: parsed.error.flatten().fieldErrors,
    });
  }

  const venueId = paramString(req.params.venueId, "venueId");
  const result = await approveVenueService(venueId, parsed.data);
  return res.status(result.statusCode).json(result);
}

export async function rejectVenue(req: Request, res: Response) {
  const parsed = rejectVenueSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: parsed.error.flatten().fieldErrors,
    });
  }

  const venueId = paramString(req.params.venueId, "venueId");
  const result = await rejectVenueService(venueId, parsed.data);
  return res.status(result.statusCode).json(result);
}
