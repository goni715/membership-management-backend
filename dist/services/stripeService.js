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
exports.transferToConnectedAccount = exports.getOnboardingLink = exports.createStripeConnectExpressAccount = exports.createCheckoutSession = void 0;
const dotenv_1 = require("dotenv");
const stripe_1 = __importDefault(require("stripe"));
(0, dotenv_1.config)();
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
if (!stripeSecretKey) {
    throw new Error("Stripe secret key is not defined in environment variables");
}
const createCheckoutSession = (_a) => __awaiter(void 0, [_a], void 0, function* ({ userId }) {
    try {
        const stripe = new stripe_1.default(stripeSecretKey, {
            apiVersion: "2025-01-27.acacia",
        });
        const session = yield stripe.checkout.sessions.create({
            client_reference_id: userId,
            line_items: [
                {
                    price_data: {
                        currency: "usd",
                        product_data: {
                            name: "Avantra",
                        },
                        unit_amount: 1000,
                        recurring: {
                            interval: "month",
                        },
                    },
                    quantity: 1,
                },
            ],
            mode: "subscription",
            success_url: "http://localhost:5174",
            cancel_url: "http://localhost:5174",
        });
        return session;
    }
    catch (error) {
        return error;
    }
});
exports.createCheckoutSession = createCheckoutSession;
const createStripeConnectExpressAccount = (email) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const stripe = new stripe_1.default(stripeSecretKey, {
            apiVersion: "2025-01-27.acacia",
        });
        // Create an Express Account for the user
        const account = yield stripe.accounts.create({
            type: "express",
            email,
            capabilities: {
                transfers: { requested: true },
            },
        });
        return { success: true, accountId: account.id };
    }
    catch (error) {
        console.error("Error creating Stripe Connect account:", error);
        return { success: false, error };
    }
});
exports.createStripeConnectExpressAccount = createStripeConnectExpressAccount;
const getOnboardingLink = (accountId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const stripe = new stripe_1.default(stripeSecretKey, {
            apiVersion: "2025-01-27.acacia",
        });
        const accountLink = yield stripe.accountLinks.create({
            account: accountId,
            refresh_url: "http://localhost:5174",
            return_url: "http://localhost:5174",
            type: "account_onboarding",
        });
        return { success: true, url: accountLink.url };
    }
    catch (error) {
        console.error("Error creating onboarding link:", error);
        return { success: false, error };
    }
});
exports.getOnboardingLink = getOnboardingLink;
const transferToConnectedAccount = (_a) => __awaiter(void 0, [_a], void 0, function* ({ amountInCents, destinationAccountId, }) {
    try {
        const stripe = new stripe_1.default(stripeSecretKey, {
            apiVersion: "2025-01-27.acacia",
        });
        const transfer = yield stripe.transfers.create({
            amount: amountInCents, // Amount in cents
            currency: "usd",
            destination: destinationAccountId, // User's Stripe Connect Account ID
        });
        return { success: true, transfer };
    }
    catch (error) {
        console.error("Error transferring funds:", error);
        return { success: false, error };
    }
});
exports.transferToConnectedAccount = transferToConnectedAccount;
