"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const user_1 = require("../../controllers/user");
const express_1 = require("express");
const router = (0, express_1.Router)();
router.get("/", user_1.users);
router.post("/toggle-ban", user_1.toggle_ban);
exports.default = router;
