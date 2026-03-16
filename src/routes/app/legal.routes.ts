import { privacy_policy, terms } from "@controllers/legal";
import { Router } from "express";

const router = Router();

router.get("/privacy-policy", privacy_policy);
router.get("/terms", terms);

export default router;
