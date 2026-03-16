import { sendEmail } from "@services/emailService";
import Schema from "../schema";

export async function sendVerificationEmail(
  email: string,
  otp: string,
  type: string
) {
  try {
    const mailResponse = await sendEmail({
      to: email,
      subject: "Verification Email",
      html: `<h1>Please confirm your OTP for ${type}</h1>
             <p>Here is your OTP code: ${otp}</p>`,
    });
    console.log("Email sent successfully: ", mailResponse);
  } catch (error) {
    console.log("Error occurred while sending email: ", error);
    throw error;
  }
}

export function attachOTPHooks() {
  Schema.OTP.pre("save", async function (next) {
    console.log("New OTP saved to the database");
    if (this.isNew) {
      await sendVerificationEmail(this.email, this.otp, this.type);
    }
    next();
  });
}

export const OTPTypes = {
  SIGNUP: "signup",
  FORGOT_PASSWORD: "forgot_password",
};
