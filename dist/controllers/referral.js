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
exports.update_referral_commissions = exports.referral_commissions = void 0;
const db_1 = __importDefault(require("../db"));
const referral_commissions = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const referralCommissions = yield db_1.default.ReferralModel.find().sort({
            referralLevel: 1,
        });
        res.status(200).json(referralCommissions);
    }
    catch (error) {
        console.log(error);
        res.status(500).json({
            message: "Internal Server Error",
        });
    }
});
exports.referral_commissions = referral_commissions;
const update_referral_commissions = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id, levelName, commission } = req.body || {};
        yield db_1.default.ReferralModel.findByIdAndUpdate(id, {
            levelName,
            commission,
        });
        res.status(200).json({
            message: "Referral commission updated successfully",
        });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({
            message: "Internal Server Error",
        });
    }
});
exports.update_referral_commissions = update_referral_commissions;
