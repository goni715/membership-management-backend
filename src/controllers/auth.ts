import type { Request, Response } from "express";
import { validate } from "email-validator";
import { StatusCodes } from "http-status-codes";
import DB from "../db";
import { compare, hash } from "bcrypt";
import { generate } from "otp-generator";
import { JwtPayload, sign, verify } from "jsonwebtoken";
import { OTPTypes } from "@services/otpService";
import { config } from "dotenv";
import { triggerNotification } from "@utils/eventBus";
import { v4 } from "uuid";
import checkSubscriptionStatus from "@utils/checkSubscriptionStatus";

config();

const ENV = process.env.NODE_ENV;

const signup = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      name,
      email: emailFromBody,
      password,
      referralCode,
    } = req.body || {};

    // Validate input
    if (!name || !emailFromBody || !password) {
      res.status(StatusCodes.BAD_REQUEST).json({
        message: "Name, Email, and Password are required",
      });
      return;
    }

    // normalize email
    const email = emailFromBody.trim().toLowerCase();

    // Validate email format
    if (!validate(email)) {
      res.status(StatusCodes.BAD_REQUEST).json({
        message: "Email is not valid",
      });
    }

    // Check if email already exists
    const existingUser = await DB.UserModel.findOne({ email }).exec();
    if (existingUser) {
      res.status(StatusCodes.CONFLICT).json({
        message: `User with the email ${email} already exists.`,
      });
      return;
    }

    let referrer = null;
    if (referralCode) {
      referrer = await DB.UserModel.findOne({ referralCode }).exec();
      if (!referrer) {
        res.status(StatusCodes.BAD_REQUEST).json({
          message: "Invalid referral code.",
        });
        return;
      }
    }

    // Hash password
    const passwordHash = await hash(
      password,
      Number(process.env.SALT_ROUNDS) || 10
    );

    // Generate a unique referral code for the new user
    let newReferralCode = v4().replace(/-/g, "").slice(0, 10).toUpperCase();
    while (await DB.UserModel.findOne({ referralCode: newReferralCode })) {
      newReferralCode = v4().replace(/-/g, "").slice(0, 10).toUpperCase();
    }

    const newUser = new DB.UserModel({
      name,
      email,
      passwordHash,
      referralCode: newReferralCode,
      referredBy: referrer ? referrer._id : null,
    });

    await newUser.save();

    // If the user has a referrer, update their `referredUsers` array
    if (referrer) {
      await DB.UserModel.findByIdAndUpdate(referrer._id, {
        $push: { referredUsers: newUser._id },
      });
    }

    // handle otp
    const otpParams = {
      upperCaseAlphabets: false,
      lowerCaseAlphabets: false,
      specialChars: false,
    };
    let otp = generate(6, otpParams);
    let result = await DB.OTPModel.findOne({ otp: otp });
    while (result) {
      otp = generate(6, otpParams);
      result = await DB.OTPModel.findOne({ otp: otp });
    }

    await DB.OTPModel.create({ email, otp, type: OTPTypes.SIGNUP });

    triggerNotification("USER_SIGNUP", { userId: newUser?._id.toString() });

    const response: { success: boolean; message: string; otp?: string } = {
      success: true,
      message: "OTP sent successfully",
    };

    if (ENV === "development") {
      response.otp = otp;
    }

    res.status(200).json(response);
  } catch (error: any) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: error.message || "Internal Server Error",
    });
  }
};

const resend = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email: emailFromBody, type } = req.body || {};

    // normalize email
    const email = emailFromBody.trim().toLowerCase();

    // Check if email already exists
    const existingUser = await DB.UserModel.findOne({ email }).exec();
    if (!existingUser) {
      res.status(StatusCodes.CONFLICT).json({
        message: `User with the email ${email} doesn't exist.`,
      });
      return;
    }
    if (existingUser.emailVerified) {
      res.status(StatusCodes.CONFLICT).json({
        message: `This user is already verified.`,
      });
      return;
    }

    const otpParams = {
      upperCaseAlphabets: false,
      lowerCaseAlphabets: false,
      specialChars: false,
    };
    let otp = generate(6, otpParams);
    let result = await DB.OTPModel.findOne({ otp: otp });
    while (result) {
      otp = generate(6, otpParams);
      result = await DB.OTPModel.findOne({ otp: otp });
    }

    await DB.OTPModel.create({ email, otp, type });

    const response: { success: boolean; message: string; otp?: string } = {
      success: true,
      message: "OTP sent successfully",
    };

    if (ENV === "development") {
      response.otp = otp;
    }

    res.status(200).json(response);
  } catch (error: any) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: error.message || "Internal Server Error",
    });
  }
};

const validate_otp = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email: emailFromBody, otp } = req.body || {};

    if (!emailFromBody || !otp) {
      res.status(StatusCodes.BAD_REQUEST).json({
        message: "Email and OTP are required",
      });
      return;
    }

    // normalize email
    const email = emailFromBody.trim().toLowerCase();

    // Find the most recent OTP for the email
    const response = await DB.OTPModel.find({ email })
      .sort({ createdAt: -1 })
      .limit(1);
    if (response.length === 0 || otp !== response[0].otp) {
      res.status(400).json({
        message: "The OTP is not valid",
      });
      return;
    }

    // delete otp document after verification
    await DB.OTPModel.deleteMany({ email });

    // Update user account status
    // even if its not a signup OTP, we can update the account status
    // because the only way to validate OTP is through the email
    await DB.UserModel.updateOne({ email }, { $set: { emailVerified: true } });

    const user = await DB.UserModel.findOne({ email });
    triggerNotification("EMAIL_VERIFIED", { userId: user?._id.toString() });

    if (response[0].type === OTPTypes.FORGOT_PASSWORD) {
      const passwordResetToken = sign(
        { email, purpose: "password_reset" },
        process.env.PASSWORD_RESET_SECRET || "fallback_secret",
        { expiresIn: "10m" }
      );

      res.status(200).json({
        message: "OTP verified successfully",
        success: true,
        passwordResetToken,
      });
      return;
    }

    res.status(StatusCodes.OK).json({
      message: `Email ${email} verified successfully`,
      success: true,
    });
  } catch (error: any) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: error.message || "Internal Server Error",
    });
  }
};

const forgot_password = async (req: Request, res: Response): Promise<void> => {
  const { email: emailFromBody } = req.body || {};

  // normalize email
  const email = emailFromBody.trim().toLowerCase();

  const existingUser = await DB.UserModel.findOne({ email }).exec();
  if (!existingUser) {
    res.status(StatusCodes.CONFLICT).json({
      message: `User with the email ${email} doesn't exist.`,
    });
    return;
  }

  const otpParams = {
    upperCaseAlphabets: false,
    lowerCaseAlphabets: false,
    specialChars: false,
  };
  let otp = generate(6, otpParams);
  let result = await DB.OTPModel.findOne({ otp: otp });
  while (result) {
    otp = generate(6, otpParams);
    result = await DB.OTPModel.findOne({ otp: otp });
  }

  await DB.OTPModel.create({ email, otp, type: OTPTypes.FORGOT_PASSWORD });

  const response: { success: boolean; message: string; otp?: string } = {
    success: true,
    message: "OTP for resetting the password sent successfully",
  };

  if (ENV === "development") {
    response.otp = otp;
  }

  res.status(200).json(response);
};

const update_password = async (req: Request, res: Response): Promise<void> => {
  const { password } = req?.body || {};
  const passwordResetToken = req.headers.authorization?.split(" ")[1];

  if (!passwordResetToken) {
    res.status(401).json({ message: "Unauthorized. Missing token." });
    return;
  }

  // Verify JWT
  let decoded: JwtPayload;
  try {
    decoded = verify(
      passwordResetToken,
      process.env.PASSWORD_RESET_SECRET || "fallback_secret"
    ) as JwtPayload;
  } catch (err) {
    res.status(403).json({ message: "Invalid or expired token." });
    return;
  }

  if (!decoded?.purpose || decoded?.purpose !== "password_reset") {
    res.status(403).json({ message: "Invalid token purpose." });
    return;
  }

  const email = decoded?.email;

  const existingUser = await DB.UserModel.findOne({ email }).exec();
  if (!existingUser) {
    res.status(StatusCodes.CONFLICT).json({
      message: `User with the email ${email} doesn't exist.`,
    });
    return;
  }

  // Hash password
  const passwordHash = await hash(
    password,
    Number(process.env.SALT_ROUNDS) || 10
  );

  await DB.UserModel.updateOne({ email }, { $set: { passwordHash } });

  triggerNotification("PASSWORD_UPDATE", {
    userId: existingUser?._id.toString(),
  });

  res.status(StatusCodes.OK).json({
    message: "Password updated successfully",
  });
};

const signin = async (req: Request, res: Response): Promise<void> => {
  const { email: emailFromBody, password, remember_me } = req.body || {};

  // normalize email
  const email = emailFromBody.trim().toLowerCase();

  // check if email password matches with DB
  const user = await DB.UserModel.findOne({ email }).exec();
  if (!user) {
    res.status(StatusCodes.NOT_FOUND).json({
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
  checkSubscriptionStatus(user._id.toString());

  // Compare passwords
  const isMatch = await compare(password, user.passwordHash);
  if (!isMatch) {
    res.status(StatusCodes.CONFLICT).json({
      message: "Password is incorrect",
    });

    return;
  }

  // Generate tokens
  const accessToken = sign(
    { email, userId: user._id, role: user.role },
    process.env.ACCESS_TOKEN_SECRET || "fallback_secret",
    { expiresIn: "1d" }
  );

  const refreshToken = sign(
    { email, userId: user._id, role: user.role },
    process.env.REFRESH_TOKEN_SECRET || "fallback_secret",
    { expiresIn: remember_me ? "30d" : "10m" }
  );

  res.status(StatusCodes.OK).json({
    message: "Login successful",
    accessToken,
    refreshToken,
  });
};

const refresh_token = async (req: Request, res: Response): Promise<void> => {
  // get jwt from header
  const jwt = req.headers.authorization?.split(" ")[1];

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
  verify(jwt, secret, async (err, decoded) => {
    if (err) {
      res.status(401).json({ message: "Unauthorized" });
    } else {
      if (decoded) {
        checkSubscriptionStatus((decoded as JwtPayload).userId);

        const accessToken = sign(
          {
            email: (decoded as JwtPayload).email,
            userId: (decoded as JwtPayload).userId,
            role: (decoded as JwtPayload).role,
          },
          process.env.ACCESS_TOKEN_SECRET || "fallback_secret",
          { expiresIn: "2m" }
        );

        res.status(StatusCodes.OK).json({
          message: "Token refreshed successfully",
          accessToken,
        });
      } else {
        res.status(401).json({ message: "Unauthorized" });
      }
    }
  });
};

export {
  signup,
  resend,
  validate_otp,
  forgot_password,
  update_password,
  signin,
  refresh_token,
};
