"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const legal_1 = require("../../controllers/legal");
const express_1 = require("express");
const router = (0, express_1.Router)();
// Privacy Policy
router.get("/privacy-policy", legal_1.privacy_policy);
router.put("/privacy-policy", legal_1.update_privacy_policy);
// Terms & Conditions
router.get("/terms", legal_1.terms);
router.put("/terms", legal_1.update_terms);
exports.default = router;
