"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const stripe_1 = require("../../controllers/stripe");
const express_1 = require("express");
const router = (0, express_1.Router)();
router.post("/create-payment", stripe_1.create_payment);
router.post("/account-link", stripe_1.account_link);
router.get("/history", stripe_1.history);
exports.default = router;
