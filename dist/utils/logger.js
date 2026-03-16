"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chalk_1 = __importDefault(require("chalk")); // For colored output
const prettyjson_1 = __importDefault(require("prettyjson")); // For formatting JSON logs nicely
const logger = (req, res, next) => {
    const start = process.hrtime(); // Start time tracking
    const method = req.method;
    const url = req.originalUrl;
    const ip = req.ip || req.socket.remoteAddress;
    const userAgent = req.get("User-Agent") || "Unknown";
    // Process body only for relevant methods
    let body = null;
    if (["POST", "PUT", "PATCH"].includes(method) && Object.keys(req.body).length > 0) {
        body = prettyjson_1.default.render(req.body, {
            keysColor: 'cyan',
            stringColor: 'yellow',
            numberColor: 'magenta',
        });
    }
    // Log the request details
    console.log(chalk_1.default.blue(`[${new Date().toISOString()}]`), chalk_1.default.green(`[${method}]`), chalk_1.default.cyan(url), chalk_1.default.yellow(`IP: ${ip}`), chalk_1.default.magenta(`User-Agent: ${userAgent}`));
    if (body) {
        console.log(chalk_1.default.gray("Body:"));
        console.log(body);
    }
    // Capture response time
    res.on("finish", () => {
        const [seconds, nanoseconds] = process.hrtime(start);
        const duration = (seconds * 1000 + nanoseconds / 1e6).toFixed(2); // Convert to ms
        console.log(chalk_1.default.blue(`[${new Date().toISOString()}]`), chalk_1.default.green(`[${method}]`), chalk_1.default.cyan(url), chalk_1.default.yellow(`Status: ${res.statusCode}`), chalk_1.default.red(`Duration: ${duration}ms`));
    });
    next();
};
exports.default = logger;
