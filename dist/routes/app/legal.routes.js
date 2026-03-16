"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const legal_1 = require("../../controllers/legal");
const express_1 = require("express");
const router = (0, express_1.Router)();
router.get("/privacy-policy", legal_1.privacy_policy);
router.get("/terms", legal_1.terms);
exports.default = router;
