import type { Request, Response } from "express";
import { registerOwnerService } from "../services/auth.service.js";
import { registerOwnerSchema } from "../validations/auth.validation.js";

export async function registerOwner(req: Request, res: Response) {
  const parsed = registerOwnerSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: parsed.error.flatten().fieldErrors,
    });
  }

  const result = await registerOwnerService(parsed.data);

  return res.status(result.statusCode).json(result);
}