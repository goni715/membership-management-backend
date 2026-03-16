import {
  privacy_policy,
  terms,
  update_privacy_policy,
  update_terms,
} from "@controllers/legal";
import { Router } from "express";

const router = Router();

// Privacy Policy
router.get("/privacy-policy", privacy_policy);
router.put("/privacy-policy", update_privacy_policy);

// Terms & Conditions
router.get("/terms", terms);
router.put("/terms", update_terms);

export default router;
