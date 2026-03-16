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
exports.mark_all_as_read = exports.mark_as_read = exports.notifications_count = exports.notifications_by_id = exports.notifications = void 0;
const mongoose_1 = require("mongoose");
const db_1 = __importDefault(require("../db"));
const notifications = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { page, limit } = req.query;
    try {
        const notifications = yield db_1.default.NotificationModel.find({}, { __v: 0 })
            .sort({ createdAt: -1 })
            .skip((+(page || 1) - 1) * +(limit || 10))
            .limit(+(limit || 10));
        const total = yield db_1.default.NotificationModel.countDocuments();
        const pagination = {
            page: +(page || 1),
            limit: +(limit || 10),
            total,
            totalPages: Math.ceil(total / +(limit || 10)),
        };
        res.status(200).json({ notifications, pagination });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});
exports.notifications = notifications;
const notifications_by_id = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { page, limit } = req.query || {};
        const userId = ((_a = req.user) === null || _a === void 0 ? void 0 : _a.id) || {};
        if (!(0, mongoose_1.isValidObjectId)(userId)) {
            res.status(400).json({ message: "Invalid id" });
            return;
        }
        const notifications = yield db_1.default.NotificationModel.find({ recipientId: userId }, { __v: 0 })
            .sort({ createdAt: -1 })
            .skip((+(page || 1) - 1) * +(limit || 10))
            .limit(+(limit || 10));
        const total = yield db_1.default.NotificationModel.countDocuments({
            recipientId: userId,
        });
        const pagination = {
            page: +(page || 1),
            limit: +(limit || 10),
            total,
            totalPages: Math.ceil(total / +(limit || 10)),
        };
        res.status(200).json({ notifications, pagination });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});
exports.notifications_by_id = notifications_by_id;
const notifications_count = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = ((_a = req.user) === null || _a === void 0 ? void 0 : _a.id) || {};
        const count = yield db_1.default.NotificationModel.countDocuments({
            isRead: false,
            recipientId: userId,
        });
        res.status(200).json({ count });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});
exports.notifications_count = notifications_count;
const mark_as_read = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { notificationId } = (req === null || req === void 0 ? void 0 : req.params) || {};
        yield db_1.default.NotificationModel.findByIdAndUpdate(notificationId, {
            isRead: true,
        });
        res
            .status(200)
            .json({ message: "Notification marked as read successfully" });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});
exports.mark_as_read = mark_as_read;
const mark_all_as_read = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = ((_a = req.user) === null || _a === void 0 ? void 0 : _a.id) || {};
        yield db_1.default.NotificationModel.updateMany({ recipientId: userId }, { isRead: true });
        res
            .status(200)
            .json({ message: "All notifications marked as read successfully" });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});
exports.mark_all_as_read = mark_all_as_read;
