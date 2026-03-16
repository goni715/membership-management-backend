import { Request, Response } from "express";
import DB from "../db";

const referral_commissions = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const referralCommissions = await DB.ReferralModel.find().sort({
      referralLevel: 1,
    });
    res.status(200).json(referralCommissions);
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

const update_referral_commissions = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id, levelName, commission } = req.body || {};

    await DB.ReferralModel.findByIdAndUpdate(id, {
      levelName,
      commission,
    });

    res.status(200).json({
      message: "Referral commission updated successfully",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

export { referral_commissions, update_referral_commissions };
