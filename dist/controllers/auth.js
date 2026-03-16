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
exports.refresh_token = exports.signin = exports.update_password = exports.forgot_password = exports.validate_otp = exports.resend = exports.signup = void 0;
const email_validator_1 = require("email-validator");
const http_status_codes_1 = require("http-status-codes");
const db_1 = __importDefault(require("../db"));
const bcrypt_1 = require("bcrypt");
const otp_generator_1 = require("otp-generator");
const jsonwebtoken_1 = require("jsonwebtoken");
const otpService_1 = require("../services/otpService");
const dotenv_1 = require("dotenv");
const eventBus_1 = require("../utils/eventBus");
const uuid_1 = require("uuid");
const checkSubscriptionStatus_1 = __importDefault(require("../utils/checkSubscriptionStatus"));
(0, dotenv_1.config)();
const ENV = process.env.NODE_ENV;
const signup = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, email: emailFromBody, password, referralCode, } = req.body || {};
        // Validate input
        if (!name || !emailFromBody || !password) {
            res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).json({
                message: "Name, Email, and Password are required",
            });
            return;
        }
        // normalize email
        const email = emailFromBody.trim().toLowerCase();
        // Validate email format
        if (!(0, email_validator_1.validate)(email)) {
            res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).json({
                message: "Email is not valid",
            });
        }
        // Check if email already exists
        const existingUser = yield db_1.default.UserModel.findOne({ email }).exec();
        if (existingUser) {
            res.status(http_status_codes_1.StatusCodes.CONFLICT).json({
                message: `User with the email ${email} already exists.`,
            });
            return;
        }
        let referrer = null;
        if (referralCode) {
            referrer = yield db_1.default.UserModel.findOne({ referralCode }).exec();
            if (!referrer) {
                res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).json({
                    message: "Invalid referral code.",
                });
                return;
            }
        }
        // Hash password
        const passwordHash = yield (0, bcrypt_1.hash)(password, Number(process.env.SALT_ROUNDS) || 10);
        // Generate a unique referral code for the new user
        let newReferralCode = (0, uuid_1.v4)().replace(/-/g, "").slice(0, 10).toUpperCase();
        while (yield db_1.default.UserModel.findOne({ referralCode: newReferralCode })) {
            newReferralCode = (0, uuid_1.v4)().replace(/-/g, "").slice(0, 10).toUpperCase();
        }
        const newUser = new db_1.default.UserModel({
            name,
            email,
            passwordHash,
            referralCode: newReferralCode,
            referredBy: referrer ? referrer._id : null,
        });
        yield newUser.save();
        // If the user has a referrer, update their `referredUsers` array
        if (referrer) {
            yield db_1.default.UserModel.findByIdAndUpdate(referrer._id, {
                $push: { referredUsers: newUser._id },
            });
        }
        // handle otp
        const otpParams = {
            upperCaseAlphabets: false,
            lowerCaseAlphabets: false,
            specialChars: false,
        };
        let otp = (0, otp_generator_1.generate)(6, otpParams);
        let result = yield db_1.default.OTPModel.findOne({ otp: otp });
        while (result) {
            otp = (0, otp_generator_1.generate)(6, otpParams);
            result = yield db_1.default.OTPModel.findOne({ otp: otp });
        }
        yield db_1.default.OTPModel.create({ email, otp, type: otpService_1.OTPTypes.SIGNUP });
        (0, eventBus_1.triggerNotification)("USER_SIGNUP", { userId: newUser === null || newUser === void 0 ? void 0 : newUser._id.toString() });
        const response = {
            success: true,
            message: "OTP sent successfully",
        };
        if (ENV === "development") {
            response.otp = otp;
        }
        res.status(200).json(response);
    }
    catch (error) {
        res.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: error.message || "Internal Server Error",
        });
    }
});
exports.signup = signup;
const resend = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email: emailFromBody, type } = req.body || {};
        // normalize email
        const email = emailFromBody.trim().toLowerCase();
        // Check if email already exists
        const existingUser = yield db_1.default.UserModel.findOne({ email }).exec();
        if (!existingUser) {
            res.status(http_status_codes_1.StatusCodes.CONFLICT).json({
                message: `User with the email ${email} doesn't exist.`,
            });
            return;
        }
        if (existingUser.emailVerified) {
            res.status(http_status_codes_1.StatusCodes.CONFLICT).json({
                message: `This user is already verified.`,
            });
            return;
        }
        const otpParams = {
            upperCaseAlphabets: false,
            lowerCaseAlphabets: false,
            specialChars: false,
        };
        let otp = (0, otp_generator_1.generate)(6, otpParams);
        let result = yield db_1.default.OTPModel.findOne({ otp: otp });
        while (result) {
            otp = (0, otp_generator_1.generate)(6, otpParams);
            result = yield db_1.default.OTPModel.findOne({ otp: otp });
        }
        yield db_1.default.OTPModel.create({ email, otp, type });
        const response = {
            success: true,
            message: "OTP sent successfully",
        };
        if (ENV === "development") {
            response.otp = otp;
        }
        res.status(200).json(response);
    }
    catch (error) {
        res.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: error.message || "Internal Server Error",
        });
    }
});
exports.resend = resend;
const validate_otp = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email: emailFromBody, otp } = req.body || {};
        if (!emailFromBody || !otp) {
            res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).json({
                message: "Email and OTP are required",
            });
            return;
        }
        // normalize email
        const email = emailFromBody.trim().toLowerCase();
        // Find the most recent OTP for the email
        const response = yield db_1.default.OTPModel.find({ email })
            .sort({ createdAt: -1 })
            .limit(1);
        if (response.length === 0 || otp !== response[0].otp) {
            res.status(400).json({
                message: "The OTP is not valid",
            });
            return;
        }
        // delete otp document after verification
        yield db_1.default.OTPModel.deleteMany({ email });
        // Update user account status
        // even if its not a signup OTP, we can update the account status
        // because the only way to validate OTP is through the email
        yield db_1.default.UserModel.updateOne({ email }, { $set: { emailVerified: true } });
        const user = yield db_1.default.UserModel.findOne({ email });
        (0, eventBus_1.triggerNotification)("EMAIL_VERIFIED", { userId: user === null || user === void 0 ? void 0 : user._id.toString() });
        if (response[0].type === otpService_1.OTPTypes.FORGOT_PASSWORD) {
            const passwordResetToken = (0, jsonwebtoken_1.sign)({ email, purpose: "password_reset" }, process.env.PASSWORD_RESET_SECRET || "fallback_secret", { expiresIn: "10m" });
            res.status(200).json({
                message: "OTP verified successfully",
                success: true,
                passwordResetToken,
            });
            return;
        }
        res.status(http_status_codes_1.StatusCodes.OK).json({
            message: `Email ${email} verified successfully`,
            success: true,
        });
    }
    catch (error) {
        res.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: error.message || "Internal Server Error",
        });
    }
});
exports.validate_otp = validate_otp;
const forgot_password = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email: emailFromBody } = req.body || {};
    // normalize email
    const email = emailFromBody.trim().toLowerCase();
    const existingUser = yield db_1.default.UserModel.findOne({ email }).exec();
    if (!existingUser) {
        res.status(http_status_codes_1.StatusCodes.CONFLICT).json({
            message: `User with the email ${email} doesn't exist.`,
        });
        return;
    }
    const otpParams = {
        upperCaseAlphabets: false,
        lowerCaseAlphabets: false,
        specialChars: false,
    };
    let otp = (0, otp_generator_1.generate)(6, otpParams);
    let result = yield db_1.default.OTPModel.findOne({ otp: otp });
    while (result) {
        otp = (0, otp_generator_1.generate)(6, otpParams);
        result = yield db_1.default.OTPModel.findOne({ otp: otp });
    }
    yield db_1.default.OTPModel.create({ email, otp, type: otpService_1.OTPTypes.FORGOT_PASSWORD });
    const response = {
        success: true,
        message: "OTP for resetting the password sent successfully",
    };
    if (ENV === "development") {
        response.otp = otp;
    }
    res.status(200).json(response);
});
exports.forgot_password = forgot_password;
const update_password = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { password } = (req === null || req === void 0 ? void 0 : req.body) || {};
    const passwordResetToken = (_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.split(" ")[1];
    if (!passwordResetToken) {
        res.status(401).json({ message: "Unauthorized. Missing token." });
        return;
    }
    // Verify JWT
    let decoded;
    try {
        decoded = (0, jsonwebtoken_1.verify)(passwordResetToken, process.env.PASSWORD_RESET_SECRET || "fallback_secret");
    }
    catch (err) {
        res.status(403).json({ message: "Invalid or expired token." });
        return;
    }
    if (!(decoded === null || decoded === void 0 ? void 0 : decoded.purpose) || (decoded === null || decoded === void 0 ? void 0 : decoded.purpose) !== "password_reset") {
        res.status(403).json({ message: "Invalid token purpose." });
        return;
    }
    const email = decoded === null || decoded === void 0 ? void 0 : decoded.email;
    const existingUser = yield db_1.default.UserModel.findOne({ email }).exec();
    if (!existingUser) {
        res.status(http_status_codes_1.StatusCodes.CONFLICT).json({
            message: `User with the email ${email} doesn't exist.`,
        });
        return;
    }
    // Hash password
    const passwordHash = yield (0, bcrypt_1.hash)(password, Number(process.env.SALT_ROUNDS) || 10);
    yield db_1.default.UserModel.updateOne({ email }, { $set: { passwordHash } });
    (0, eventBus_1.triggerNotification)("PASSWORD_UPDATE", {
        userId: existingUser === null || existingUser === void 0 ? void 0 : existingUser._id.toString(),
    });
    res.status(http_status_codes_1.StatusCodes.OK).json({
        message: "Password updated successfully",
    });
});
exports.update_password = update_password;
const signin = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email: emailFromBody, password, remember_me } = req.body || {};
    // normalize email
    const email = emailFromBody.trim().toLowerCase();
    // check if email password matches with DB
    const user = yield db_1.default.UserModel.findOne({ email }).exec();
    if (!user) {
        res.status(http_status_codes_1.StatusCodes.NOT_FOUND).json({
            message: "User not found",
        });
        return;
    }
    // check if user account is verified
    if (!user.emailVerified) {
        res.status(403).json({
            message: "Account is not verified. Please verify your email first.",
        });
        return;
    }
    // check if user account is subscribed
    (0, checkSubscriptionStatus_1.default)(user._id.toString());
    // Compare passwords
    const isMatch = yield (0, bcrypt_1.compare)(password, user.passwordHash);
    if (!isMatch) {
        res.status(http_status_codes_1.StatusCodes.CONFLICT).json({
            message: "Password is incorrect",
        });
        return;
    }
    // Generate tokens
    const accessToken = (0, jsonwebtoken_1.sign)({ email, userId: user._id, role: user.role }, process.env.ACCESS_TOKEN_SECRET || "fallback_secret", { expiresIn: "1d" });
    const refreshToken = (0, jsonwebtoken_1.sign)({ email, userId: user._id, role: user.role }, process.env.REFRESH_TOKEN_SECRET || "fallback_secret", { expiresIn: remember_me ? "30d" : "10m" });
    res.status(http_status_codes_1.StatusCodes.OK).json({
        message: "Login successful",
        accessToken,
        refreshToken,
    });
});
exports.signin = signin;
const refresh_token = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    // get jwt from header
    const jwt = (_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.split(" ")[1];
    // verify jwt
    if (!jwt) {
        res.status(401).json({ message: "Unauthorized" });
        return;
    }
    const secret = process.env.REFRESH_TOKEN_SECRET;
    if (!secret) {
        res.status(500).json({ message: "Internal Server Error" });
        return;
    }
    (0, jsonwebtoken_1.verify)(jwt, secret, (err, decoded) => __awaiter(void 0, void 0, void 0, function* () {
        if (err) {
            res.status(401).json({ message: "Unauthorized" });
        }
        else {
            if (decoded) {
                (0, checkSubscriptionStatus_1.default)(decoded.userId);
                const accessToken = (0, jsonwebtoken_1.sign)({
                    email: decoded.email,
                    userId: decoded.userId,
                    role: decoded.role,
                }, process.env.ACCESS_TOKEN_SECRET || "fallback_secret", { expiresIn: "2m" });
                res.status(http_status_codes_1.StatusCodes.OK).json({
                    message: "Token refreshed successfully",
                    accessToken,
                });
            }
            else {
                res.status(401).json({ message: "Unauthorized" });
            }
        }
    }));
});
exports.refresh_token = refresh_token;
