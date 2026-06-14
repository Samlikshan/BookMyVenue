import { Router } from "express";
import {
  createEventType,
  listEventTypes,
} from "../controllers/catalog.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { requireRole } from "../middlewares/require-role.middleware.js";

const router = Router();

router.use(authMiddleware);

router.get("/event-types", requireRole(["ADMIN", "OWNER", "USER"]), listEventTypes);
router.post("/event-types", requireRole(["ADMIN"]), createEventType);

export default router;
