import { Router } from "express";
import multer from "multer";
import {
  add_category,
  all_tools,
  delete_category,
  delete_tool,
  get_categories,
  update_category,
  update_tool,
  upload,
} from "@controllers/tools";

const router = Router();
const multerUpload = multer({ dest: "uploads/" });

const uploadFields = multerUpload.fields([
  { name: "video", maxCount: 1 },
  { name: "file", maxCount: 1 },
]);

// Tool Management
router.get("/all", all_tools);
router.post("/upload", uploadFields, upload);
router.put("/update_tool", uploadFields, update_tool);
router.delete("/delete_tool", delete_tool);

// Tool Categories
router.get("/", get_categories);
router.post("/add_category", multerUpload.single("icon"), add_category);
router.put("/update_category", multerUpload.single("icon"), update_category);
router.delete("/delete_category", delete_category);

export default router;
