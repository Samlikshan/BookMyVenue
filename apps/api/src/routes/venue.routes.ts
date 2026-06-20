import { Router } from "express";
import {
  createVenue,
  deleteVenue,
  getVenue,
  listMyVenues,
  listPublicVenues,
  updateVenue,
} from "../controllers/venue.controller.js";
import {
  createVenueAvailability,
  deleteVenueAvailability,
  listVenueAvailability,
  updateVenueAvailability,
} from "../controllers/venue-availability.controller.js";
import {
  createVenueSlotTemplate,
  deleteVenueSlotTemplate,
  listVenueSlotTemplates,
  updateVenueSlotTemplate,
} from "../controllers/venue-slot-template.controller.js";
import {
  applyVenueSlotTemplates,
  createCustomVenueDateSlot,
  deleteVenueDateSlot,
  listVenueDateSlots,
  updateVenueDateSlot,
} from "../controllers/venue-date-slot.controller.js";
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

router.get("/public", listPublicVenues);

router.use(authMiddleware);
router.use(requireRole(["OWNER"]));

router.post("/", createVenue);
router.get("/", listMyVenues);
router.get("/:venueId", getVenue);
router.patch("/:venueId", updateVenue);
router.delete("/:venueId", deleteVenue);

router.get("/:venueId/availability", listVenueAvailability);
router.post("/:venueId/availability", createVenueAvailability);
router.patch(
  "/:venueId/availability/:availabilityId",
  updateVenueAvailability
);
router.delete(
  "/:venueId/availability/:availabilityId",
  deleteVenueAvailability
);

router.get("/:venueId/slot-templates", listVenueSlotTemplates);
router.post("/:venueId/slot-templates", createVenueSlotTemplate);
router.patch(
  "/:venueId/slot-templates/:slotTemplateId",
  updateVenueSlotTemplate
);
router.delete(
  "/:venueId/slot-templates/:slotTemplateId",
  deleteVenueSlotTemplate
);

router.get("/:venueId/date-slots", listVenueDateSlots);
router.post("/:venueId/date-slots/apply-templates", applyVenueSlotTemplates);
router.post("/:venueId/date-slots/custom", createCustomVenueDateSlot);
router.patch("/:venueId/date-slots/:dateSlotId", updateVenueDateSlot);
router.delete("/:venueId/date-slots/:dateSlotId", deleteVenueDateSlot);

router.post("/:venueId/images/upload-url", createImageUploadUrl);
router.post("/:venueId/images/confirm", confirmImageUpload);
router.patch("/:venueId/images/:imageId/primary", setPrimaryImage);
router.delete("/:venueId/images/:imageId", deleteImage);

router.post("/:venueId/videos/upload-url", createVideoUploadUrl);
router.post("/:venueId/videos/confirm", confirmVideoUpload);
router.delete("/:venueId/videos/:videoId", deleteVideo);

export default router;
