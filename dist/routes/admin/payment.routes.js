"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const payment_1 = require("../../controllers/payment");
const express_1 = require("express");
const router = (0, express_1.Router)();
router.get("/withdraw-requests", payment_1.withdraw_requests);
router.post("/update-withdraw-requests", payment_1.update_withdraw_requests);
router.get("/earnings", payment_1.earnings);
exports.default = router;
