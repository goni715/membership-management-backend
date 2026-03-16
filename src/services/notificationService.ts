import { eventBus, sendNotification } from "@utils/eventBus";

export const EVENTS = {
  // Auth
  USER_SIGNUP: "USER_SIGNUP", // admin & user
  EMAIL_VERIFIED: "EMAIL_VERIFIED", // admin & user
  PASSWORD_UPDATE: "PASSWORD_UPDATE", // user

  // User
  ACCOUNT_DELETED: "ACCOUNT_DELETED", // admin

  // Stripe
  PAYMENT_SUCCESS: "PAYMENT_SUCCESS", // admin & user
  ACCOUNT_ONBOARDED: "ACCOUNT_ONBOARDED", // admin & user

  // Referral
  REFERRAL_COMMISSION: "REFERRAL_COMMISSION", // user

  // Payments
  WITHDRAWAL_REQUESTED: "WITHDRAWAL_REQUESTED", // admin & user
  WITHDRAWAL_APPROVED: "WITHDRAWAL_APPROVED", // admin & user
  WITHDRAWAL_REJECTED: "WITHDRAWAL_REJECTED", // admin & user
  WITHDRAWAL_SUCCESS: "WITHDRAWAL_SUCCESS", // admin & user
  WITHDRAWAL_FAILED: "WITHDRAWAL_FAILED", // admin & user
};

// user_signup // admin & user
eventBus.on(EVENTS.USER_SIGNUP, async (data) => {
  console.log("User signup event triggered:", data);

  await Promise.all([
    sendNotification({
      recipientId: data.userId,
      recipientRole: "user",
      title: "Welcome to Avantra!",
      description: "Your account has been successfully created.",
      type: "info",
    }),
    sendNotification({
      // recipientId: "admin",
      recipientRole: "admin",
      title: "New User Signup",
      description: "A new user has signed up.",
      type: "info",
    }),
  ]);
});

// email_verified // admin & user
eventBus.on(EVENTS.EMAIL_VERIFIED, async (data) => {
  await Promise.all([
    sendNotification({
      recipientId: data.userId,
      recipientRole: "user",
      title: "Email Verified!",
      description: "Your email has been successfully verified.",
      type: "success",
    }),
    sendNotification({
      // recipientId: "admin",
      recipientRole: "admin",
      title: "Email Verified!",
      description: "A user has verified their email.",
      type: "success",
    }),
  ]);
});

// password_update // user
eventBus.on(EVENTS.PASSWORD_UPDATE, async (data) => {
  await Promise.all([
    sendNotification({
      recipientId: data.userId,
      title: "Password Updated Successfully",
      description:
        "Your account password has been updated successfully. If you did not make this change, please reset your password immediately.",
      type: "success",
      recipientRole: "user",
    }),
  ]);
});

// account_deleted // admin
eventBus.on(EVENTS.ACCOUNT_DELETED, async (data) => {
  await Promise.all([
    sendNotification({
      // recipientId: "admin",
      title: "User Account Deleted",
      description: `The account associated with ${data.userEmail} has been deleted. Review the details if necessary.`,
      type: "warning",
      recipientRole: "admin",
    }),
  ]);
});

// payment_success // admin & user
eventBus.on(EVENTS.PAYMENT_SUCCESS, async (data) => {
  await Promise.all([
    sendNotification({
      recipientId: data.userId,
      title: "Payment Successful",
      description: `Your payment has been successful.`,
      type: "success",
      recipientRole: "user",
    }),
    sendNotification({
      // recipientId: "admin",
      title: "Payment Successful",
      description: `The payment associated with ${data.userEmail} has been successful. Review the details if necessary.`,
      type: "success",
      recipientRole: "admin",
    }),
  ]);
});

// account_onboarded // admin & user
eventBus.on(EVENTS.ACCOUNT_ONBOARDED, async (data) => {
  await Promise.all([
    sendNotification({
      recipientId: data.userId,
      title: "Stripe Account Onboarded",
      description: `Your Stripe account has been successfully onboarded.`,
      type: "success",
      recipientRole: "user",
    }),
    sendNotification({
      // recipientId: "admin",
      title: "Stripe Account Onboarded",
      description: `The Stripe account associated with ${data.userEmail} has been onboarded. Review the details if necessary.`,
      type: "success",
      recipientRole: "admin",
    }),
  ]);
});

// referral_commission // user
eventBus.on(EVENTS.REFERRAL_COMMISSION, async (data) => {
  await Promise.all([
    sendNotification({
      recipientId: data.userId,
      title: "Referral Commission",
      description: `You have received a referral commission of ${data.amount}.`,
      type: "success",
      recipientRole: "user",
    }),
  ]);
});

// withdrawal_requested // admin & user
eventBus.on(EVENTS.WITHDRAWAL_REQUESTED, async (data) => {
  await Promise.all([
    sendNotification({
      recipientId: data.userId,
      title: "Withdrawal Requested",
      description: `Your withdrawal request has been successfully submitted.`,
      type: "info",
      recipientRole: "user",
    }),
    sendNotification({
      // recipientId: "admin",
      title: "Withdrawal Requested",
      description: `The withdrawal associated with ${data.userEmail} has been requested. Review the details if necessary.`,
      type: "info",
      recipientRole: "admin",
    }),
  ]);
});

// withdrawal_approved // admin & user
eventBus.on(EVENTS.WITHDRAWAL_APPROVED, async (data) => {
  await Promise.all([
    sendNotification({
      recipientId: data.userId,
      title: "Withdrawal Approved",
      description: `Your withdrawal has been approved.`,
      type: "success",
      recipientRole: "user",
    }),
    sendNotification({
      // recipientId: "admin",
      title: "Withdrawal Approved",
      description: `The withdrawal associated with ${data.userEmail} has been approved. Review the details if necessary.`,
      type: "success",
      recipientRole: "admin",
    }),
  ]);
});

// withdrawal_rejected // admin & user
eventBus.on(EVENTS.WITHDRAWAL_REJECTED, async (data) => {
  await Promise.all([
    sendNotification({
      recipientId: data.userId,
      title: "Withdrawal Rejected",
      description: `Your withdrawal has been rejected.`,
      type: "error",
      recipientRole: "user",
    }),
    sendNotification({
      // recipientId: "admin",
      title: "Withdrawal Rejected",
      description: `The withdrawal associated with ${data.userEmail} has been rejected. Review the details if necessary.`,
      type: "error",
      recipientRole: "admin",
    }),
  ]);
});

// withdrawal_success // admin & user
eventBus.on(EVENTS.WITHDRAWAL_SUCCESS, async (data) => {
  await Promise.all([
    sendNotification({
      recipientId: data.userId,
      title: "Withdrawal Successful",
      description: `Your withdrawal has been successfully completed.`,
      type: "success",
      recipientRole: "user",
    }),
    sendNotification({
      // recipientId: "admin",
      title: "Withdrawal Successful",
      description: `The withdrawal associated with ${data.userEmail} has been successfully completed. Review the details if necessary.`,
      type: "success",
      recipientRole: "admin",
    }),
  ]);
});

// withdrawal_failed // admin & user
eventBus.on(EVENTS.WITHDRAWAL_FAILED, async (data) => {
  await Promise.all([
    sendNotification({
      recipientId: data.userId,
      title: "Withdrawal Failed",
      description: `Your withdrawal has failed. Please contact support for assistance.`,
      type: "error",
      recipientRole: "user",
    }),
    sendNotification({
      // recipientId: "admin",
      title: "Withdrawal Failed",
      description: `The withdrawal associated with ${data.userEmail} has failed. Review the details if necessary.`,
      type: "error",
      recipientRole: "admin",
    }),
  ]);
});
