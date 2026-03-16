import { Request as ExpressRequest, Response } from "express";
interface Request extends ExpressRequest {
  user?: any;
}
import { config } from "dotenv";
import DB from "../db";
import uploadService from "@services/uploadService";
import { compare, hash } from "bcrypt";
import { triggerNotification } from "@utils/eventBus";

config();

const profile = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.user;

  try {
    const user = await DB.UserModel.findById(id, {
      photoUrl: 1,
      name: 1,
      email: 1,
      phoneNumber: 1,
      dateOfBirth: 1,
      gender: 1,
      referralCode: 1,
      _id: 1,
    });

    res.status(200).json({
      photoUrl: user?.photoUrl || null,
      name: user?.name || null,
      email: user?.email || null,
      phoneNumber: user?.phoneNumber || null,
      dateOfBirth: user?.dateOfBirth || null,
      gender: user?.gender || null,
      referralCode: user?.referralCode || null,
      _id: user?._id || null,
    });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

const update_profile = async (req: Request, res: Response): Promise<void> => {
  try {
    // check if the user exists
    const { id } = req.user;

    const user = await DB.UserModel.findById(id);

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    const { name, phone, date_of_birth, gender, address, email } = req.body;

    const update = {} as any;

    if (name) {
      update.name = name;
    }

    if (phone) {
      update.phoneNumber = phone;
    }

    if (date_of_birth) {
      const [day, month, year] = date_of_birth.split("/").map(Number);
      update.dateOfBirth = new Date(year, month - 1, day);
    }

    if (gender) {
      update.gender = gender;
    }

    if (address) {
      update.address = address;
    }

    if (email) {
      update.email = email;
    }

    // check for photo upload
    const photo = req.file;

    if (photo) {
      const photoUrl = await uploadService(photo, "image");

      if (!photoUrl) {
        res.status(500).json({ message: "Error uploading photo" });
        return;
      }

      update.photoUrl = photoUrl;
    }

    // update the user profile
    await DB.UserModel.findByIdAndUpdate(id, update);
    res.status(200).json({
      message: "Profile updated successfully",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const delete_account = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.user;

    // check if the user exists
    const user = await DB.UserModel.findById(id);

    if (!user || user.accountStatus === "deleted") {
      res.status(404).json({ message: "User not found" });
      return;
    }

    // update user accountStatus to deleted
    await DB.UserModel.findByIdAndUpdate(id, { accountStatus: "deleted" });
    triggerNotification("ACCOUNT_DELETED", { userEmail: user?.email });

    res.status(200).json({ message: "Account deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

const change_password = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.user;
  const { old_password, new_password } = req.body;

  // check if the user exists
  const user = await DB.UserModel.findById(id);

  if (!user) {
    res.status(404).json({ message: "User not found" });
    return;
  }

  // check if the old password is correct
  const isPasswordValid = await new Promise((resolve, reject) => {
    compare(old_password, user.passwordHash, (err, result) => {
      if (err) {
        reject(err);
      }

      resolve(result);
    });
  });

  if (!isPasswordValid) {
    res.status(400).json({ message: "Old password is incorrect" });
    return;
  }

  const newPasswordHash = await hash(
    new_password,
    Number(process.env.SALT_ROUNDS) || 10
  );

  await DB.UserModel.findByIdAndUpdate(id, { passwordHash: newPasswordHash });
  res.status(200).json({ message: "Password changed successfully" });
};

export { profile, update_profile, delete_account, change_password };
