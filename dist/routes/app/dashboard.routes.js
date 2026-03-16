"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const dashboard_1 = require("../../controllers/dashboard");
const express_1 = require("express");
const router = (0, express_1.Router)();
router.get("/", dashboard_1.overview);
router.get("/referral-history", dashboard_1.referral_history);
exports.default = router;
