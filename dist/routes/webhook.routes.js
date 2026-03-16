"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const stripe_1 = require("../controllers/stripe");
const express_1 = require("express");
const express_2 = __importDefault(require("express"));
const router = (0, express_1.Router)();
router.post("/stripe", express_2.default.raw({ type: "application/json" }), stripe_1.stripe_webhook);
exports.default = router;
