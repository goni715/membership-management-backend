import { toggle_ban, users } from "@controllers/user";
import { Router } from "express";

const router = Router();

router.get("/", users);
router.post("/toggle-ban", toggle_ban);

export default router;
