import { Router } from "express";
import { login, registerOwner, registerUser } from "../controllers/auth.controller.js";

const router = Router();

router.post("/register-user", registerUser);
router.post("/register-owner", registerOwner);
router.post("/login", login);

export default router;