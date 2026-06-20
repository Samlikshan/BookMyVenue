import type { Request, Response } from "express";
import {
  applyVenueSlotTemplatesService,
  createCustomVenueDateSlotService,
  deleteVenueDateSlotService,
  listVenueDateSlotsService,
  updateVenueDateSlotService,
} from "../services/venue-date-slot.service.js";
import { paramString } from "../utils/params.util.js";
import {
  applyVenueSlotTemplatesSchema,
  createCustomVenueDateSlotSchema,
  listVenueDateSlotsQuerySchema,
  updateVenueDateSlotSchema,
} from "../validations/venue-availability.validation.js";

export async function listVenueDateSlots(req: Request, res: Response) {
  const parsed = listVenueDateSlotsQuerySchema.safeParse(req.query);

  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: parsed.error.flatten().fieldErrors,
    });
  }

  const ownerId = req.user!.profile.id;
  const venueId = paramString(req.params.venueId, "venueId");
  const result = await listVenueDateSlotsService(ownerId, venueId, parsed.data);
  return res.status(result.statusCode).json(result);
}

export async function applyVenueSlotTemplates(req: Request, res: Response) {
  const parsed = applyVenueSlotTemplatesSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: parsed.error.flatten().fieldErrors,
    });
  }

  const ownerId = req.user!.profile.id;
  const venueId = paramString(req.params.venueId, "venueId");
  const result = await applyVenueSlotTemplatesService(
    ownerId,
    venueId,
    parsed.data
  );
  return res.status(result.statusCode).json(result);
}

export async function createCustomVenueDateSlot(req: Request, res: Response) {
  const parsed = createCustomVenueDateSlotSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: parsed.error.flatten().fieldErrors,
    });
  }

  const ownerId = req.user!.profile.id;
  const venueId = paramString(req.params.venueId, "venueId");
  const result = await createCustomVenueDateSlotService(
    ownerId,
    venueId,
    parsed.data
  );
  return res.status(result.statusCode).json(result);
}

export async function updateVenueDateSlot(req: Request, res: Response) {
  const parsed = updateVenueDateSlotSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: parsed.error.flatten().fieldErrors,
    });
  }

  const ownerId = req.user!.profile.id;
  const venueId = paramString(req.params.venueId, "venueId");
  const dateSlotId = paramString(req.params.dateSlotId, "dateSlotId");
  const result = await updateVenueDateSlotService(
    ownerId,
    venueId,
    dateSlotId,
    parsed.data
  );
  return res.status(result.statusCode).json(result);
}

export async function deleteVenueDateSlot(req: Request, res: Response) {
  const ownerId = req.user!.profile.id;
  const venueId = paramString(req.params.venueId, "venueId");
  const dateSlotId = paramString(req.params.dateSlotId, "dateSlotId");
  const result = await deleteVenueDateSlotService(ownerId, venueId, dateSlotId);
  return res.status(result.statusCode).json(result);
}
