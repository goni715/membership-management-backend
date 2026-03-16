"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const notifications_1 = require("../../controllers/notifications");
const express_1 = require("express");
const router = (0, express_1.Router)();
router.get("/", notifications_1.notifications);
exports.default = router;
