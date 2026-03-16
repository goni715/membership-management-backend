import {
  referral_commissions,
  update_referral_commissions,
} from "@controllers/referral";
import { Router } from "express";

const router = Router();

router.get("/", referral_commissions);
router.put("/", update_referral_commissions);

export default router;
