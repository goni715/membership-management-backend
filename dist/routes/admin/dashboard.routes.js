"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const dashboard_1 = require("../../controllers/dashboard");
const express_1 = require("express");
const router = (0, express_1.Router)();
router.get("/", dashboard_1.admin_overview);
router.get("/referral-overview", dashboard_1.referral_overview);
router.get("/notification_count", dashboard_1.notification_count);
exports.default = router;
