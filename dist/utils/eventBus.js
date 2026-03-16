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
exports.triggerNotification = exports.sendNotification = exports.eventBus = void 0;
const events_1 = require("events");
const index_1 = require("../index");
const db_1 = __importDefault(require("../db"));
class EventBus extends events_1.EventEmitter {
}
const eventBus = new EventBus();
exports.eventBus = eventBus;
eventBus.setMaxListeners(50); // Prevent memory leak warnings
const sendNotification = (_a) => __awaiter(void 0, [_a], void 0, function* ({ recipientId, recipientRole, title, description, type, }) {
    try {
        const notification = new db_1.default.NotificationModel({
            recipientId,
            recipientRole,
            title,
            description,
            type,
        });
        yield notification.save();
        // Send notification via Socket.IO
        if (recipientRole === "admin") {
            index_1.io.to("admin").emit("admin_notification", notification);
        }
        else if (recipientId) {
            index_1.io.to(`user_${recipientId}`).emit("new_notification", notification);
        }
    }
    catch (error) {
        console.error("Error sending notification:", error);
    }
});
exports.sendNotification = sendNotification;
const triggerNotification = (event, data) => {
    eventBus.emit(event, data);
};
exports.triggerNotification = triggerNotification;
