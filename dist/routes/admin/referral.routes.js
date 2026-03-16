"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const referral_1 = require("../../controllers/referral");
const express_1 = require("express");
const router = (0, express_1.Router)();
router.get("/", referral_1.referral_commissions);
router.put("/", referral_1.update_referral_commissions);
exports.default = router;
