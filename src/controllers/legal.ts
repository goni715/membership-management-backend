import { Request, Response } from "express";
import DB from "../db";
import { triggerNotification } from "@utils/eventBus";

const privacy_policy = async (req: Request, res: Response): Promise<void> => {
  try {
    const policy = await DB.LegalModel.findOne(
      { type: "privacy_policy" },
      { __v: 0 }
    );
    if (!policy) {
      res.status(404).json({ message: "Privacy Policy not found" });
      return;
    }
    res.json(policy);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

const update_privacy_policy = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { content } = req.body;
    const updatedTerms = await DB.LegalModel.findOneAndUpdate(
      { type: "privacy_policy" },
      { content, updatedAt: Date.now() },
      { new: true, upsert: true }
    );
    res.status(200).json({ message: "Privacy Policy updated", updatedTerms });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

const terms = async (req: Request, res: Response): Promise<void> => {
  try {
    const terms = await DB.LegalModel.findOne(
      { type: "terms_conditions" },
      { __v: 0 }
    );
    if (!terms) {
      res.status(404).json({ message: "Terms & Conditions not found" });
      return;
    }
    res.json(terms);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

const update_terms = async (req: Request, res: Response): Promise<void> => {
  try {
    const { content } = req.body;
    const updatedTerms = await DB.LegalModel.findOneAndUpdate(
      { type: "terms_conditions" },
      { content, updatedAt: Date.now() },
      { new: true, upsert: true }
    );
    res.json({ message: "Terms & Conditions updated", updatedTerms });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

export { privacy_policy, update_privacy_policy, terms, update_terms };
