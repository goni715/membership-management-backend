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
exports.change_password = exports.delete_account = exports.update_profile = exports.profile = void 0;
const dotenv_1 = require("dotenv");
const db_1 = __importDefault(require("../db"));
const uploadService_1 = __importDefault(require("../services/uploadService"));
const bcrypt_1 = require("bcrypt");
const eventBus_1 = require("../utils/eventBus");
(0, dotenv_1.config)();
const profile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.user;
    try {
        const user = yield db_1.default.UserModel.findById(id, {
            photoUrl: 1,
            name: 1,
            email: 1,
            phoneNumber: 1,
            dateOfBirth: 1,
            gender: 1,
            referralCode: 1,
            _id: 1,
        });
        res.status(200).json({
            photoUrl: (user === null || user === void 0 ? void 0 : user.photoUrl) || null,
            name: (user === null || user === void 0 ? void 0 : user.name) || null,
            email: (user === null || user === void 0 ? void 0 : user.email) || null,
            phoneNumber: (user === null || user === void 0 ? void 0 : user.phoneNumber) || null,
            dateOfBirth: (user === null || user === void 0 ? void 0 : user.dateOfBirth) || null,
            gender: (user === null || user === void 0 ? void 0 : user.gender) || null,
            referralCode: (user === null || user === void 0 ? void 0 : user.referralCode) || null,
            _id: (user === null || user === void 0 ? void 0 : user._id) || null,
        });
    }
    catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
});
exports.profile = profile;
const update_profile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // check if the user exists
        const { id } = req.user;
        const user = yield db_1.default.UserModel.findById(id);
        if (!user) {
            res.status(404).json({ message: "User not found" });
            return;
        }
        const { name, phone, date_of_birth, gender, address, email } = req.body;
        const update = {};
        if (name) {
            update.name = name;
        }
        if (phone) {
            update.phoneNumber = phone;
        }
        if (date_of_birth) {
            const [day, month, year] = date_of_birth.split("/").map(Number);
            update.dateOfBirth = new Date(year, month - 1, day);
        }
        if (gender) {
            update.gender = gender;
        }
        if (address) {
            update.address = address;
        }
        if (email) {
            update.email = email;
        }
        // check for photo upload
        const photo = req.file;
        if (photo) {
            const photoUrl = yield (0, uploadService_1.default)(photo, "image");
            if (!photoUrl) {
                res.status(500).json({ message: "Error uploading photo" });
                return;
            }
            update.photoUrl = photoUrl;
        }
        // update the user profile
        yield db_1.default.UserModel.findByIdAndUpdate(id, update);
        res.status(200).json({
            message: "Profile updated successfully",
        });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal server error" });
    }
});
exports.update_profile = update_profile;
const delete_account = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.user;
        // check if the user exists
        const user = yield db_1.default.UserModel.findById(id);
        if (!user || user.accountStatus === "deleted") {
            res.status(404).json({ message: "User not found" });
            return;
        }
        // update user accountStatus to deleted
        yield db_1.default.UserModel.findByIdAndUpdate(id, { accountStatus: "deleted" });
        (0, eventBus_1.triggerNotification)("ACCOUNT_DELETED", { userEmail: user === null || user === void 0 ? void 0 : user.email });
        res.status(200).json({ message: "Account deleted successfully" });
    }
    catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
});
exports.delete_account = delete_account;
const change_password = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.user;
    const { old_password, new_password } = req.body;
    // check if the user exists
    const user = yield db_1.default.UserModel.findById(id);
    if (!user) {
        res.status(404).json({ message: "User not found" });
        return;
    }
    // check if the old password is correct
    const isPasswordValid = yield new Promise((resolve, reject) => {
        (0, bcrypt_1.compare)(old_password, user.passwordHash, (err, result) => {
            if (err) {
                reject(err);
            }
            resolve(result);
        });
    });
    if (!isPasswordValid) {
        res.status(400).json({ message: "Old password is incorrect" });
        return;
    }
    const newPasswordHash = yield (0, bcrypt_1.hash)(new_password, Number(process.env.SALT_ROUNDS) || 10);
    yield db_1.default.UserModel.findByIdAndUpdate(id, { passwordHash: newPasswordHash });
    res.status(200).json({ message: "Password changed successfully" });
});
exports.change_password = change_password;
