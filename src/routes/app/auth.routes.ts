import { Router } from "express";
import {
  forgot_password,
  refresh_token,
  resend,
  signin,
  signup,
  update_password,
  validate_otp,
} from "@controllers/auth";

const router = Router();

router.post("/sign-up", signup);
router.post("/resend", resend);
router.post("/validate-otp", validate_otp);
router.post("/forgot-password", forgot_password);
router.post("/update-password", update_password);
router.post("/sign-in", signin);
router.post("/refresh-token", refresh_token);

export default router;
