import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { requireRole } from "../middlewares/require-role.middleware.js";
import {
  approveOwner,
  getOwners,
  getPendingOwners,
  getUsers,
  rejectOwner,
} from "../controllers/admin.controller.js";

const router = Router();

router.use(authMiddleware);
router.use(requireRole(["ADMIN"]));

router.get("/owners/pending", getPendingOwners);
router.get("/owners", getOwners);
router.get("/users", getUsers);
router.patch("/owners/:ownerId/approve", approveOwner);
router.patch("/owners/:ownerId/reject", rejectOwner);
export default router;
