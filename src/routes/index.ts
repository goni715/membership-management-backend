import { Express } from "express";
import webhookRoutes from "@routes/webhook.routes";
import * as userRoutes from "./app";
import * as adminRoutes from "./admin";
import { authorize } from "@middleware/auth";

const registerUserRoutes = (app: Express) => {
  app.use("/auth", userRoutes.authRoutes);
  app.use("/tools", userRoutes.toolsRoutes);
  app.use("/profile", authorize(["user", "admin"]), userRoutes.profileRoutes);
  app.use(
    "/notifications",
    authorize(["user"]),
    userRoutes.notificationsRoutes
  );
  app.use("/stripe", authorize(["user"]), userRoutes.stripeRoutes);
  app.use("/dashboard", authorize(["user"]), userRoutes.dashboardRoutes);
  app.use("/payment", authorize(["user"]), userRoutes.paymentRoutes);
  app.use("/legal", authorize(["user"]), userRoutes.legalRoutes);
};

const registerAdminRoutes = (app: Express) => {
  app.use("/admin/tools", authorize(["admin"]), adminRoutes.toolsRoutes);
  app.use(
    "/admin/notifications",
    authorize(["admin"]),
    adminRoutes.notificationsRoutes
  );
  app.use("/admin/users", authorize(["admin"]), adminRoutes.userRoutes);
  app.use("/admin/referrals", authorize(["admin"]), adminRoutes.referralRoutes);
  app.use("/admin/stripe", authorize(["admin"]), adminRoutes.stripeRoutes);
  app.use(
    "/admin/dashboard",
    authorize(["admin"]),
    adminRoutes.dashboardRoutes
  );
  app.use("/admin/payment", authorize(["admin"]), adminRoutes.paymentRoutes);
  app.use("/admin/legal", authorize(["admin"]), adminRoutes.legalRoutes);
};

const registerRoutesThatNeedsRawBody = (app: Express) => {
  app.use("/webhook", webhookRoutes);
};

export {
  registerRoutesThatNeedsRawBody,
  registerUserRoutes,
  registerAdminRoutes,
};
