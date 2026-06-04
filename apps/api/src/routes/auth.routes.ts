import { Router } from "express";
import { getMe, login, registerOwner, registerUser } from "../controllers/auth.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { requireRole } from "../middlewares/require-role.middleware.js";

const router = Router();

router.post("/register-user", registerUser);
router.post("/register-owner", registerOwner);
router.post("/login", login);
router.get("/me", authMiddleware,requireRole(["ADMIN", "OWNER", "USER"]), getMe);

export default router;