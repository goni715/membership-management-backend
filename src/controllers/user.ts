import { Request, Response } from "express";
import DB from "../db";

const users = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page, limit, query } = req?.query || {};
    const searchQuery = query
      ? {
          $or: [
            { name: { $regex: query, $options: "i" } },
            { email: { $regex: query, $options: "i" } },
          ],
        }
      : {};

    const users = await DB.UserModel.find(searchQuery, {
      __v: 0,
      passwordHash: 0,
    })
      .skip((+(page || 1) - 1) * +(limit || 10))
      .limit(+(limit || 10));

    const total = await DB.UserModel.countDocuments(searchQuery);
    const pagination = {
      page: +(page || 1),
      limit: +(limit || 10),
      total,
      totalPages: Math.ceil(total / +(limit || 10)),
    };

    res.status(200).json({ users, pagination });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Internal Server Error",
    });
    return;
  }
};

const toggle_ban = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.query || {};

    const user = await DB.UserModel.findById(id);

    if (!user) {
      res.status(404).json({
        message: "User not found",
      });
      return;
    }

    if (user?.isBanned) {
      await DB.UserModel.findByIdAndUpdate(id, { isBanned: false });
      res.status(200).json({ message: "User unbanned" });
      return;
    } else {
      await DB.UserModel.findByIdAndUpdate(id, { isBanned: true });
      res.status(200).json({ message: "User banned" });
      return;
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Internal Server Error",
    });
    return;
  }
};

export { users, toggle_ban };
