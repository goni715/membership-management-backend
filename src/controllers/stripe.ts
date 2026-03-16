import {
  createCheckoutSession,
  getOnboardingLink,
  transferToConnectedAccount,
} from "@services/stripeService";
import distributeReferralEarnings from "@utils/distributeReferralEarnings";
import { triggerNotification } from "@utils/eventBus";
import { Request, Response } from "express";
import { isValidObjectId } from "mongoose";
import DB from "../db";
import Stripe from "stripe";

// subscription
const create_payment = async (req: Request, res: Response): Promise<void> => {
  const { userId } = req.body || {};

  if (!isValidObjectId(userId)) {
    res.status(400).json({
      message: "User Id Invalid",
    });
    return;
  }

  const user = await DB.UserModel.findById(userId);

  if (!user) {
    res.status(400).json({
      message: "User not found",
    });
    return;
  }

  try {
    const session = (await createCheckoutSession({
      userId,
    })) as Stripe.Checkout.Session;

    res.status(200).json({ url: session.url });
  } catch (error) {
    console.log(error);
    res.status(200).json({ message: error });
  }
};

const stripe_webhook = async (req: Request, res: Response): Promise<void> => {
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
    const event = Stripe.webhooks.constructEvent(req.body, sig, webhook_secret);

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;

      if (!session.client_reference_id) {
        console.log("User ID missing");
        res.send();
        return;
      }

      await DB.PaymentModel.create({
        amount: (session.amount_total ?? 0) / 100,
        createdAt: new Date(session.created * 1000),
        paymentId: session.id,
        paymentStatus: session.payment_status,
        userId: session.client_reference_id,
      });

      const user = await DB.UserModel.findByIdAndUpdate(
        session.client_reference_id,
        {
          isSubscribed: true,
          subscriptionExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30-day subscription period
        }
      );

      // distribute referral commissions to refferers
      distributeReferralEarnings(
        session.client_reference_id,
        (session.amount_total ?? 0) / 100
      );

      triggerNotification("PAYMENT_SUCCESS", {
        userId: user?._id.toString(),
        userEmail: user?.email,
      });

      res.send();
    } else if (event.type === "account.external_account.created") {
      const user = await DB.UserModel.findOneAndUpdate(
        { stripeAccountId: event.account },
        {
          stripeOnboardingDone: true,
        }
      );

      triggerNotification("ACCOUNT_ONBOARDED", {
        userId: user?._id.toString(),
        userEmail: user?.email,
      });

      res.send();
    } else {
      console.log(`Unhandled event type ${event.type}`);
      res.send();
    }
  } catch (err) {
    console.log(err);
    res.status(500).send(`Webhook Error: ${err}`);
    return;
  }
};

// stripe connect
const account_link = async (req: Request, res: Response): Promise<void> => {
  const { accountId } = req.body || {};

  try {
    const onboardingLink = await getOnboardingLink(accountId);
    res.status(200).json(onboardingLink);
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

const transfer_funds = async (req: Request, res: Response): Promise<void> => {
  const { amountInCents, destinationAccountId } = req.body || {};

  try {
    const transferResponse = await transferToConnectedAccount({
      amountInCents,
      destinationAccountId,
    });
    res.status(200).json(transferResponse);
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

interface AuthenticatedRequest extends Request {
  user?: any;
}

const history = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const { id } = req.user || {};

  if (!isValidObjectId(id)) {
    res.status(400).json({
      message: "User Id Invalid",
    });
    return;
  }

  const payments = await DB.PaymentModel.find({
    userId: id,
  }).sort({ createdAt: -1 });

  res.status(200).json(payments);
};

export {
  create_payment,
  stripe_webhook,
  account_link,
  transfer_funds,
  history,
};
