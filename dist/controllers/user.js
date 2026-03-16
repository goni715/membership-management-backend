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
exports.toggle_ban = exports.users = void 0;
const db_1 = __importDefault(require("../db"));
const users = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { page, limit, query } = (req === null || req === void 0 ? void 0 : req.query) || {};
        const searchQuery = query
            ? {
                $or: [
                    { name: { $regex: query, $options: "i" } },
                    { email: { $regex: query, $options: "i" } },
                ],
            }
            : {};
        const users = yield db_1.default.UserModel.find(searchQuery, {
            __v: 0,
            passwordHash: 0,
        })
            .skip((+(page || 1) - 1) * +(limit || 10))
            .limit(+(limit || 10));
        const total = yield db_1.default.UserModel.countDocuments(searchQuery);
        const pagination = {
            page: +(page || 1),
            limit: +(limit || 10),
            total,
            totalPages: Math.ceil(total / +(limit || 10)),
        };
        res.status(200).json({ users, pagination });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({
            message: "Internal Server Error",
        });
        return;
    }
});
exports.users = users;
const toggle_ban = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.query || {};
        const user = yield db_1.default.UserModel.findById(id);
        if (!user) {
            res.status(404).json({
                message: "User not found",
            });
            return;
        }
        if (user === null || user === void 0 ? void 0 : user.isBanned) {
            yield db_1.default.UserModel.findByIdAndUpdate(id, { isBanned: false });
            res.status(200).json({ message: "User unbanned" });
            return;
        }
        else {
            yield db_1.default.UserModel.findByIdAndUpdate(id, { isBanned: true });
            res.status(200).json({ message: "User banned" });
            return;
        }
    }
    catch (error) {
        console.log(error);
        res.status(500).json({
            message: "Internal Server Error",
        });
        return;
    }
});
exports.toggle_ban = toggle_ban;
