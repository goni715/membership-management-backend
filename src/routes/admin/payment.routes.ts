import {
  earnings,
  update_withdraw_requests,
  withdraw_requests,
} from "@controllers/payment";
import { Router } from "express";

const router = Router();

router.get("/withdraw-requests", withdraw_requests);
router.post("/update-withdraw-requests", update_withdraw_requests);
router.get("/earnings", earnings);

export default router;
