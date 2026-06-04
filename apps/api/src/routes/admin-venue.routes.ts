import { Router } from "express";
import {
  approveVenue,
  rejectVenue,
} from "../controllers/admin-venue.controller.js";

const router = Router();

router.patch("/:venueId/approve", approveVenue);
router.patch("/:venueId/reject", rejectVenue);

export default router;
