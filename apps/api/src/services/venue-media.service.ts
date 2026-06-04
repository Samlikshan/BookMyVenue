import { randomUUID } from "node:crypto";
import path from "node:path";
import { prisma } from "../config/prisma.js";
import { supabaseAdmin } from "../config/supabase.js";
import { isVenueEditable } from "../utils/venue.util.js";
import type { ConfirmUploadInput } from "../validations/venue-media.validation.js";

const IMAGE_BUCKET = "venue-images";
const VIDEO_BUCKET = "venue-videos";
const MAX_IMAGES = 10;
const MAX_VIDEOS = 3;

type ServiceResult = {
  success: boolean;
  statusCode: number;
  message: string;
  data?: unknown;
  errors?: unknown;
};

async function getEditableVenue(venueId: string) {
  const venue = await prisma.venue.findFirst({
    where: { id: venueId, deletedAt: null },
  });

  if (!venue) {
    return { error: { success: false, statusCode: 404, message: "Venue not found" } };
  }

  if (!isVenueEditable(venue.status)) {
    return {
      error: {
        success: false,
        statusCode: 409,
        message: `Media cannot be changed while venue status is ${venue.status}`,
      },
    };
  }

  return { venue };
}

function extensionFromFileName(fileName: string, contentType: string): string {
  const ext = path.extname(fileName).toLowerCase().replace(".", "");
  if (ext) return ext;

  const map: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "video/mp4": "mp4",
  };

  return map[contentType] ?? "bin";
}

function buildStoragePath(
  venueId: string,
  kind: "images" | "videos",
  fileName: string,
  contentType: string
): string {
  const ext = extensionFromFileName(fileName, contentType);
  return `venues/${venueId}/${kind}/${randomUUID()}.${ext}`;
}

function getPublicUrl(bucket: string, storagePath: string): string {
  const { data } = supabaseAdmin.storage.from(bucket).getPublicUrl(storagePath);
  return data.publicUrl;
}

async function storageObjectExists(
  bucket: string,
  storagePath: string
): Promise<boolean> {
  const parts = storagePath.split("/");
  const fileName = parts.pop();
  const folder = parts.join("/");

  if (!fileName) return false;

  const { data, error } = await supabaseAdmin.storage
    .from(bucket)
    .list(folder, { search: fileName, limit: 100 });

  if (error) return false;

  return data.some((item) => item.name === fileName);
}

export async function createImageUploadUrlService(
  venueId: string,
  fileName: string,
  contentType: string
): Promise<ServiceResult> {
  const check = await getEditableVenue(venueId);
  if (check.error) return check.error;

  const imageCount = await prisma.venueImage.count({ where: { venueId } });
  if (imageCount >= MAX_IMAGES) {
    return {
      success: false,
      statusCode: 400,
      message: `Maximum ${MAX_IMAGES} images allowed per venue`,
    };
  }

  const storagePath = buildStoragePath(venueId, "images", fileName, contentType);

  const { data, error } = await supabaseAdmin.storage
    .from(IMAGE_BUCKET)
    .createSignedUploadUrl(storagePath);

  if (error || !data) {
    return {
      success: false,
      statusCode: 500,
      message: error?.message ?? "Failed to create upload URL",
    };
  }

  return {
    success: true,
    statusCode: 200,
    message: "Upload URL created",
    data: {
      uploadUrl: data.signedUrl,
      storagePath,
      token: data.token,
      bucket: IMAGE_BUCKET,
    },
  };
}

export async function confirmImageUploadService(
  venueId: string,
  input: ConfirmUploadInput
): Promise<ServiceResult> {
  const check = await getEditableVenue(venueId);
  if (check.error) return check.error;

  const { storagePath } = input;

  if (!storagePath.startsWith(`venues/${venueId}/images/`)) {
    return {
      success: false,
      statusCode: 400,
      message: "Invalid storage path for this venue",
    };
  }

  const exists = await storageObjectExists(IMAGE_BUCKET, storagePath);
  if (!exists) {
    return {
      success: false,
      statusCode: 400,
      message: "File not found in storage. Upload the file before confirming.",
    };
  }

  const imageUrl = getPublicUrl(IMAGE_BUCKET, storagePath);
  const existingCount = await prisma.venueImage.count({ where: { venueId } });
  const isPrimary = existingCount === 0;

  const image = await prisma.venueImage.create({
    data: {
      venueId,
      imageUrl,
      storagePath,
      isPrimary,
    },
  });

  return {
    success: true,
    statusCode: 201,
    message: "Image confirmed successfully",
    data: { image },
  };
}

export async function setPrimaryImageService(
  venueId: string,
  imageId: string
): Promise<ServiceResult> {
  const check = await getEditableVenue(venueId);
  if (check.error) return check.error;

  const image = await prisma.venueImage.findFirst({
    where: { id: imageId, venueId },
  });

  if (!image) {
    return { success: false, statusCode: 404, message: "Image not found" };
  }

  await prisma.$transaction([
    prisma.venueImage.updateMany({
      where: { venueId },
      data: { isPrimary: false },
    }),
    prisma.venueImage.update({
      where: { id: imageId },
      data: { isPrimary: true },
    }),
  ]);

  const images = await prisma.venueImage.findMany({
    where: { venueId },
    orderBy: { createdAt: "asc" },
  });

  return {
    success: true,
    statusCode: 200,
    message: "Primary image updated",
    data: { images },
  };
}

export async function deleteImageService(
  venueId: string,
  imageId: string
): Promise<ServiceResult> {
  const check = await getEditableVenue(venueId);
  if (check.error) return check.error;

  const image = await prisma.venueImage.findFirst({
    where: { id: imageId, venueId },
  });

  if (!image) {
    return { success: false, statusCode: 404, message: "Image not found" };
  }

  if (image.storagePath) {
    const { error } = await supabaseAdmin.storage
      .from(IMAGE_BUCKET)
      .remove([image.storagePath]);

    if (error) {
      return {
        success: false,
        statusCode: 500,
        message: `Failed to delete file from storage: ${error.message}`,
      };
    }
  }

  await prisma.venueImage.delete({ where: { id: imageId } });

  if (image.isPrimary) {
    const next = await prisma.venueImage.findFirst({
      where: { venueId },
      orderBy: { createdAt: "asc" },
    });
    if (next) {
      await prisma.venueImage.update({
        where: { id: next.id },
        data: { isPrimary: true },
      });
    }
  }

  return {
    success: true,
    statusCode: 200,
    message: "Image deleted successfully",
  };
}

export async function createVideoUploadUrlService(
  venueId: string,
  fileName: string,
  contentType: string
): Promise<ServiceResult> {
  const check = await getEditableVenue(venueId);
  if (check.error) return check.error;

  const videoCount = await prisma.venueVideo.count({ where: { venueId } });
  if (videoCount >= MAX_VIDEOS) {
    return {
      success: false,
      statusCode: 400,
      message: `Maximum ${MAX_VIDEOS} videos allowed per venue`,
    };
  }

  const storagePath = buildStoragePath(venueId, "videos", fileName, contentType);

  const { data, error } = await supabaseAdmin.storage
    .from(VIDEO_BUCKET)
    .createSignedUploadUrl(storagePath);

  if (error || !data) {
    return {
      success: false,
      statusCode: 500,
      message: error?.message ?? "Failed to create upload URL",
    };
  }

  return {
    success: true,
    statusCode: 200,
    message: "Upload URL created",
    data: {
      uploadUrl: data.signedUrl,
      storagePath,
      token: data.token,
      bucket: VIDEO_BUCKET,
    },
  };
}

export async function confirmVideoUploadService(
  venueId: string,
  input: ConfirmUploadInput
): Promise<ServiceResult> {
  const check = await getEditableVenue(venueId);
  if (check.error) return check.error;

  const { storagePath } = input;

  if (!storagePath.startsWith(`venues/${venueId}/videos/`)) {
    return {
      success: false,
      statusCode: 400,
      message: "Invalid storage path for this venue",
    };
  }

  const exists = await storageObjectExists(VIDEO_BUCKET, storagePath);
  if (!exists) {
    return {
      success: false,
      statusCode: 400,
      message: "File not found in storage. Upload the file before confirming.",
    };
  }

  const videoUrl = getPublicUrl(VIDEO_BUCKET, storagePath);

  const video = await prisma.venueVideo.create({
    data: {
      venueId,
      videoUrl,
      storagePath,
    },
  });

  return {
    success: true,
    statusCode: 201,
    message: "Video confirmed successfully",
    data: { video },
  };
}

export async function deleteVideoService(
  venueId: string,
  videoId: string
): Promise<ServiceResult> {
  const check = await getEditableVenue(venueId);
  if (check.error) return check.error;

  const video = await prisma.venueVideo.findFirst({
    where: { id: videoId, venueId },
  });

  if (!video) {
    return { success: false, statusCode: 404, message: "Video not found" };
  }

  if (video.storagePath) {
    const { error } = await supabaseAdmin.storage
      .from(VIDEO_BUCKET)
      .remove([video.storagePath]);

    if (error) {
      return {
        success: false,
        statusCode: 500,
        message: `Failed to delete file from storage: ${error.message}`,
      };
    }
  }

  await prisma.venueVideo.delete({ where: { id: videoId } });

  return {
    success: true,
    statusCode: 200,
    message: "Video deleted successfully",
  };
}
