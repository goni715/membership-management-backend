import { Router } from "express";
import { access_file, tools } from "@controllers/tools";
import { authorize } from "@middleware/auth";

const router = Router();

// Tools
router.get("/", authorize(["user"]), tools);
router.get("/access-file/:id", access_file);

export default router;
