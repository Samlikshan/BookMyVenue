import { Router } from "express";
import {
  createEventType,
  listEventTypes,
} from "../controllers/catalog.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { requireRole } from "../middlewares/require-role.middleware.js";

const router = Router();

router.use(authMiddleware);
router.use(requireRole(["ADMIN"]));

router.get("/event-types", listEventTypes);
router.post("/event-types", createEventType);

export default router;
