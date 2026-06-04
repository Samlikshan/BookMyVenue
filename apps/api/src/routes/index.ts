import { Router } from "express";
import adminRoutes from "./admin.routes.js";
import authRoutes from "./auth.routes.js";
import catalogRoutes from "./catalog.routes.js";
import venueRoutes from "./venue.routes.js";
import adminVenueRoutes from "./admin-venue.routes.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/catalog", catalogRoutes);
router.use("/venues", venueRoutes);
router.use("/admin/venues", adminVenueRoutes);
router.use("/admin", adminRoutes);

export default router;