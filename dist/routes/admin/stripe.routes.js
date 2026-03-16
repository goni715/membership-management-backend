"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const stripe_1 = require("../../controllers/stripe");
const express_1 = require("express");
const router = (0, express_1.Router)();
router.post("/transfer-funds", stripe_1.transfer_funds);
exports.default = router;
