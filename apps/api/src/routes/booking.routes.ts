import { Router } from "express";
import { cancelBooking, getBooking, initiateBooking, listMyBookings, paymentFailure, paymentSuccess } from "../controllers/booking.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { requireRole } from "../middlewares/require-role.middleware.js";

const router = Router();
router.use(authMiddleware);
router.post("/initiate", requireRole(["USER"]), initiateBooking);
router.get("/my", requireRole(["USER"]), listMyBookings);
router.patch("/:bookingId/payment/success", requireRole(["USER"]), paymentSuccess);
router.patch("/:bookingId/payment/failure", requireRole(["USER"]), paymentFailure);
router.patch("/:bookingId/cancel", requireRole(["USER"]), cancelBooking);
router.get("/:bookingId", requireRole(["USER", "OWNER", "ADMIN"]), getBooking);
export default router;
