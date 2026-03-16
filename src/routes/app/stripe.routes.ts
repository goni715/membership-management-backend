import { account_link, create_payment, history } from "@controllers/stripe";
import { Router } from "express";

const router = Router();

router.post("/create-payment", create_payment);
router.post("/account-link", account_link);
router.get("/history", history);

export default router;
