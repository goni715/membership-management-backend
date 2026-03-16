import uploadService from "@services/uploadService";
import getYouTubeVideoID from "@utils/getYoutubeVideoID";
import handleFileResponse from "@utils/handleFIleResponse";
import { config } from "dotenv";
import { Request, Response } from "express";
import { verify } from "jsonwebtoken";
import { isValidObjectId } from "mongoose";
import DB from "../db";

config();

// Todo
// upload video and file
// get video and file by category with pagination

const tools = async (req: Request, res: Response): Promise<void> => {
  const { id, type, page, limit, query } = req.query;

  if (!id) {
    const searchQuery = query
      ? {
          $or: [{ name: { $regex: query, $options: "i" } }],
        }
      : {};

    const tools = await DB.ToolModel.find(searchQuery, {
      id: 1,
      name: 1,
      icon: 1,
    })
      .sort({ order: -1, name: 1 })
      .skip((+(page || 1) - 1) * +(limit || 10))
      .limit(+(limit || 10));

    const total = await DB.ToolModel.countDocuments(searchQuery);
    const pagination = {
      page: +(page || 1),
      limit: +(limit || 10),
      total,
      totalPages: Math.ceil(total / +(limit || 10)),
    };

    res.json({ tools, pagination });
    return;
  }

  if (!isValidObjectId(id)) {
    res.status(400).json({ message: "Invalid id" });
    return;
  }

  const tool = await DB.ToolModel.findById(id, {
    id: 1,
    name: 1,
    icon: 1,
  });

  if (!tool) {
    res.status(404).json({ message: "Tool category not found" });
    return;
  }

  if (!type) {
    const videos = await DB.VideoModel.find({ toolId: id }, { __v: 0 }).limit(
      10
    );

    const files = await DB.FileModel.find({ toolId: id }, { __v: 0 }).limit(10);

    res.json({
      tool,
      videos: handleFileResponse(videos),
      files: handleFileResponse(files),
    });
    return;
  }

  if (type === "video") {
    const videos = await DB.VideoModel.find({ toolId: id }, { __v: 0 })
      .skip((+(page || 1) - 1) * +(limit || 10))
      .limit(+(limit || 10));

    const total = await DB.VideoModel.countDocuments({ toolId: id });
    const pagination = {
      page: +(page || 1),
      limit: +(limit || 10),
      total,
      totalPages: Math.ceil(total / +(limit || 10)),
    };

    res.json({ tool, videos: handleFileResponse(videos), pagination });
    return;
  }

  if (type === "file") {
    const files = await DB.FileModel.find({ toolId: id }, { __v: 0 })
      .skip((+(page || 1) - 1) * +(limit || 10))
      .limit(+(limit || 10));

    const total = await DB.FileModel.countDocuments({ toolId: id });
    const pagination = {
      page: +(page || 1),
      limit: +(limit || 10),
      total,
      totalPages: Math.ceil(total / +(limit || 10)),
    };

    res.json({ tool, files: handleFileResponse(files), pagination });
    return;
  }

  res.json({ tool });
};

const access_file = async (req: Request, res: Response): Promise<void> => {
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

    verify(token, secret, (err, decoded) => {
      if (err || !decoded) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }
    });

    if (!isValidObjectId(id)) {
      res.status(400).json({ message: "Invalid ID" });
      return;
    }

    const video = await DB.VideoModel.findByIdAndUpdate(
      id,
      { $inc: { views: 1 } },
      { new: true }
    );

    const youtubeId = await DB.ToolModel.findOne({ name: "Youtube" });

    if (video && video.toolId.toString() === youtubeId?._id.toString()) {
      res.redirect(`https://www.youtube.com/embed/${video.url}`);
      return;
    }

    if (video) {
      res.redirect(video.url);
      return;
    }

    const file = await DB.FileModel.findByIdAndUpdate(
      id,
      { $inc: { downloads: 1 } },
      { new: true }
    );

    if (file) {
      res.redirect(file.url);
      return;
    }

    res.status(404).json({ message: "File not found" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// Category Management
const get_categories = async (req: Request, res: Response): Promise<void> => {
  const { page, limit, query } = req.query;
  const searchQuery = query
    ? {
        $or: [{ name: { $regex: query, $options: "i" } }],
      }
    : {};
  const categories = await DB.ToolModel.find(searchQuery)
    .sort({ order: -1, name: 1 })
    .skip((+(page || 1) - 1) * +(limit || 10))
    .limit(+(limit || 10));

  const total = await DB.ToolModel.countDocuments(searchQuery);
  const pagination = {
    page: +(page || 1),
    limit: +(limit || 10),
    total,
    totalPages: Math.ceil(total / +(limit || 10)),
  };
  res.json({ categories, pagination });
  return;
};

const add_category = async (req: Request, res: Response): Promise<void> => {
  const { name } = req.body;
  const icon = req.file;

  if (!name || !icon) {
    res.status(400).json({ error: "Name and icon are required" });
    return;
  }

  const iconUrl = await uploadService(icon, "image");

  if (!iconUrl) {
    res.status(500).json({ message: "Error uploading photo" });
    return;
  }

  await DB.ToolModel.create({ name, icon: iconUrl });

  res.json({
    message: "Category added successfully",
  });
};

const update_category = async (req: Request, res: Response): Promise<void> => {
  const { id, name } = req.body;
  const icon = req.file;

  if (!isValidObjectId(id)) {
    res.status(400).json({ message: "Invalid id" });
    return;
  }

  if (!name && !icon) {
    res.status(400).json({ error: "Name or icon is required" });
    return;
  }

  const update = { name } as any;

  if (icon) {
    const iconUrl = await uploadService(icon, "image");

    if (!iconUrl) {
      res.status(500).json({ message: "Error uploading photo" });
      return;
    }

    update.icon = iconUrl;
  }

  const tool = await DB.ToolModel.findByIdAndUpdate(id, update);

  if (!tool) {
    res.status(404).json({ message: "Tool category not found" });
    return;
  }

  res.json({
    message: "Category updated successfully",
  });
};

const delete_category = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.body;

  if (!isValidObjectId(id)) {
    res.status(400).json({ message: "Invalid id" });
    return;
  }

  const tool = await DB.ToolModel.findByIdAndDelete(id);

  if (!tool) {
    res.status(404).json({ message: "Tool category not found" });
    return;
  }

  res.json({
    message: "Category deleted successfully",
  });
};

// Tools Management
const all_tools = async (req: Request, res: Response): Promise<void> => {
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
    const videoQuery: any = {};
    const toolQuery: any = {};

    // Filter by tool category if query is provided
    if (query) {
      const toolCategories = await DB.ToolModel.find(
        { name: { $regex: query, $options: "i" } }, // Case-insensitive search
        { _id: 1 }
      );

      if (toolCategories.length > 0) {
        videoQuery.toolId = { $in: toolCategories.map((tool) => tool._id) };
      } else {
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

    const fetchedVideos = await DB.VideoModel.find(videoQuery, { __v: 0 })
      .skip((pageNumber - 1) * limitNumber)
      .limit(limitNumber);

    const videoToolIds = fetchedVideos.map((video) => video.toolId);
    const tools = await DB.ToolModel.find({ _id: { $in: videoToolIds } });

    const videos = fetchedVideos.map((video) => {
      const tool = tools.find(
        (tool) => tool._id.toString() === video.toolId.toString()
      );

      return {
        _id: video._id.toString(),
        category: tool?.name,
        categoryId: tool?._id.toString(),
        title: video.title,
        url: video.url,
      };
    });

    const total = await DB.VideoModel.countDocuments(videoQuery);
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
    const fileQuery: any = {};
    const toolQuery: any = {};

    // Filter by tool category if query is provided
    if (query) {
      const toolCategories = await DB.ToolModel.find(
        { name: { $regex: query, $options: "i" } }, // Case-insensitive search
        { _id: 1 }
      );

      if (toolCategories.length > 0) {
        fileQuery.toolId = { $in: toolCategories.map((tool) => tool._id) };
      } else {
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

    const fetchedFiles = await DB.FileModel.find(fileQuery, { __v: 0 })
      .skip((pageNumber - 1) * limitNumber)
      .limit(limitNumber);

    const fileToolIds = fetchedFiles.map((file) => file.toolId);
    const tools = await DB.ToolModel.find({ _id: { $in: fileToolIds } });

    const files = fetchedFiles.map((file) => {
      const tool = tools.find(
        (tool) => tool._id.toString() === file.toolId.toString()
      );

      return {
        _id: file._id.toString(),
        category: tool?.name,
        categoryId: tool?._id.toString(),
        title: file.title,
        url: file.url,
      };
    });

    const total = await DB.FileModel.countDocuments(fileQuery);
    const pagination = {
      page: pageNumber,
      limit: limitNumber,
      total,
      totalPages: Math.ceil(total / limitNumber),
    };

    res.json({ files, pagination });
    return;
  }
};

const upload = async (req: Request, res: Response): Promise<void> => {
  const { toolId, title, youtube_url } = req?.query || {};

  if (!toolId || !title) {
    res.status(400).json({ message: "Tool id and title are required" });
    return;
  }

  if (!isValidObjectId(toolId)) {
    res.status(400).json({ message: "Invalid id" });
    return;
  }

  const tool = await DB.ToolModel.findById(toolId);

  if (!tool) {
    res.status(404).json({ message: "Tool category not found" });
    return;
  }

  if (tool.name === "Youtube" && !youtube_url) {
    res.status(400).json({ message: "Youtube url is required" });
    return;
  }

  if (youtube_url && tool.name === "Youtube") {
    const videoId = getYouTubeVideoID(youtube_url.toString());
    if (!videoId) {
      res.status(400).json({ message: "Invalid youtube url" });
      return;
    }

    await DB.VideoModel.create({
      toolId,
      title,
      url: `${videoId}`,
    });

    res.json({ message: "Video uploaded successfully" });
    return;
  }

  const video = (req.files as { [fieldname: string]: Express.Multer.File[] })?.[
    "video"
  ];
  const file = (req.files as { [fieldname: string]: Express.Multer.File[] })?.[
    "file"
  ];

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
    const videoUrl = await uploadService(video[0], "video");

    if (!videoUrl) {
      res.status(500).json({ message: "Error uploading video" });
      return;
    }

    await DB.VideoModel.create({
      toolId,
      title,
      url: videoUrl,
    });
  }

  if (file && tool.name !== "Youtube") {
    const fileUrl = await uploadService(file[0], "raw");

    if (!fileUrl) {
      res.status(500).json({ message: "Error uploading file" });
      return;
    }

    await DB.FileModel.create({
      toolId,
      title,
      url: fileUrl,
    });
  }

  res.json({ message: "File uploaded successfully" });
};

const update_tool = async (req: Request, res: Response): Promise<void> => {
  const { id, toolId, title, type, youtube_url } = req?.query || {};

  if (!toolId || !title || !id || !type) {
    res
      .status(400)
      .json({ message: "Tool id, title, id and type are required" });
    return;
  }

  if (!isValidObjectId(toolId) && !isValidObjectId(id)) {
    res.status(400).json({ message: "Invalid id" });
    return;
  }

  const video = (req.files as { [fieldname: string]: Express.Multer.File[] })?.[
    "video"
  ];
  const file = (req.files as { [fieldname: string]: Express.Multer.File[] })?.[
    "file"
  ];

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

  const tool = await DB.ToolModel.findById(toolId);

  if (!tool) {
    res.status(404).json({ message: "Tool category not found" });
    return;
  }

  if (type === "video") {
    const videoFile = await DB.VideoModel.findById(id);

    if (!videoFile) {
      res.status(404).json({ message: "File not found" });
      return;
    }

    let videoUrl = youtube_url
      ? getYouTubeVideoID(youtube_url.toString())
      : null;
    if (videoUrl === null) {
      videoUrl = await uploadService(video[0], "video");

      if (!videoUrl) {
        res.status(500).json({ message: "Error uploading video" });
        return;
      }
    }

    await DB.VideoModel.findByIdAndUpdate(id, {
      toolId,
      title,
      url: videoUrl,
    });
  }

  if (type === "file") {
    const fileFromDB = await DB.FileModel.findById(id);

    if (!fileFromDB) {
      res.status(404).json({ message: "File not found" });
      return;
    }
    const fileUrl = await uploadService(file[0], "raw");

    if (!fileUrl) {
      res.status(500).json({ message: "Error uploading file" });
      return;
    }

    await DB.FileModel.findByIdAndUpdate(id, {
      toolId,
      title,
      url: fileUrl,
    });
  }

  res.json({ message: "File updated successfully" });
};

const delete_tool = async (req: Request, res: Response): Promise<void> => {
  const { id, type } = req.query;

  if (!id || !type) {
    res.status(400).json({ message: "Id and type are required" });
    return;
  }

  if (!isValidObjectId(id)) {
    res.status(400).json({ message: "Invalid id" });
    return;
  }

  if (type === "video") {
    const video = await DB.VideoModel.findByIdAndDelete(id);

    if (!video) {
      res.status(404).json({ message: "Video not found" });
      return;
    }
  }

  if (type === "file") {
    const file = await DB.FileModel.findByIdAndDelete(id);

    if (!file) {
      res.status(404).json({ message: "File not found" });
      return;
    }
  }

  res.json({ message: "File deleted successfully" });
};

export {
  tools,
  access_file,
  upload,
  get_categories,
  add_category,
  update_category,
  delete_category,
  all_tools,
  update_tool,
  delete_tool,
};
