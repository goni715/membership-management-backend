"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const tools_1 = require("../../controllers/tools");
const auth_1 = require("../../middleware/auth");
const router = (0, express_1.Router)();
// Tools
router.get("/", (0, auth_1.authorize)(["user"]), tools_1.tools);
router.get("/access-file/:id", tools_1.access_file);
exports.default = router;
