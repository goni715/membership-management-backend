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
exports.history = exports.transfer_funds = exports.account_link = exports.stripe_webhook = exports.create_payment = void 0;
const stripeService_1 = require("../services/stripeService");
const distributeReferralEarnings_1 = __importDefault(require("../utils/distributeReferralEarnings"));
const eventBus_1 = require("../utils/eventBus");
const mongoose_1 = require("mongoose");
const db_1 = __importDefault(require("../db"));
const stripe_1 = __importDefault(require("stripe"));
// subscription
const create_payment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId } = req.body || {};
    if (!(0, mongoose_1.isValidObjectId)(userId)) {
        res.status(400).json({
            message: "User Id Invalid",
        });
        return;
    }
    const user = yield db_1.default.UserModel.findById(userId);
    if (!user) {
        res.status(400).json({
            message: "User not found",
        });
        return;
    }
    try {
        const session = (yield (0, stripeService_1.createCheckoutSession)({
            userId,
        }));
        res.status(200).json({ url: session.url });
    }
    catch (error) {
        console.log(error);
        res.status(200).json({ message: error });
    }
});
exports.create_payment = create_payment;
const stripe_webhook = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const webhook_secret = process.env.STRIPE_WEBHOOK_SECRET;
    const sig = req.headers["stripe-signature"];
    if (!sig) {
        res.status(500).send("Missing Stripe signature");
        return;
    }
    if (!webhook_secret) {
        res.status(500).send("Missing Stripe webhook secret");
        return;
    }
    try {
        const event = stripe_1.default.webhooks.constructEvent(req.body, sig, webhook_secret);
        if (event.type === "checkout.session.completed") {
            const session = event.data.object;
            if (!session.client_reference_id) {
                console.log("User ID missing");
                res.send();
                return;
            }
            yield db_1.default.PaymentModel.create({
                amount: ((_a = session.amount_total) !== null && _a !== void 0 ? _a : 0) / 100,
                createdAt: new Date(session.created * 1000),
                paymentId: session.id,
                paymentStatus: session.payment_status,
                userId: session.client_reference_id,
            });
            const user = yield db_1.default.UserModel.findByIdAndUpdate(session.client_reference_id, {
                isSubscribed: true,
                subscriptionExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30-day subscription period
            });
            // distribute referral commissions to refferers
            (0, distributeReferralEarnings_1.default)(session.client_reference_id, ((_b = session.amount_total) !== null && _b !== void 0 ? _b : 0) / 100);
            (0, eventBus_1.triggerNotification)("PAYMENT_SUCCESS", {
                userId: user === null || user === void 0 ? void 0 : user._id.toString(),
                userEmail: user === null || user === void 0 ? void 0 : user.email,
            });
            res.send();
        }
        else if (event.type === "account.external_account.created") {
            const user = yield db_1.default.UserModel.findOneAndUpdate({ stripeAccountId: event.account }, {
                stripeOnboardingDone: true,
            });
            (0, eventBus_1.triggerNotification)("ACCOUNT_ONBOARDED", {
                userId: user === null || user === void 0 ? void 0 : user._id.toString(),
                userEmail: user === null || user === void 0 ? void 0 : user.email,
            });
            res.send();
        }
        else {
            console.log(`Unhandled event type ${event.type}`);
            res.send();
        }
    }
    catch (err) {
        console.log(err);
        res.status(500).send(`Webhook Error: ${err}`);
        return;
    }
});
exports.stripe_webhook = stripe_webhook;
// stripe connect
const account_link = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { accountId } = req.body || {};
    try {
        const onboardingLink = yield (0, stripeService_1.getOnboardingLink)(accountId);
        res.status(200).json(onboardingLink);
    }
    catch (error) {
        console.log(error);
        res.status(500).json({
            message: "Internal Server Error",
        });
    }
});
exports.account_link = account_link;
const transfer_funds = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { amountInCents, destinationAccountId } = req.body || {};
    try {
        const transferResponse = yield (0, stripeService_1.transferToConnectedAccount)({
            amountInCents,
            destinationAccountId,
        });
        res.status(200).json(transferResponse);
    }
    catch (error) {
        console.log(error);
        res.status(500).json({
            message: "Internal Server Error",
        });
    }
});
exports.transfer_funds = transfer_funds;
const history = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.user || {};
    if (!(0, mongoose_1.isValidObjectId)(id)) {
        res.status(400).json({
            message: "User Id Invalid",
        });
        return;
    }
    const payments = yield db_1.default.PaymentModel.find({
        userId: id,
    }).sort({ createdAt: -1 });
    res.status(200).json(payments);
});
exports.history = history;
