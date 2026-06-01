import type { Request, Response } from "express";
import {
  loginService,
  registerUserService,
  registerOwnerService,
} from "../services/auth.service.js";
import {
  loginSchema,
  registerUserSchema,
  registerOwnerSchema,
} from "../validations/auth.validation.js";

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

export async function login(req: Request, res: Response) {
  const parsed = loginSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: parsed.error.flatten().fieldErrors,
    });
  }

  const result = await loginService(parsed.data);

  return res.status(result.statusCode).json(result);
}

export async function registerUser(req: Request, res: Response) {
  const parsed = registerUserSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: parsed.error.flatten().fieldErrors,
    });
  }

  const result = await registerUserService(parsed.data);

  return res.status(result.statusCode).json(result);
}
