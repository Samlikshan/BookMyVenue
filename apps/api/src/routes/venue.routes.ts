import { Router } from "express";
import {
  createVenue,
  deleteVenue,
  getVenue,
  updateVenue,
} from "../controllers/venue.controller.js";
import {
  confirmImageUpload,
  confirmVideoUpload,
  createImageUploadUrl,
  createVideoUploadUrl,
  deleteImage,
  deleteVideo,
  setPrimaryImage,
} from "../controllers/venue-media.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { requireRole } from "../middlewares/require-role.middleware.js";

const router = Router();

router.use(authMiddleware);
router.use(requireRole(["OWNER"]));

router.post("/", createVenue);
router.get("/:venueId", getVenue);
router.patch("/:venueId", updateVenue);
router.delete("/:venueId", deleteVenue);

router.post("/:venueId/images/upload-url", createImageUploadUrl);
router.post("/:venueId/images/confirm", confirmImageUpload);
router.patch("/:venueId/images/:imageId/primary", setPrimaryImage);
router.delete("/:venueId/images/:imageId", deleteImage);

router.post("/:venueId/videos/upload-url", createVideoUploadUrl);
router.post("/:venueId/videos/confirm", confirmVideoUpload);
router.delete("/:venueId/videos/:videoId", deleteVideo);

export default router;
