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
exports.delete_tool = exports.update_tool = exports.all_tools = exports.delete_category = exports.update_category = exports.add_category = exports.get_categories = exports.upload = exports.access_file = exports.tools = void 0;
const uploadService_1 = __importDefault(require("../services/uploadService"));
const getYoutubeVideoID_1 = __importDefault(require("../utils/getYoutubeVideoID"));
const handleFIleResponse_1 = __importDefault(require("../utils/handleFIleResponse"));
const dotenv_1 = require("dotenv");
const jsonwebtoken_1 = require("jsonwebtoken");
const mongoose_1 = require("mongoose");
const db_1 = __importDefault(require("../db"));
(0, dotenv_1.config)();
// Todo
// upload video and file
// get video and file by category with pagination
const tools = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id, type, page, limit, query } = req.query;
    if (!id) {
        const searchQuery = query
            ? {
                $or: [{ name: { $regex: query, $options: "i" } }],
            }
            : {};
        const tools = yield db_1.default.ToolModel.find(searchQuery, {
            id: 1,
            name: 1,
            icon: 1,
        })
            .sort({ order: -1, name: 1 })
            .skip((+(page || 1) - 1) * +(limit || 10))
            .limit(+(limit || 10));
        const total = yield db_1.default.ToolModel.countDocuments(searchQuery);
        const pagination = {
            page: +(page || 1),
            limit: +(limit || 10),
            total,
            totalPages: Math.ceil(total / +(limit || 10)),
        };
        res.json({ tools, pagination });
        return;
    }
    if (!(0, mongoose_1.isValidObjectId)(id)) {
        res.status(400).json({ message: "Invalid id" });
        return;
    }
    const tool = yield db_1.default.ToolModel.findById(id, {
        id: 1,
        name: 1,
        icon: 1,
    });
    if (!tool) {
        res.status(404).json({ message: "Tool category not found" });
        return;
    }
    if (!type) {
        const videos = yield db_1.default.VideoModel.find({ toolId: id }, { __v: 0 }).limit(10);
        const files = yield db_1.default.FileModel.find({ toolId: id }, { __v: 0 }).limit(10);
        res.json({
            tool,
            videos: (0, handleFIleResponse_1.default)(videos),
            files: (0, handleFIleResponse_1.default)(files),
        });
        return;
    }
    if (type === "video") {
        const videos = yield db_1.default.VideoModel.find({ toolId: id }, { __v: 0 })
            .skip((+(page || 1) - 1) * +(limit || 10))
            .limit(+(limit || 10));
        const total = yield db_1.default.VideoModel.countDocuments({ toolId: id });
        const pagination = {
            page: +(page || 1),
            limit: +(limit || 10),
            total,
            totalPages: Math.ceil(total / +(limit || 10)),
        };
        res.json({ tool, videos: (0, handleFIleResponse_1.default)(videos), pagination });
        return;
    }
    if (type === "file") {
        const files = yield db_1.default.FileModel.find({ toolId: id }, { __v: 0 })
            .skip((+(page || 1) - 1) * +(limit || 10))
            .limit(+(limit || 10));
        const total = yield db_1.default.FileModel.countDocuments({ toolId: id });
        const pagination = {
            page: +(page || 1),
            limit: +(limit || 10),
            total,
            totalPages: Math.ceil(total / +(limit || 10)),
        };
        res.json({ tool, files: (0, handleFIleResponse_1.default)(files), pagination });
        return;
    }
    res.json({ tool });
});
exports.tools = tools;
const access_file = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { token } = req.query;
        if (!token || typeof token !== "string") {
            res.status(500).json({ message: "Auth token is required" });
            return;
        }
        const secret = process.env.ACCESS_TOKEN_SECRET;
        if (!secret) {
            res.status(500).json({ message: "Internal Server Error" });
            return;
        }
        (0, jsonwebtoken_1.verify)(token, secret, (err, decoded) => {
            if (err || !decoded) {
                res.status(401).json({ message: "Unauthorized" });
                return;
            }
        });
        if (!(0, mongoose_1.isValidObjectId)(id)) {
            res.status(400).json({ message: "Invalid ID" });
            return;
        }
        const video = yield db_1.default.VideoModel.findByIdAndUpdate(id, { $inc: { views: 1 } }, { new: true });
        const youtubeId = yield db_1.default.ToolModel.findOne({ name: "Youtube" });
        if (video && video.toolId.toString() === (youtubeId === null || youtubeId === void 0 ? void 0 : youtubeId._id.toString())) {
            res.redirect(`https://www.youtube.com/embed/${video.url}`);
            return;
        }
        if (video) {
            res.redirect(video.url);
            return;
        }
        const file = yield db_1.default.FileModel.findByIdAndUpdate(id, { $inc: { downloads: 1 } }, { new: true });
        if (file) {
            res.redirect(file.url);
            return;
        }
        res.status(404).json({ message: "File not found" });
    }
    catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
});
exports.access_file = access_file;
// Category Management
const get_categories = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { page, limit, query } = req.query;
    const searchQuery = query
        ? {
            $or: [{ name: { $regex: query, $options: "i" } }],
        }
        : {};
    const categories = yield db_1.default.ToolModel.find(searchQuery)
        .sort({ order: -1, name: 1 })
        .skip((+(page || 1) - 1) * +(limit || 10))
        .limit(+(limit || 10));
    const total = yield db_1.default.ToolModel.countDocuments(searchQuery);
    const pagination = {
        page: +(page || 1),
        limit: +(limit || 10),
        total,
        totalPages: Math.ceil(total / +(limit || 10)),
    };
    res.json({ categories, pagination });
    return;
});
exports.get_categories = get_categories;
const add_category = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { name } = req.body;
    const icon = req.file;
    if (!name || !icon) {
        res.status(400).json({ error: "Name and icon are required" });
        return;
    }
    const iconUrl = yield (0, uploadService_1.default)(icon, "image");
    if (!iconUrl) {
        res.status(500).json({ message: "Error uploading photo" });
        return;
    }
    yield db_1.default.ToolModel.create({ name, icon: iconUrl });
    res.json({
        message: "Category added successfully",
    });
});
exports.add_category = add_category;
const update_category = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id, name } = req.body;
    const icon = req.file;
    if (!(0, mongoose_1.isValidObjectId)(id)) {
        res.status(400).json({ message: "Invalid id" });
        return;
    }
    if (!name && !icon) {
        res.status(400).json({ error: "Name or icon is required" });
        return;
    }
    const update = { name };
    if (icon) {
        const iconUrl = yield (0, uploadService_1.default)(icon, "image");
        if (!iconUrl) {
            res.status(500).json({ message: "Error uploading photo" });
            return;
        }
        update.icon = iconUrl;
    }
    const tool = yield db_1.default.ToolModel.findByIdAndUpdate(id, update);
    if (!tool) {
        res.status(404).json({ message: "Tool category not found" });
        return;
    }
    res.json({
        message: "Category updated successfully",
    });
});
exports.update_category = update_category;
const delete_category = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.body;
    if (!(0, mongoose_1.isValidObjectId)(id)) {
        res.status(400).json({ message: "Invalid id" });
        return;
    }
    const tool = yield db_1.default.ToolModel.findByIdAndDelete(id);
    if (!tool) {
        res.status(404).json({ message: "Tool category not found" });
        return;
    }
    res.json({
        message: "Category deleted successfully",
    });
});
exports.delete_category = delete_category;
// Tools Management
const all_tools = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { type, page, limit, query } = req.query;
    if (!type) {
        res.status(400).json({ message: "Type is required" });
        return;
    }
    if (type !== "video" && type !== "file") {
        res.status(400).json({ message: "Invalid type" });
        return;
    }
    const pageNumber = +(page || 1);
    const limitNumber = +(limit || 10);
    if (type === "video") {
        const videoQuery = {};
        const toolQuery = {};
        // Filter by tool category if query is provided
        if (query) {
            const toolCategories = yield db_1.default.ToolModel.find({ name: { $regex: query, $options: "i" } }, // Case-insensitive search
            { _id: 1 });
            if (toolCategories.length > 0) {
                videoQuery.toolId = { $in: toolCategories.map((tool) => tool._id) };
            }
            else {
                res.json({
                    videos: [],
                    pagination: {
                        page: pageNumber,
                        limit: limitNumber,
                        total: 0,
                        totalPages: 0,
                    },
                });
                return;
            }
        }
        const fetchedVideos = yield db_1.default.VideoModel.find(videoQuery, { __v: 0 })
            .skip((pageNumber - 1) * limitNumber)
            .limit(limitNumber);
        const videoToolIds = fetchedVideos.map((video) => video.toolId);
        const tools = yield db_1.default.ToolModel.find({ _id: { $in: videoToolIds } });
        const videos = fetchedVideos.map((video) => {
            const tool = tools.find((tool) => tool._id.toString() === video.toolId.toString());
            return {
                _id: video._id.toString(),
                category: tool === null || tool === void 0 ? void 0 : tool.name,
                categoryId: tool === null || tool === void 0 ? void 0 : tool._id.toString(),
                title: video.title,
                url: video.url,
            };
        });
        const total = yield db_1.default.VideoModel.countDocuments(videoQuery);
        const pagination = {
            page: pageNumber,
            limit: limitNumber,
            total,
            totalPages: Math.ceil(total / limitNumber),
        };
        res.json({ videos, pagination });
        return;
    }
    if (type === "file") {
        const fileQuery = {};
        const toolQuery = {};
        // Filter by tool category if query is provided
        if (query) {
            const toolCategories = yield db_1.default.ToolModel.find({ name: { $regex: query, $options: "i" } }, // Case-insensitive search
            { _id: 1 });
            if (toolCategories.length > 0) {
                fileQuery.toolId = { $in: toolCategories.map((tool) => tool._id) };
            }
            else {
                res.json({
                    files: [],
                    pagination: {
                        page: pageNumber,
                        limit: limitNumber,
                        total: 0,
                        totalPages: 0,
                    },
                });
                return;
            }
        }
        const fetchedFiles = yield db_1.default.FileModel.find(fileQuery, { __v: 0 })
            .skip((pageNumber - 1) * limitNumber)
            .limit(limitNumber);
        const fileToolIds = fetchedFiles.map((file) => file.toolId);
        const tools = yield db_1.default.ToolModel.find({ _id: { $in: fileToolIds } });
        const files = fetchedFiles.map((file) => {
            const tool = tools.find((tool) => tool._id.toString() === file.toolId.toString());
            return {
                _id: file._id.toString(),
                category: tool === null || tool === void 0 ? void 0 : tool.name,
                categoryId: tool === null || tool === void 0 ? void 0 : tool._id.toString(),
                title: file.title,
                url: file.url,
            };
        });
        const total = yield db_1.default.FileModel.countDocuments(fileQuery);
        const pagination = {
            page: pageNumber,
            limit: limitNumber,
            total,
            totalPages: Math.ceil(total / limitNumber),
        };
        res.json({ files, pagination });
        return;
    }
});
exports.all_tools = all_tools;
const upload = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const { toolId, title, youtube_url } = (req === null || req === void 0 ? void 0 : req.query) || {};
    if (!toolId || !title) {
        res.status(400).json({ message: "Tool id and title are required" });
        return;
    }
    if (!(0, mongoose_1.isValidObjectId)(toolId)) {
        res.status(400).json({ message: "Invalid id" });
        return;
    }
    const tool = yield db_1.default.ToolModel.findById(toolId);
    if (!tool) {
        res.status(404).json({ message: "Tool category not found" });
        return;
    }
    if (tool.name === "Youtube" && !youtube_url) {
        res.status(400).json({ message: "Youtube url is required" });
        return;
    }
    if (youtube_url && tool.name === "Youtube") {
        const videoId = (0, getYoutubeVideoID_1.default)(youtube_url.toString());
        if (!videoId) {
            res.status(400).json({ message: "Invalid youtube url" });
            return;
        }
        yield db_1.default.VideoModel.create({
            toolId,
            title,
            url: `${videoId}`,
        });
        res.json({ message: "Video uploaded successfully" });
        return;
    }
    const video = (_a = req.files) === null || _a === void 0 ? void 0 : _a["video"];
    const file = (_b = req.files) === null || _b === void 0 ? void 0 : _b["file"];
    if (!video && !file) {
        res
            .status(400)
            .json({ message: "At least one Video or one file is required" });
        return;
    }
    if (video && file) {
        res.status(400).json({ message: "Only one video or a file is required" });
        return;
    }
    if (video && tool.name !== "Youtube") {
        const videoUrl = yield (0, uploadService_1.default)(video[0], "video");
        if (!videoUrl) {
            res.status(500).json({ message: "Error uploading video" });
            return;
        }
        yield db_1.default.VideoModel.create({
            toolId,
            title,
            url: videoUrl,
        });
    }
    if (file && tool.name !== "Youtube") {
        const fileUrl = yield (0, uploadService_1.default)(file[0], "raw");
        if (!fileUrl) {
            res.status(500).json({ message: "Error uploading file" });
            return;
        }
        yield db_1.default.FileModel.create({
            toolId,
            title,
            url: fileUrl,
        });
    }
    res.json({ message: "File uploaded successfully" });
});
exports.upload = upload;
const update_tool = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const { id, toolId, title, type, youtube_url } = (req === null || req === void 0 ? void 0 : req.query) || {};
    if (!toolId || !title || !id || !type) {
        res
            .status(400)
            .json({ message: "Tool id, title, id and type are required" });
        return;
    }
    if (!(0, mongoose_1.isValidObjectId)(toolId) && !(0, mongoose_1.isValidObjectId)(id)) {
        res.status(400).json({ message: "Invalid id" });
        return;
    }
    const video = (_a = req.files) === null || _a === void 0 ? void 0 : _a["video"];
    const file = (_b = req.files) === null || _b === void 0 ? void 0 : _b["file"];
    if (!youtube_url) {
        if (type === "video" && !video) {
            res.status(400).json({ message: "Video is required" });
            return;
        }
        if (type === "file" && !file) {
            res.status(400).json({ message: "File is required" });
            return;
        }
    }
    const tool = yield db_1.default.ToolModel.findById(toolId);
    if (!tool) {
        res.status(404).json({ message: "Tool category not found" });
        return;
    }
    if (type === "video") {
        const videoFile = yield db_1.default.VideoModel.findById(id);
        if (!videoFile) {
            res.status(404).json({ message: "File not found" });
            return;
        }
        let videoUrl = youtube_url
            ? (0, getYoutubeVideoID_1.default)(youtube_url.toString())
            : null;
        if (videoUrl === null) {
            videoUrl = yield (0, uploadService_1.default)(video[0], "video");
            if (!videoUrl) {
                res.status(500).json({ message: "Error uploading video" });
                return;
            }
        }
        yield db_1.default.VideoModel.findByIdAndUpdate(id, {
            toolId,
            title,
            url: videoUrl,
        });
    }
    if (type === "file") {
        const fileFromDB = yield db_1.default.FileModel.findById(id);
        if (!fileFromDB) {
            res.status(404).json({ message: "File not found" });
            return;
        }
        const fileUrl = yield (0, uploadService_1.default)(file[0], "raw");
        if (!fileUrl) {
            res.status(500).json({ message: "Error uploading file" });
            return;
        }
        yield db_1.default.FileModel.findByIdAndUpdate(id, {
            toolId,
            title,
            url: fileUrl,
        });
    }
    res.json({ message: "File updated successfully" });
});
exports.update_tool = update_tool;
const delete_tool = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id, type } = req.query;
    if (!id || !type) {
        res.status(400).json({ message: "Id and type are required" });
        return;
    }
    if (!(0, mongoose_1.isValidObjectId)(id)) {
        res.status(400).json({ message: "Invalid id" });
        return;
    }
    if (type === "video") {
        const video = yield db_1.default.VideoModel.findByIdAndDelete(id);
        if (!video) {
            res.status(404).json({ message: "Video not found" });
            return;
        }
    }
    if (type === "file") {
        const file = yield db_1.default.FileModel.findByIdAndDelete(id);
        if (!file) {
            res.status(404).json({ message: "File not found" });
            return;
        }
    }
    res.json({ message: "File deleted successfully" });
});
exports.delete_tool = delete_tool;
