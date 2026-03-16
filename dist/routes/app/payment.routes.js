"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const payment_1 = require("../../controllers/payment");
const express_1 = require("express");
const router = (0, express_1.Router)();
router.get("/balance", payment_1.balance);
router.post("/request-withdrawal", payment_1.request_withdrawal);
router.get("/withdraw-history", payment_1.withdraw_history);
exports.default = router;
