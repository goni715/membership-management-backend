"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorize = authorize;
const jsonwebtoken_1 = require("jsonwebtoken");
const dotenv_1 = require("dotenv");
(0, dotenv_1.config)();
const ENV = process.env.NODE_ENV;
function authorize(allowedRoles) {
    return (req, res, next) => {
        var _a;
        const jwt = (_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.split(" ")[1];
        if (!jwt) {
            // if (ENV === "development") {
            //   req.user = {
            //     id: "666666666666666666666666",
            //     email: "test@test.com",
            //     role: "admin",
            //   };
            //   next();
            //   return;
            // }
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        const secret = process.env.ACCESS_TOKEN_SECRET;
        if (!secret) {
            res.status(500).json({ message: "Internal Server Error" });
            return;
        }
        (0, jsonwebtoken_1.verify)(jwt, secret, (err, decoded) => {
            if (err || !decoded) {
                res.status(401).json({ message: "Unauthorized" });
                return;
            }
            const user = decoded;
            req.user = { id: user.userId, email: user.email, role: user.role };
            // If roles are specified, check if the user has the required role
            if ((allowedRoles === null || allowedRoles === void 0 ? void 0 : allowedRoles.length) &&
                (!user.role || !allowedRoles.includes(user.role))) {
                res
                    .status(403)
                    .json({ message: "Forbidden: Insufficient permissions" });
                return;
            }
            next();
        });
    };
}
