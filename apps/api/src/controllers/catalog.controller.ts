import type { Request, Response } from "express";
import {
  createEventTypeService,
  listEventTypesService,
} from "../services/catalog.service.js";
import { createEventTypeSchema } from "../validations/catalog.validation.js";

export async function listEventTypes(_req: Request, res: Response) {
  const result = await listEventTypesService();
  return res.status(result.statusCode).json(result);
}

export async function createEventType(req: Request, res: Response) {
  const parsed = createEventTypeSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: parsed.error.flatten().fieldErrors,
    });
  }

  const result = await createEventTypeService(parsed.data);
  return res.status(result.statusCode).json(result);
}
