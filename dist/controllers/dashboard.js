"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.notification_count = exports.referral_overview = exports.admin_overview = exports.referral_history = exports.overview = void 0;
const db_1 = __importDefault(require("../db"));
const overview = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { overview_year } = req.query;
        const year = overview_year
            ? parseInt(overview_year)
            : new Date().getFullYear();
        // Get user info
        const user = yield db_1.default.UserModel.findById(req.user.id);
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
        const unread_notifications_count = yield db_1.default.NotificationModel.countDocuments({
            recipientId: req.user.id,
            isRead: false,
        });
        // Recursive function to count referrals by month
        const getReferralCountByYear = (userId, year) => __awaiter(void 0, void 0, void 0, function* () {
            // Fetch user and populate referredUsers to get actual user data
            const user = yield db_1.default.UserModel.findById(userId).populate("referredUsers");
            if (!user || !user.referredUsers)
                return {};
            const referralCountByMonth = {};
            for (const referredUser of user.referredUsers) {
                if (!(referredUser instanceof db_1.default.UserModel) ||
                    !referredUser.createdAt)
                    continue;
                const createdAtDate = new Date(referredUser.createdAt);
                const createdYear = createdAtDate.getFullYear();
                const createdMonth = createdAtDate.getMonth() + 1; // Months are 0-indexed
                if (createdYear === year) {
                    referralCountByMonth[createdMonth] =
                        (referralCountByMonth[createdMonth] || 0) + 1;
                }
                // Recursively check deeper referrals
                const deeperReferrals = yield getReferralCountByYear(referredUser._id, year);
                for (const month in deeperReferrals) {
                    referralCountByMonth[parseInt(month)] =
                        (referralCountByMonth[parseInt(month)] || 0) +
                            deeperReferrals[parseInt(month)];
                }
            }
            return referralCountByMonth;
        });
        // Fetch referral data
        const referral_count = yield getReferralCountByYear(user._id, year);
        // Ensure all 12 months are present in the response
        const formattedReferralCount = Array.from({ length: 12 }, (_, i) => referral_count[i + 1] || 0);
        res.status(200).json(Object.assign(Object.assign({}, userInfo), { unread_notifications_count, overview: {
                year,
                referral_count: formattedReferralCount,
            } }));
    }
    catch (error) {
        console.error("Error fetching referral overview:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});
exports.overview = overview;
const referral_history = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield db_1.default.UserModel.findById(req.user.id);
    if (!user) {
        res.status(400).json({
            message: "User not found",
        });
        return;
    }
    // Fetch commission rates dynamically from DB
    const commissionRatesFromDB = yield db_1.default.ReferralModel.find();
    const commissionRates = {};
    commissionRatesFromDB.forEach((rate) => {
        commissionRates[rate.referralLevel] = 10 * (rate.commission / 100); // Convert percentage to fraction
    });
    // Level 1 referrals
    const referredUsersLevel1 = yield db_1.default.UserModel.find({
        _id: { $in: user.referredUsers.map((user) => user._id) },
    });
    // Level 2 referrals
    const referredUsersLevel2 = yield db_1.default.UserModel.find({
        _id: {
            $in: referredUsersLevel1.flatMap((user) => user.referredUsers.map((u) => u._id)),
        },
    });
    // Level 3 referrals
    const referredUsersLevel3 = yield db_1.default.UserModel.find({
        _id: {
            $in: referredUsersLevel2.flatMap((user) => user.referredUsers.map((u) => u._id)),
        },
    });
    const mappedUsers = [
        ...referredUsersLevel1.map((user) => ({
            name: user.name || "",
            photoUrl: user.photoUrl || "",
            createdAt: user.createdAt || new Date(),
            commission: commissionRates[1],
            active: user.isSubscribed || false,
        })),
        ...referredUsersLevel2.map((user) => ({
            name: user.name || "",
            photoUrl: user.photoUrl || "",
            createdAt: user.createdAt || new Date(),
            commission: commissionRates[2],
            active: user.isSubscribed || false,
        })),
        ...referredUsersLevel3.map((user) => ({
            name: user.name || "",
            photoUrl: user.photoUrl || "",
            createdAt: user.createdAt || new Date(),
            commission: commissionRates[3],
            active: user.isSubscribed || false,
        })),
    ];
    res.status(200).json(mappedUsers);
});
exports.referral_history = referral_history;
const admin_overview_utils = {
    basic_stats: () => __awaiter(void 0, void 0, void 0, function* () {
        const [total_users, active_users, total_referrals, total_income] = yield Promise.all([
            db_1.default.UserModel.countDocuments(),
            db_1.default.UserModel.countDocuments({ isSubscribed: true }),
            db_1.default.UserModel.aggregate([
                { $unwind: "$referredUsers" },
                { $count: "total" },
            ]).then((result) => (result[0] ? result[0].total : 0)),
            db_1.default.PaymentModel.aggregate([
                { $group: { _id: null, total: { $sum: "$amount" } } },
                { $project: { _id: 0, total: 1 } },
            ]).then((result) => (result[0] ? result[0].total : 0)),
        ]);
        return { total_users, active_users, total_referrals, total_income };
    }),
    income_overview: (income_year) => __awaiter(void 0, void 0, void 0, function* () {
        const income_overview = yield db_1.default.PaymentModel.aggregate([
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
    }),
    user_overview: (user_year) => __awaiter(void 0, void 0, void 0, function* () {
        const user_overview = yield db_1.default.UserModel.aggregate([
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
    }),
    referral_overview: () => __awaiter(void 0, void 0, void 0, function* () {
        const users = yield db_1.default.UserModel.find({}, {
            createdAt: 1,
            _id: 1,
            name: 1,
            photoUrl: 1,
            referredBy: 1,
        });
        const relations = [];
        const findRelations = () => __awaiter(void 0, void 0, void 0, function* () {
            yield Promise.all(users.map((referrer) => __awaiter(void 0, void 0, void 0, function* () {
                const findDownstreamChain = (currentUserId_1, ...args_1) => __awaiter(void 0, [currentUserId_1, ...args_1], void 0, function* (currentUserId, level = 1) {
                    const directReferrals = yield db_1.default.UserModel.find({ referredBy: currentUserId }, {
                        createdAt: 1,
                        _id: 1,
                        name: 1,
                        photoUrl: 1,
                        referredBy: 1,
                    });
                    yield Promise.all(directReferrals.map((referee) => __awaiter(void 0, void 0, void 0, function* () {
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
                        yield findDownstreamChain(referee._id.toString(), level + 1);
                    })));
                });
                yield findDownstreamChain(referrer._id.toString());
            })));
        });
        yield findRelations();
        relations.sort((a, b) => a.createdAt - b.createdAt);
        return relations.slice(0, 5);
    }),
    top_referrers: () => __awaiter(void 0, void 0, void 0, function* () {
        const topReferrers = yield db_1.default.UserModel.aggregate([
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
    }),
};
const admin_overview = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const income_year = ((_a = req === null || req === void 0 ? void 0 : req.query) === null || _a === void 0 ? void 0 : _a.income_year) || new Date().getFullYear().toString();
    const user_year = ((_b = req === null || req === void 0 ? void 0 : req.query) === null || _b === void 0 ? void 0 : _b.user_year) || new Date().getFullYear().toString();
    const unread_notification_count = yield db_1.default.NotificationModel.countDocuments({
        isRead: false,
        recipientRole: "admin",
    });
    res.status(200).json({
        unread_notification_count,
        basic_stats: yield admin_overview_utils.basic_stats(),
        income_overview: yield admin_overview_utils.income_overview(income_year),
        user_overview: yield admin_overview_utils.user_overview(user_year),
        referral_overview: yield admin_overview_utils.referral_overview(),
        top_referrers: yield admin_overview_utils.top_referrers(),
    });
});
exports.admin_overview = admin_overview;
const referral_overview = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { page, limit, query } = req.query;
    const searchParams = {};
    if (query) {
        searchParams.$or = [{ name: { $regex: query, $options: "i" } }];
    }
    const users = yield db_1.default.UserModel.find(searchParams, {
        createdAt: 1,
        _id: 1,
        name: 1,
        photoUrl: 1,
        referredBy: 1,
    });
    const relations = [];
    const findRelations = () => __awaiter(void 0, void 0, void 0, function* () {
        yield Promise.all(users.map((referrer) => __awaiter(void 0, void 0, void 0, function* () {
            const findDownstreamChain = (currentUserId_1, ...args_1) => __awaiter(void 0, [currentUserId_1, ...args_1], void 0, function* (currentUserId, level = 1) {
                const directReferrals = yield db_1.default.UserModel.find({
                    referredBy: currentUserId,
                }, {
                    createdAt: 1,
                    _id: 1,
                    name: 1,
                    photoUrl: 1,
                    referredBy: 1,
                });
                yield Promise.all(directReferrals.map((referee) => __awaiter(void 0, void 0, void 0, function* () {
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
                    yield findDownstreamChain(referee._id.toString(), level + 1);
                })));
            });
            yield findDownstreamChain(referrer._id.toString());
        })));
    });
    yield findRelations();
    relations.sort((a, b) => a.createdAt - b.createdAt);
    const startIndex = (+(page || 1) - 1) * +(limit || 10);
    const endIndex = startIndex + +(limit || 10);
    const paginatedRelations = relations.slice(startIndex, endIndex);
    const pagination = {
        page: parseInt(page),
        limit: parseInt(limit),
        total: relations.length,
        totalPages: Math.ceil(relations.length / parseInt(limit)),
    };
    res.status(200).json({ referrals: paginatedRelations, pagination });
});
exports.referral_overview = referral_overview;
const notification_count = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const unread_notification_count = yield db_1.default.NotificationModel.countDocuments({
        isRead: false,
        recipientRole: "admin",
    });
    res.status(200).json(unread_notification_count);
});
exports.notification_count = notification_count;
