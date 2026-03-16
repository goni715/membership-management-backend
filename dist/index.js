"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.io = void 0;
require("dotenv").config();
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const socket_io_1 = require("socket.io");
const http_1 = __importDefault(require("http"));
require("./services/notificationService");
const index_1 = require("./routes/index");
const db_1 = __importDefault(require("./db"));
const logger_1 = __importDefault(require("./utils/logger"));
const promises_1 = __importDefault(require("node:dns/promises"));
promises_1.default.setServers(["1.1.1.1"]);
// config
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
const io = new socket_io_1.Server(server, {
    cors: {
        origin: [
            "http://localhost:5173",
            "http://localhost:5174",
            "http://10.0.60.168:3002",
            "http://10.0.60.168:3001",
            "https://membership-management-website.vercel.app",
            "https://membership-management-dashboar.vercel.app",
            "http://10.10.20.62:5173"
        ],
        methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
        credentials: true,
    },
});
exports.io = io;
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: "Too many requests from this IP, please try again later.",
});
// app.use(limiter);
app.use((0, cors_1.default)({
    origin: [
        "http://localhost:5173",
        "http://localhost:5174",
        "http://10.0.60.168:3002",
        "http://10.0.60.168:3001",
        "https://membership-management-website.vercel.app",
        "https://membership-management-dashboar.vercel.app",
        "http://10.10.20.62:5173"
    ],
    credentials: true,
}));
// app.use(cors());
app.get("/", (req, res) => {
    res.send(`Membership backend server is running......`);
});
(0, index_1.registerRoutesThatNeedsRawBody)(app); // have to call this before express.json() to get raw body
app.use(express_1.default.json());
app.use(logger_1.default);
(0, index_1.registerUserRoutes)(app);
(0, index_1.registerAdminRoutes)(app);
// config
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
// server.setTimeout(60000); // 1 Minute
// socket.io for notifications
io.on("connection", (socket) => {
    console.log("a user connected:", socket.id);
    socket.on("get_notifications", (userId) => __awaiter(void 0, void 0, void 0, function* () {
        const notifications = yield db_1.default.NotificationModel.find({ recipientId: userId }, { __v: 0 });
        socket.emit("previous_notifications", notifications);
    }));
    socket.on("mark_notification_read", (userId) => __awaiter(void 0, void 0, void 0, function* () {
        yield db_1.default.NotificationModel.updateMany({ recipientId: userId, isRead: false }, { isRead: true });
    }));
    socket.on("join", (room) => {
        socket.join(room);
        console.log(`User ${socket.id} joined room ${room}`);
    });
    socket.on("leave", (room) => {
        socket.leave(room);
        console.log(`User ${socket.id} left room ${room}`);
    });
    socket.on("disconnect", () => {
        console.log("User disconnected:", socket.id);
    });
});
