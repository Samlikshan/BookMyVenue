import { Router } from "express";
import {
  approveVenue,
  rejectVenue,
} from "../controllers/admin-venue.controller.js";
import { requireRole } from "../middlewares/require-role.middleware.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(authMiddleware);
router.use(requireRole(["ADMIN"]));

router.patch("/:venueId/approve", approveVenue);
router.patch("/:venueId/reject", rejectVenue);

export default router;
