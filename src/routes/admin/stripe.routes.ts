import { transfer_funds } from "@controllers/stripe";
import { Router } from "express";

const router = Router();

router.post("/transfer-funds", transfer_funds);

export default router;
