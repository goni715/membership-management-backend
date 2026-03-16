import { notifications } from "@controllers/notifications";
import { Router } from "express";

const router = Router();

router.get("/", notifications);

export default router;
