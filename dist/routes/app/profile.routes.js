"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const profile_1 = require("../../controllers/profile");
const router = (0, express_1.Router)();
const multerUpload = (0, multer_1.default)({ dest: "uploads/" });
router.get("/", profile_1.profile);
router.put("/update", multerUpload.single("photo"), profile_1.update_profile);
router.delete("/delete", profile_1.delete_account);
router.post("/change-password", profile_1.change_password);
exports.default = router;
