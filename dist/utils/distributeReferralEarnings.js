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
exports.default = distributeReferralEarnings;
const stripeService_1 = require("../services/stripeService");
const db_1 = __importDefault(require("../db"));
const eventBus_1 = require("./eventBus");
function distributeReferralEarnings(userId, amount) {
    return __awaiter(this, void 0, void 0, function* () {
        const user = yield db_1.default.UserModel.findById(userId);
        if (!user)
            return;
        let referrer = yield db_1.default.UserModel.findById(user.referredBy);
        let level = 1;
        // Fetch commission rates from DB and create a mapping
        const commissionRatesFromDB = yield db_1.default.ReferralModel.find();
        const commissionRates = {};
        commissionRatesFromDB.forEach((rate) => {
            commissionRates[rate.referralLevel] = rate.commission / 100;
        });
        while (referrer && level <= 3) {
            if (commissionRates[level]) {
                const commission = amount * commissionRates[level];
                // Ensure Stripe Connect account creation is completed first
                if (!referrer.stripeAccountId) {
                    const stripeAccount = yield (0, stripeService_1.createStripeConnectExpressAccount)(referrer.email);
                    if (stripeAccount.success) {
                        // Save the Stripe Account ID in the database
                        yield db_1.default.UserModel.findByIdAndUpdate(referrer._id, {
                            stripeAccountId: stripeAccount.accountId,
                        });
                    }
                    else {
                        console.error("Failed to create Stripe Connect account for", referrer._id);
                    }
                }
                // Update referrer's earnings
                const referrerUser = yield db_1.default.UserModel.findByIdAndUpdate(referrer._id, {
                    $inc: { referralEarnings: commission, balance: commission },
                });
                (0, eventBus_1.triggerNotification)("REFERRAL_COMMISSION", {
                    userId: referrerUser === null || referrerUser === void 0 ? void 0 : referrerUser._id.toString(),
                    amount: commission,
                });
            }
            // Move to the next level referrer, check if referredBy exists
            if (referrer.referredBy) {
                referrer = yield db_1.default.UserModel.findById(referrer.referredBy);
            }
            else {
                break; // Exit loop if there are no more referrers
            }
            level++;
        }
    });
}
