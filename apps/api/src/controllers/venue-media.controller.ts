import type { Request, Response } from "express";
import { paramString } from "../utils/params.util.js";
import {
  confirmImageUploadService,
  confirmVideoUploadService,
  createImageUploadUrlService,
  createVideoUploadUrlService,
  deleteImageService,
  deleteVideoService,
  setPrimaryImageService,
} from "../services/venue-media.service.js";
import {
  confirmUploadSchema,
  imageUploadUrlSchema,
  videoUploadUrlSchema,
} from "../validations/venue-media.validation.js";

export async function createImageUploadUrl(req: Request, res: Response) {
  const parsed = imageUploadUrlSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: parsed.error.flatten().fieldErrors,
    });
  }

  const venueId = paramString(req.params.venueId, "venueId");
  const result = await createImageUploadUrlService(
    venueId,
    parsed.data.fileName,
    parsed.data.contentType
  );
  return res.status(result.statusCode).json(result);
}

export async function confirmImageUpload(req: Request, res: Response) {
  const parsed = confirmUploadSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: parsed.error.flatten().fieldErrors,
    });
  }

  const venueId = paramString(req.params.venueId, "venueId");
  const result = await confirmImageUploadService(venueId, parsed.data);
  return res.status(result.statusCode).json(result);
}

export async function setPrimaryImage(req: Request, res: Response) {
  const venueId = paramString(req.params.venueId, "venueId");
  const imageId = paramString(req.params.imageId, "imageId");
  const result = await setPrimaryImageService(venueId, imageId);
  return res.status(result.statusCode).json(result);
}

export async function deleteImage(req: Request, res: Response) {
  const venueId = paramString(req.params.venueId, "venueId");
  const imageId = paramString(req.params.imageId, "imageId");
  const result = await deleteImageService(venueId, imageId);
  return res.status(result.statusCode).json(result);
}

export async function createVideoUploadUrl(req: Request, res: Response) {
  const parsed = videoUploadUrlSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: parsed.error.flatten().fieldErrors,
    });
  }

  const venueId = paramString(req.params.venueId, "venueId");
  const result = await createVideoUploadUrlService(
    venueId,
    parsed.data.fileName,
    parsed.data.contentType
  );
  return res.status(result.statusCode).json(result);
}

export async function confirmVideoUpload(req: Request, res: Response) {
  const parsed = confirmUploadSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: parsed.error.flatten().fieldErrors,
    });
  }

  const venueId = paramString(req.params.venueId, "venueId");
  const result = await confirmVideoUploadService(venueId, parsed.data);
  return res.status(result.statusCode).json(result);
}

export async function deleteVideo(req: Request, res: Response) {
  const venueId = paramString(req.params.venueId, "venueId");
  const videoId = paramString(req.params.videoId, "videoId");
  const result = await deleteVideoService(venueId, videoId);
  return res.status(result.statusCode).json(result);
}
