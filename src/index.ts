require("dotenv").config();
import express, { Request, Response } from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { Server } from "socket.io";
import http from "http";
import "@services/notificationService";
import {
  registerAdminRoutes,
  registerRoutesThatNeedsRawBody,
  registerUserRoutes,
} from "@routes/index";
import db from "./db";
import logger from "@utils/logger";

// config
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
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

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many requests from this IP, please try again later.",
});

// app.use(limiter);
// app.use(
//   cors({
//     origin: [
//       "http://localhost:5173",
//       "http://localhost:5174",
//       "http://10.0.60.168:3002",
//       "http://10.0.60.168:3001",
//       "https://membership-management-website.vercel.app",
//       "https://membership-management-dashboar.vercel.app",
//       "http://10.10.20.62:5173"
//     ],
//     credentials: true,
//   })
// );
app.use(cors());

app.get("/", (req: Request, res: Response) => {
  res.send(`Membership backend server is running......`);
});

registerRoutesThatNeedsRawBody(app); // have to call this before express.json() to get raw body
app.use(express.json());
app.use(logger);
registerUserRoutes(app);
registerAdminRoutes(app);
// config

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// server.setTimeout(60000); // 1 Minute

// socket.io for notifications
io.on("connection", (socket) => {
  console.log("a user connected:", socket.id);

  socket.on("get_notifications", async (userId) => {
    const notifications = await db.NotificationModel.find(
      { recipientId: userId },
      { __v: 0 }
    );
    socket.emit("previous_notifications", notifications);
  });

  socket.on("mark_notification_read", async (userId) => {
    await db.NotificationModel.updateMany(
      { recipientId: userId, isRead: false },
      { isRead: true }
    );
  });

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

export { io };
