import type { Request, Response } from "express";
import {
  createVenueSlotTemplateService,
  deleteVenueSlotTemplateService,
  listVenueSlotTemplatesService,
  updateVenueSlotTemplateService,
} from "../services/venue-slot-template.service.js";
import { paramString } from "../utils/params.util.js";
import {
  createVenueSlotTemplateSchema,
  updateVenueSlotTemplateSchema,
} from "../validations/venue-availability.validation.js";

export async function listVenueSlotTemplates(req: Request, res: Response) {
  const ownerId = req.user!.profile.id;
  const venueId = paramString(req.params.venueId, "venueId");
  const result = await listVenueSlotTemplatesService(ownerId, venueId);
  return res.status(result.statusCode).json(result);
}

export async function createVenueSlotTemplate(req: Request, res: Response) {
  const parsed = createVenueSlotTemplateSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: parsed.error.flatten().fieldErrors,
    });
  }

  const ownerId = req.user!.profile.id;
  const venueId = paramString(req.params.venueId, "venueId");
  const result = await createVenueSlotTemplateService(
    ownerId,
    venueId,
    parsed.data
  );
  return res.status(result.statusCode).json(result);
}

export async function updateVenueSlotTemplate(req: Request, res: Response) {
  const parsed = updateVenueSlotTemplateSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: parsed.error.flatten().fieldErrors,
    });
  }

  const ownerId = req.user!.profile.id;
  const venueId = paramString(req.params.venueId, "venueId");
  const slotTemplateId = paramString(
    req.params.slotTemplateId,
    "slotTemplateId"
  );
  const result = await updateVenueSlotTemplateService(
    ownerId,
    venueId,
    slotTemplateId,
    parsed.data
  );
  return res.status(result.statusCode).json(result);
}

export async function deleteVenueSlotTemplate(req: Request, res: Response) {
  const ownerId = req.user!.profile.id;
  const venueId = paramString(req.params.venueId, "venueId");
  const slotTemplateId = paramString(
    req.params.slotTemplateId,
    "slotTemplateId"
  );
  const result = await deleteVenueSlotTemplateService(
    ownerId,
    venueId,
    slotTemplateId
  );
  return res.status(result.statusCode).json(result);
}
