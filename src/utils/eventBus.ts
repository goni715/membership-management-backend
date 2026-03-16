import { EventEmitter } from "events";
import { io } from "../index";
import DB from "../db";
import { EVENTS } from "src/services/notificationService";

class EventBus extends EventEmitter {}

const eventBus = new EventBus();
eventBus.setMaxListeners(50); // Prevent memory leak warnings

const sendNotification = async ({
  recipientId,
  recipientRole,
  title,
  description,
  type,
}: {
  recipientId?: string;
  recipientRole: "admin" | "user";
  title: string;
  description: string;
  type: "success" | "error" | "info" | "warning";
}) => {
  try {
    const notification = new DB.NotificationModel({
      recipientId,
      recipientRole,
      title,
      description,
      type,
    });

    await notification.save();

    // Send notification via Socket.IO
    if (recipientRole === "admin") {
      io.to("admin").emit("admin_notification", notification);
    } else if (recipientId) {
      io.to(`user_${recipientId}`).emit("new_notification", notification);
    }
  } catch (error) {
    console.error("Error sending notification:", error);
  }
};

const triggerNotification = (event: keyof typeof EVENTS, data: any) => {
  eventBus.emit(event, data);
};

export { eventBus, sendNotification, triggerNotification };
