import { admin_overview, notification_count, referral_overview } from "@controllers/dashboard";
import { Router } from "express";

const router = Router();

router.get("/", admin_overview);
router.get("/referral-overview", referral_overview);
router.get("/notification_count", notification_count);

export default router;
