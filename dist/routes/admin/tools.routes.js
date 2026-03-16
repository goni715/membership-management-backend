"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const tools_1 = require("../../controllers/tools");
const router = (0, express_1.Router)();
const multerUpload = (0, multer_1.default)({ dest: "uploads/" });
const uploadFields = multerUpload.fields([
    { name: "video", maxCount: 1 },
    { name: "file", maxCount: 1 },
]);
// Tool Management
router.get("/all", tools_1.all_tools);
router.post("/upload", uploadFields, tools_1.upload);
router.put("/update_tool", uploadFields, tools_1.update_tool);
router.delete("/delete_tool", tools_1.delete_tool);
// Tool Categories
router.get("/", tools_1.get_categories);
router.post("/add_category", multerUpload.single("icon"), tools_1.add_category);
router.put("/update_category", multerUpload.single("icon"), tools_1.update_category);
router.delete("/delete_category", tools_1.delete_category);
exports.default = router;
