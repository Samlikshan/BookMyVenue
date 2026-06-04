import { Router } from "express";
import {
  createEventType,
  listEventTypes,
} from "../controllers/catalog.controller.js";

const router = Router();

router.get("/event-types", listEventTypes);
router.post("/event-types", createEventType);

export default router;
