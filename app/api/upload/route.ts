import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

import connectDB from "../../../lib/mongodb";
import Folder from "../../../models/Folder";

export async function POST(req: Request) {
  try {
    const data = await req.formData();

    const files = data.getAll("files") as File[];
    const paths = data.getAll("paths") as string[];

    const userId = data.get("userId")?.toString() || null;

    const capsuleName =
      data.get("capsuleName")?.toString() || "Untitled Capsule";

    const description =
      data.get("description")?.toString() || "";

    const icon =
      data.get("icon")?.toString() || "📦";

    const color =
      data.get("color")?.toString() || "purple";

    const expiryDays = Number(data.get("expiryDays") || (userId ? 30 : 3));

    const downloadLimit = Number(data.get("downloadLimit") || 0);

    if (!files || files.length === 0) {
      return NextResponse.json({
        success: false,
        message: "No files selected",
      });
    }

    const folderId = Date.now().toString();
    const rootUploadDir = path.join(process.cwd(), "uploads", folderId);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const relativePath = paths[i] || file.name;

      const safeRelativePath = relativePath.replace(/\\/g, "/");
      const fullPath = path.join(rootUploadDir, safeRelativePath);

      const dirName = path.dirname(fullPath);
      await mkdir(dirName, { recursive: true });

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      await writeFile(fullPath, buffer);
    }

    await connectDB();

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiryDays);

    await Folder.create({
      folderId,
      userId,
      capsuleName,
      description,
      icon,
      color,
      filesCount: files.length,
      expiresAt,
      downloads: 0,
      views: 0,
      downloadLimit,
      isPasswordProtected: false,
      password: "",
    });

    return NextResponse.json({
      success: true,
      message: "Capsule uploaded successfully",
      folderId,
      url: `/folder/${folderId}`,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json({
      success: false,
      message: "Upload failed",
      error: String(error),
    });
  }
}