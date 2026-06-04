import type { Request, Response } from "express";
import { approveOwnerService, getPendingOwnersService, rejectOwnerService } from "../services/admin.service.js";

export async function getPendingOwners(_req: Request, res: Response) {
  const result = await getPendingOwnersService();

  return res.status(result.statusCode).json(result);
}

export async function approveOwner(req: Request, res: Response) {
  const { ownerId } = req.params;
  
  if (!ownerId || Array.isArray(ownerId)) {
    return res.status(400).json({
      success: false,
      message: "Owner id is required",
    });
  }

  const adminId = req.user!.profile.id;

  const result = await approveOwnerService(ownerId, adminId);

  return res.status(result.statusCode).json(result);
}

export async function rejectOwner(req: Request, res: Response) {
  const { ownerId } = req.params;

  if (!ownerId || Array.isArray(ownerId)) {
    return res.status(400).json({
      success: false,
      message: "Owner id is required",
    });
  }

  const adminId = req.user!.profile.id;
  const rejectionReason =
    typeof req.body?.rejectionReason === "string"
      ? req.body.rejectionReason
      : undefined;

  const result = await rejectOwnerService(
    ownerId,
    adminId,
    rejectionReason
  );

  return res.status(result.statusCode).json(result);
}