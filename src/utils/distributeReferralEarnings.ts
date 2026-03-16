import { createStripeConnectExpressAccount } from "@services/stripeService";
import DB from "../db";
import { triggerNotification } from "@utils/eventBus";

export default async function distributeReferralEarnings(
  userId: string,
  amount: number
) {
  const user = await DB.UserModel.findById(userId);

  if (!user) return;

  let referrer = await DB.UserModel.findById(user.referredBy);
  let level = 1;

  // Fetch commission rates from DB and create a mapping
  const commissionRatesFromDB = await DB.ReferralModel.find();
  const commissionRates: { [key: number]: number } = {};

  commissionRatesFromDB.forEach((rate) => {
    commissionRates[rate.referralLevel] = rate.commission / 100;
  });

  while (referrer && level <= 3) {
    if (commissionRates[level]) {
      const commission = amount * commissionRates[level];

      // Ensure Stripe Connect account creation is completed first
      if (!referrer.stripeAccountId) {
        const stripeAccount = await createStripeConnectExpressAccount(
          referrer.email
        );

        if (stripeAccount.success) {
          // Save the Stripe Account ID in the database
          await DB.UserModel.findByIdAndUpdate(referrer._id, {
            stripeAccountId: stripeAccount.accountId,
          });
        } else {
          console.error(
            "Failed to create Stripe Connect account for",
            referrer._id
          );
        }
      }

      // Update referrer's earnings
      const referrerUser = await DB.UserModel.findByIdAndUpdate(referrer._id, {
        $inc: { referralEarnings: commission, balance: commission },
      });

      triggerNotification("REFERRAL_COMMISSION", {
        userId: referrerUser?._id.toString(),
        amount: commission,
      });
    }

    // Move to the next level referrer, check if referredBy exists
    if (referrer.referredBy) {
      referrer = await DB.UserModel.findById(referrer.referredBy);
    } else {
      break; // Exit loop if there are no more referrers
    }
    level++;
  }
}
