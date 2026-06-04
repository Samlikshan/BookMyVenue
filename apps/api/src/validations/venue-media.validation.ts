import { z } from "zod";

const imageMimeTypes = ["image/jpeg", "image/png", "image/webp"] as const;
const videoMimeTypes = ["video/mp4"] as const;

export const uploadUrlSchema = z.object({
  fileName: z.string().min(1, "fileName is required"),
  contentType: z.string().min(1, "contentType is required"),
});

export const imageUploadUrlSchema = uploadUrlSchema.extend({
  contentType: z.enum(imageMimeTypes, {
    message: "Allowed types: image/jpeg, image/png, image/webp",
  }),
});

export const videoUploadUrlSchema = uploadUrlSchema.extend({
  contentType: z.enum(videoMimeTypes, {
    message: "Allowed type: video/mp4",
  }),
});

export const confirmUploadSchema = z.object({
  storagePath: z.string().min(1, "storagePath is required"),
});

export type ImageUploadUrlInput = z.infer<typeof imageUploadUrlSchema>;
export type VideoUploadUrlInput = z.infer<typeof videoUploadUrlSchema>;
export type ConfirmUploadInput = z.infer<typeof confirmUploadSchema>;
