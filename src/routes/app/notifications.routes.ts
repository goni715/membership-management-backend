import {
  mark_all_as_read,
  mark_as_read,
  notifications_by_id,
  notifications_count,
} from "@controllers/notifications";
import { Router } from "express";

const router = Router();

router.get("/", notifications_by_id);
router.get("/count", notifications_count);
router.get("/mark-as-read/:notificationId", mark_as_read);
router.get("/mark-all-as-read", mark_all_as_read);

export default router;
