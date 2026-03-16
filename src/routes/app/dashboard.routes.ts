import { overview, referral_history } from "@controllers/dashboard";
import { Router } from "express";

const router = Router();

router.get("/", overview);
router.get("/referral-history", referral_history);

export default router;
