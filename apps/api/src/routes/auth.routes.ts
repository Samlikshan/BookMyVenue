import { Router } from "express";
import { registerOwner } from "../controllers/auth.controller.js";

const router = Router();

router.post("/register-owner", registerOwner);

export default router;