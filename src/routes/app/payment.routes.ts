import {
  balance,
  request_withdrawal,
  withdraw_history,
} from "@controllers/payment";
import { Router } from "express";

const router = Router();

router.get("/balance", balance);
router.post("/request-withdrawal", request_withdrawal);
router.get("/withdraw-history", withdraw_history);

export default router;
