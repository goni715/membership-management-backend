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
exports.earnings = exports.update_withdraw_requests = exports.withdraw_requests = exports.withdraw_history = exports.request_withdrawal = exports.balance = void 0;
const stripeService_1 = require("../services/stripeService");
const eventBus_1 = require("../utils/eventBus");
const db_1 = __importDefault(require("../db"));
const uuid_1 = require("uuid");
const balance = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const balance = yield db_1.default.UserModel.findById(req.user.id, {
        balance: 1,
        _id: 0,
    });
    res.status(200).json(balance);
});
exports.balance = balance;
const request_withdrawal = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { amount } = req.body || {};
    if (amount < 100) {
        res.status(400).json({
            message: "The minimum withdrawal amount is $100",
        });
        return;
    }
    const user = yield db_1.default.UserModel.findById(req.user.id, {
        balance: 1,
        stripeAccountId: 1,
        _id: 0,
    });
    if (!(user === null || user === void 0 ? void 0 : user.balance) || amount > (user === null || user === void 0 ? void 0 : user.balance)) {
        res.status(400).json({
            message: "Insufficient balance",
        });
        return;
    }
    if (!(user === null || user === void 0 ? void 0 : user.stripeAccountId)) {
        res.status(400).json({
            message: "Stripe account not found",
        });
        return;
    }
    try {
        let transactionId;
        let isUnique = false;
        while (!isUnique) {
            transactionId = (0, uuid_1.v4)().replace(/-/g, "").slice(0, 8).toUpperCase();
            const existingTransaction = yield db_1.default.WithdrawalModel.findOne({
                transactionId,
            });
            if (!existingTransaction) {
                isUnique = true;
            }
        }
        yield db_1.default.WithdrawalModel.create({
            requesterId: req.user.id,
            amount,
            transactionId,
            stripeAccountId: user.stripeAccountId,
        });
        (0, eventBus_1.triggerNotification)("WITHDRAWAL_REQUESTED", {
            userId: req.user.id,
            userEmail: user === null || user === void 0 ? void 0 : user.email,
        });
        res
            .status(200)
            .json({ message: "Withdrawal request submitted successfully" });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});
exports.request_withdrawal = request_withdrawal;
const withdraw_history = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { page, limit } = (req === null || req === void 0 ? void 0 : req.query) || {};
    const withdraw_history = yield db_1.default.WithdrawalModel.find({
        requesterId: req.user.id,
    }, { __v: 0 })
        .sort({ createdAt: -1 })
        .skip((+(page || 1) - 1) * +(limit || 10))
        .limit(+(limit || 10));
    const total = yield db_1.default.WithdrawalModel.countDocuments({
        requesterId: req.user.id,
    });
    const pagination = {
        page: +(page || 1),
        limit: +(limit || 10),
        total,
        totalPages: Math.ceil(total / +(limit || 10)),
    };
    res.status(200).json({ withdraw_history, pagination });
});
exports.withdraw_history = withdraw_history;
const withdraw_requests = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { page, limit, query } = req.query || {};
    const searchQuery = {};
    if (query) {
        // Find users matching the search term
        const users = yield db_1.default.UserModel.find({
            $or: [
                { name: { $regex: query, $options: "i" } }, // Search by name (case-insensitive)
                { email: { $regex: query, $options: "i" } }, // Search by email
            ],
        }).select("_id");
        // Extract matching user IDs
        const matchingUserIds = users.map((user) => user._id);
        // Filter withdraw requests by matching requesterId
        searchQuery.requesterId = { $in: matchingUserIds };
    }
    const withdraw_requests = yield db_1.default.WithdrawalModel.find(searchQuery, {
        __v: 0,
    })
        .populate("requesterId", "name email photoUrl")
        .sort({ createdAt: -1 })
        .skip((+(page || 1) - 1) * +(limit || 10))
        .limit(+(limit || 10));
    const total = yield db_1.default.WithdrawalModel.countDocuments(searchQuery);
    const pagination = {
        page: +(page || 1),
        limit: +(limit || 10),
        total,
        totalPages: Math.ceil(total / +(limit || 10)),
    };
    res.status(200).json({ withdraw_requests, pagination });
});
exports.withdraw_requests = withdraw_requests;
const update_withdraw_requests = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { withdraw_id, status } = req.body || {};
    if (!withdraw_id || !status) {
        res.status(400).json({ message: "Withdraw ID and status are required" });
        return;
    }
    if (!["approved", "rejected", "pending", "failed"].includes(status)) {
        res.status(400).json({ message: "Invalid status value" });
        return;
    }
    const withdraw = yield db_1.default.WithdrawalModel.findById(withdraw_id);
    if (!withdraw) {
        res.status(404).json({ message: "Withdrawal request not found" });
        return;
    }
    if (status === "approved") {
        if (withdraw.status === "approved") {
            res
                .status(400)
                .json({ message: "This withdrawal request has already been approved" });
            return;
        }
        try {
            const stripeTransfer = yield (0, stripeService_1.transferToConnectedAccount)({
                destinationAccountId: withdraw.stripeAccountId,
                amountInCents: withdraw.amount * 100,
            });
            if (!stripeTransfer.success) {
                yield db_1.default.WithdrawalModel.findByIdAndUpdate(withdraw_id, {
                    status: "failed",
                    stripeResponse: stripeTransfer,
                });
                res.status(200).json({
                    message: "Withdrawal request failed",
                    stripeResponse: stripeTransfer,
                });
                return;
            }
            const user = yield db_1.default.UserModel.findByIdAndUpdate(withdraw.requesterId, {
                $inc: { balance: -withdraw.amount },
            });
            yield db_1.default.WithdrawalModel.findByIdAndUpdate(withdraw_id, {
                status,
                stripeResponse: stripeTransfer,
            });
            (0, eventBus_1.triggerNotification)("WITHDRAWAL_APPROVED", {
                userId: user === null || user === void 0 ? void 0 : user._id.toString(),
                userEmail: user === null || user === void 0 ? void 0 : user.email,
            });
            if (stripeTransfer.error) {
                (0, eventBus_1.triggerNotification)("WITHDRAWAL_FAILED", {
                    userId: user === null || user === void 0 ? void 0 : user._id.toString(),
                    userEmail: user === null || user === void 0 ? void 0 : user.email,
                });
            }
            res
                .status(200)
                .json({ message: "Withdrawal request approved successfully" });
            return;
        }
        catch (error) {
            res.status(500).json({ message: "Internal Server Error" });
            return;
        }
    }
    if (status === "rejected") {
        const user = yield db_1.default.UserModel.findById(withdraw.requesterId);
        (0, eventBus_1.triggerNotification)("WITHDRAWAL_REJECTED", {
            userId: user === null || user === void 0 ? void 0 : user._id.toString(),
            userEmail: user === null || user === void 0 ? void 0 : user.email,
        });
    }
    try {
        yield db_1.default.WithdrawalModel.findByIdAndUpdate(withdraw_id, {
            status,
        });
        res
            .status(200)
            .json({ message: "Withdrawal request updated successfully" });
    }
    catch (error) {
        res.status(500).json({ message: "Internal Server Error" });
    }
});
exports.update_withdraw_requests = update_withdraw_requests;
const earnings = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { page, limit, query } = req.query || {};
    const searchQuery = query
        ? {
            $or: [{ name: { $regex: query, $options: "i" } }],
        }
        : {};
    const usersFromDB = yield db_1.default.UserModel.find(searchQuery)
        .sort({ createdAt: -1 })
        .skip((+(page || 1) - 1) * +(limit || 10))
        .limit(+(limit || 10));
    const users = usersFromDB.map(({ _id, name, photoUrl, subscriptionExpiry, isSubscribed }) => ({
        _id,
        name,
        photoUrl,
        date_and_time: subscriptionExpiry
            ? new Date(Number(subscriptionExpiry) - 30 * 24 * 60 * 60 * 1000)
            : null,
        status: isSubscribed ? "paid" : "unpaid",
    }));
    const total = yield db_1.default.UserModel.countDocuments(searchQuery);
    const pagination = {
        page: +(page || 1),
        limit: +(limit || 10),
        total,
        totalPages: Math.ceil(total / +(limit || 10)),
    };
    res.status(200).json({ users, pagination });
});
exports.earnings = earnings;
