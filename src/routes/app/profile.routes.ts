import { Router } from "express";
import multer from "multer";
import {
  change_password,
  delete_account,
  profile,
  update_profile,
} from "@controllers/profile";

const router = Router();
const multerUpload = multer({ dest: "uploads/" });

router.get("/", profile);
router.put("/update", multerUpload.single("photo"), update_profile);
router.delete("/delete", delete_account);
router.post("/change-password", change_password);

export default router;
