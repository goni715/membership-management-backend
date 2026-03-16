import { Request as ExpressRequest, Response } from "express";
interface Request extends ExpressRequest {
    user?: any;
}
import DB from "../db";
import { Types } from "mongoose";

const overview = async (req: Request, res: Response): Promise<void> => {
    try {
        const { overview_year } = req.query;
        const year = overview_year
            ? parseInt(overview_year as string)
            : new Date().getFullYear();

        // Get user info
        const user = await DB.UserModel.findById(req.user.id);

        if (!user) {
            res.status(404).json({ message: "User not found" });
            return;
        }

        const userInfo = {
            name: user.name || "",
            photo_url: user.photoUrl || "",
            total_earnings: user.referralEarnings || 0,
        };

        // Unread notifications count
        const unread_notifications_count =
            await DB.NotificationModel.countDocuments({
                recipientId: req.user.id,
                isRead: false,
            });

        // Recursive function to count referrals by month
        const getReferralCountByYear = async (
            userId: Types.ObjectId,
            year: number
        ): Promise<{ [key: number]: number }> => {
            // Fetch user and populate referredUsers to get actual user data
            const user = await DB.UserModel.findById(userId).populate<{
                referredUsers: (typeof DB.UserModel)[];
            }>("referredUsers");

            if (!user || !user.referredUsers) return {};

            const referralCountByMonth: { [key: number]: number } = {};

            for (const referredUser of user.referredUsers) {
                if (
                    !(referredUser instanceof DB.UserModel) ||
                    !referredUser.createdAt
                )
                    continue;

                const createdAtDate = new Date(referredUser.createdAt);
                const createdYear = createdAtDate.getFullYear();
                const createdMonth = createdAtDate.getMonth() + 1; // Months are 0-indexed

                if (createdYear === year) {
                    referralCountByMonth[createdMonth] =
                        (referralCountByMonth[createdMonth] || 0) + 1;
                }

                // Recursively check deeper referrals
                const deeperReferrals = await getReferralCountByYear(
                    referredUser._id as Types.ObjectId,
                    year
                );
                for (const month in deeperReferrals) {
                    referralCountByMonth[parseInt(month)] =
                        (referralCountByMonth[parseInt(month)] || 0) +
                        deeperReferrals[parseInt(month)];
                }
            }

            return referralCountByMonth;
        };

        // Fetch referral data
        const referral_count = await getReferralCountByYear(
            user._id as Types.ObjectId,
            year
        );

        // Ensure all 12 months are present in the response
        const formattedReferralCount = Array.from(
            { length: 12 },
            (_, i) => referral_count[i + 1] || 0
        );

        res.status(200).json({
            ...userInfo,
            unread_notifications_count,
            overview: {
                year,
                referral_count: formattedReferralCount,
            },
        });
    } catch (error) {
        console.error("Error fetching referral overview:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

const referral_history = async (req: Request, res: Response): Promise<void> => {
    const user = await DB.UserModel.findById(req.user.id);

    if (!user) {
        res.status(400).json({
            message: "User not found",
        });
        return;
    }

    // Fetch commission rates dynamically from DB
    const commissionRatesFromDB = await DB.ReferralModel.find();
    const commissionRates: Record<number, number> = {};

    commissionRatesFromDB.forEach((rate: any) => {
        commissionRates[rate.referralLevel] = 10 * (rate.commission / 100); // Convert percentage to fraction
    });

    // Level 1 referrals
    const referredUsersLevel1 = await DB.UserModel.find({
        _id: { $in: user.referredUsers.map((user: any) => user._id) },
    });

    // Level 2 referrals
    const referredUsersLevel2 = await DB.UserModel.find({
        _id: {
            $in: referredUsersLevel1.flatMap((user: any) =>
                user.referredUsers.map((u: any) => u._id)
            ),
        },
    });

    // Level 3 referrals
    const referredUsersLevel3 = await DB.UserModel.find({
        _id: {
            $in: referredUsersLevel2.flatMap((user: any) =>
                user.referredUsers.map((u: any) => u._id)
            ),
        },
    });

    const mappedUsers = [
        ...referredUsersLevel1.map((user: any) => ({
            name: user.name || "",
            photoUrl: user.photoUrl || "",
            createdAt: user.createdAt || new Date(),
            commission: commissionRates[1],
            active: user.isSubscribed || false,
        })),
        ...referredUsersLevel2.map((user: any) => ({
            name: user.name || "",
            photoUrl: user.photoUrl || "",
            createdAt: user.createdAt || new Date(),
            commission: commissionRates[2],
            active: user.isSubscribed || false,
        })),
        ...referredUsersLevel3.map((user: any) => ({
            name: user.name || "",
            photoUrl: user.photoUrl || "",
            createdAt: user.createdAt || new Date(),
            commission: commissionRates[3],
            active: user.isSubscribed || false,
        })),
    ];

    res.status(200).json(mappedUsers);
};

const admin_overview_utils = {
    basic_stats: async () => {
        const [total_users, active_users, total_referrals, total_income] =
            await Promise.all([
                DB.UserModel.countDocuments(),
                DB.UserModel.countDocuments({ isSubscribed: true }),
                DB.UserModel.aggregate([
                    { $unwind: "$referredUsers" },
                    { $count: "total" },
                ]).then((result) => (result[0] ? result[0].total : 0)),
                DB.PaymentModel.aggregate([
                    { $group: { _id: null, total: { $sum: "$amount" } } },
                    { $project: { _id: 0, total: 1 } },
                ]).then((result) => (result[0] ? result[0].total : 0)),
            ]);

        return { total_users, active_users, total_referrals, total_income };
    },
    income_overview: async (income_year: any) => {
        const income_overview = await DB.PaymentModel.aggregate([
            {
                $match: {
                    createdAt: {
                        $gte: new Date(`${income_year}-01-01`),
                        $lt: new Date(`${income_year}-12-31`),
                    },
                },
            },
            {
                $group: {
                    _id: { $month: "$createdAt" },
                    total: { $sum: "$amount" },
                },
            },
            {
                $sort: { _id: 1 },
            },
        ]);

        const formattedIncomeOverview = Array(12).fill(0);
        income_overview.forEach((data) => {
            formattedIncomeOverview[data._id - 1] = data.total;
        });
        return {
            year: income_year,
            overview: formattedIncomeOverview,
        };
    },
    user_overview: async (user_year: any) => {
        const user_overview = await DB.UserModel.aggregate([
            {
                $match: {
                    createdAt: {
                        $gte: new Date(`${user_year}-01-01`),
                        $lt: new Date(`${user_year}-12-31`),
                    },
                },
            },
            {
                $group: {
                    _id: { $month: "$createdAt" },
                    count: { $sum: 1 },
                },
            },
            {
                $sort: { _id: 1 },
            },
        ]);

        const formattedUserOverview = Array(12).fill(0);
        user_overview.forEach((data) => {
            formattedUserOverview[data._id - 1] = data.count;
        });

        return {
            year: user_year,
            overview: formattedUserOverview,
        };
    },
    referral_overview: async () => {
        const users = await DB.UserModel.find(
            {},
            {
                createdAt: 1,
                _id: 1,
                name: 1,
                photoUrl: 1,
                referredBy: 1,
            }
        );

        const relations: any[] = [];

        const findRelations = async () => {
            await Promise.all(
                users.map(async (referrer) => {
                    const findDownstreamChain = async (
                        currentUserId: string,
                        level = 1
                    ) => {
                        const directReferrals = await DB.UserModel.find(
                            { referredBy: currentUserId },
                            {
                                createdAt: 1,
                                _id: 1,
                                name: 1,
                                photoUrl: 1,
                                referredBy: 1,
                            }
                        );

                        await Promise.all(
                            directReferrals.map(async (referee) => {
                                relations.push({
                                    createdAt: referee.createdAt,
                                    referredBy: {
                                        name: referrer.name,
                                        photoUrl: referrer.photoUrl,
                                    },
                                    referee: {
                                        name: referee.name,
                                        photoUrl: referee.photoUrl,
                                    },
                                    referral_level: level,
                                });

                                await findDownstreamChain(
                                    referee._id.toString(),
                                    level + 1
                                );
                            })
                        );
                    };

                    await findDownstreamChain(referrer._id.toString());
                })
            );
        };

        await findRelations();

        relations.sort((a, b) => a.createdAt - b.createdAt);
        return relations.slice(0, 5);
    },
    top_referrers: async () => {
        const topReferrers = await DB.UserModel.aggregate([
            {
                $project: {
                    name: 1,
                    photoUrl: 1,
                    totalReferrals: { $size: "$referredUsers" },
                },
            },
            { $match: { totalReferrals: { $gt: 0 } } },
            { $sort: { totalReferrals: -1 } },
        ]);

        return topReferrers
            .map((referrer) => ({
                name: referrer.name,
                photoUrl: referrer.photoUrl,
                totalReferrals: referrer.totalReferrals,
            }))
            .slice(0, 5);
    },
};

const admin_overview = async (req: Request, res: Response): Promise<void> => {
    const income_year =
        req?.query?.income_year || new Date().getFullYear().toString();
    const user_year =
        req?.query?.user_year || new Date().getFullYear().toString();

    const unread_notification_count = await DB.NotificationModel.countDocuments(
        {
            isRead: false,
            recipientRole: "admin",
        }
    );

    res.status(200).json({
        unread_notification_count,
        basic_stats: await admin_overview_utils.basic_stats(),
        income_overview: await admin_overview_utils.income_overview(
            income_year
        ),
        user_overview: await admin_overview_utils.user_overview(user_year),
        referral_overview: await admin_overview_utils.referral_overview(),
        top_referrers: await admin_overview_utils.top_referrers(),
    });
};

const referral_overview = async (
    req: Request,
    res: Response
): Promise<void> => {
    const { page, limit, query } = req.query;

    const searchParams: any = {};

    if (query) {
        searchParams.$or = [{ name: { $regex: query, $options: "i" } }];
    }

    const users = await DB.UserModel.find(searchParams, {
        createdAt: 1,
        _id: 1,
        name: 1,
        photoUrl: 1,
        referredBy: 1,
    });

    const relations: any[] = [];

    const findRelations = async () => {
        await Promise.all(
            users.map(async (referrer) => {
                const findDownstreamChain = async (
                    currentUserId: string,
                    level = 1
                ) => {
                    const directReferrals = await DB.UserModel.find(
                        {
                            referredBy: currentUserId,
                        },
                        {
                            createdAt: 1,
                            _id: 1,
                            name: 1,
                            photoUrl: 1,
                            referredBy: 1,
                        }
                    );

                    await Promise.all(
                        directReferrals.map(async (referee) => {
                            relations.push({
                                createdAt: referee.createdAt,
                                referredBy: {
                                    name: referrer.name,
                                    photoUrl: referrer.photoUrl,
                                },
                                referee: {
                                    name: referee.name,
                                    photoUrl: referee.photoUrl,
                                },
                                referral_level: level,
                            });

                            await findDownstreamChain(
                                referee._id.toString(),
                                level + 1
                            );
                        })
                    );
                };

                await findDownstreamChain(referrer._id.toString());
            })
        );
    };

    await findRelations();

    relations.sort((a, b) => a.createdAt - b.createdAt);

    const startIndex = (+(page || 1) - 1) * +(limit || 10);
    const endIndex = startIndex + +(limit || 10);

    const paginatedRelations = relations.slice(startIndex, endIndex);

    const pagination = {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total: relations.length,
        totalPages: Math.ceil(relations.length / parseInt(limit as string)),
    };

    res.status(200).json({ referrals: paginatedRelations, pagination });
};

const notification_count = async (
    req: Request,
    res: Response
): Promise<void> => {
    const unread_notification_count = await DB.NotificationModel.countDocuments(
        {
            isRead: false,
            recipientRole: "admin",
        }
    );

    res.status(200).json(unread_notification_count);
};

export {
    overview,
    referral_history,
    admin_overview,
    referral_overview,
    notification_count,
};
