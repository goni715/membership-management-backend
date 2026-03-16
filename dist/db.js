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
const mongoose_1 = __importDefault(require("mongoose"));
const schema_1 = __importDefault(require("./schema"));
const otpService_1 = require("./services/otpService");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const startDB = () => __awaiter(void 0, void 0, void 0, function* () {
    console.log(process.env.MONGO_URI);
    yield mongoose_1.default.connect(process.env.MONGO_URI || "");
    console.log("MongoDB Connected!");
    initializeDB();
});
const initializeDB = () => __awaiter(void 0, void 0, void 0, function* () {
    (0, otpService_1.attachOTPHooks)();
    try {
        const existingDoc = yield ToolModel.findOne({ name: "Youtube" });
        if (!existingDoc) {
            yield ToolModel.create({
                name: "Youtube",
                icon: "https://static.cdnlogo.com/logos/y/57/youtube-icon.svg",
                order: 0,
            });
            console.log("Youtube tool created.");
        }
    }
    catch (error) {
        console.error("Error ensuring document exists:", error);
    }
    try {
        const existingDocs = yield ReferralModel.find();
        if (!existingDocs.length) {
            yield ReferralModel.create([
                {
                    levelName: "Level 1",
                    referralLevel: 1,
                    commission: 50,
                },
                {
                    levelName: "Level 2",
                    referralLevel: 2,
                    commission: 10,
                },
                {
                    levelName: "Level 3",
                    referralLevel: 3,
                    commission: 5,
                },
            ]);
            console.log("Referral levels created.");
        }
    }
    catch (error) {
        console.error("Error ensuring document exists:", error);
    }
});
startDB();
const UserModel = mongoose_1.default.model("User", schema_1.default.User);
const OTPModel = mongoose_1.default.model("OTP", schema_1.default.OTP);
const ToolModel = mongoose_1.default.model("Tool", schema_1.default.Tool);
const VideoModel = mongoose_1.default.model("Video", schema_1.default.Video);
const FileModel = mongoose_1.default.model("File", schema_1.default.File);
const NotificationModel = mongoose_1.default.model("Notification", schema_1.default.Notification);
const ReferralModel = mongoose_1.default.model("Referral", schema_1.default.Referral);
const PaymentModel = mongoose_1.default.model("Payment", schema_1.default.Payment);
const WithdrawalModel = mongoose_1.default.model("Withdrawal", schema_1.default.Withdrawal);
const LegalModel = mongoose_1.default.model("Legal", schema_1.default.Legal);
module.exports = {
    UserModel,
    OTPModel,
    ToolModel,
    VideoModel,
    FileModel,
    NotificationModel,
    ReferralModel,
    PaymentModel,
    WithdrawalModel,
    LegalModel,
};
