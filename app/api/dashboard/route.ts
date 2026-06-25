import { NextResponse } from "next/server";

import connectDB from "../../../lib/mongodb";
import Folder from "../../../models/Folder";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({
        success: false,
        message: "User ID is required",
      });
    }

    await connectDB();

    const folders = await Folder.find({ userId }).sort({
      createdAt: -1,
    });

    const totalUploads = folders.length;

    const activeLinks = folders.filter(
      (folder) => new Date(folder.expiresAt) > new Date()
    ).length;

    const totalDownloads = folders.reduce(
      (sum, folder) => sum + (folder.downloads || 0),
      0
    );

    return NextResponse.json({
      success: true,
      stats: {
        totalUploads,
        activeLinks,
        totalDownloads,
      },
      folders,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json({
      success: false,
      message: "Dashboard failed",
      error: String(error),
    });
  }
}