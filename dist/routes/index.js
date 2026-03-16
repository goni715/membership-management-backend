"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerAdminRoutes = exports.registerUserRoutes = exports.registerRoutesThatNeedsRawBody = void 0;
const webhook_routes_1 = __importDefault(require("./webhook.routes"));
const userRoutes = __importStar(require("./app"));
const adminRoutes = __importStar(require("./admin"));
const auth_1 = require("../middleware/auth");
const registerUserRoutes = (app) => {
    app.use("/auth", userRoutes.authRoutes);
    app.use("/tools", userRoutes.toolsRoutes);
    app.use("/profile", (0, auth_1.authorize)(["user", "admin"]), userRoutes.profileRoutes);
    app.use("/notifications", (0, auth_1.authorize)(["user"]), userRoutes.notificationsRoutes);
    app.use("/stripe", (0, auth_1.authorize)(["user"]), userRoutes.stripeRoutes);
    app.use("/dashboard", (0, auth_1.authorize)(["user"]), userRoutes.dashboardRoutes);
    app.use("/payment", (0, auth_1.authorize)(["user"]), userRoutes.paymentRoutes);
    app.use("/legal", (0, auth_1.authorize)(["user"]), userRoutes.legalRoutes);
};
exports.registerUserRoutes = registerUserRoutes;
const registerAdminRoutes = (app) => {
    app.use("/admin/tools", (0, auth_1.authorize)(["admin"]), adminRoutes.toolsRoutes);
    app.use("/admin/notifications", (0, auth_1.authorize)(["admin"]), adminRoutes.notificationsRoutes);
    app.use("/admin/users", (0, auth_1.authorize)(["admin"]), adminRoutes.userRoutes);
    app.use("/admin/referrals", (0, auth_1.authorize)(["admin"]), adminRoutes.referralRoutes);
    app.use("/admin/stripe", (0, auth_1.authorize)(["admin"]), adminRoutes.stripeRoutes);
    app.use("/admin/dashboard", (0, auth_1.authorize)(["admin"]), adminRoutes.dashboardRoutes);
    app.use("/admin/payment", (0, auth_1.authorize)(["admin"]), adminRoutes.paymentRoutes);
    app.use("/admin/legal", (0, auth_1.authorize)(["admin"]), adminRoutes.legalRoutes);
};
exports.registerAdminRoutes = registerAdminRoutes;
const registerRoutesThatNeedsRawBody = (app) => {
    app.use("/webhook", webhook_routes_1.default);
};
exports.registerRoutesThatNeedsRawBody = registerRoutesThatNeedsRawBody;
