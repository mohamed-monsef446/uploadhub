import { NextResponse } from "next/server";
import { rm } from "fs/promises";
import path from "path";

import connectDB from "../../../lib/mongodb";
import Folder from "../../../models/Folder";

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const folderId = searchParams.get("folderId");
    const userId = searchParams.get("userId");

    if (!folderId || !userId) {
      return NextResponse.json({
        success: false,
        message: "Folder ID and User ID are required",
      });
    }

    await connectDB();

    const folder = await Folder.findOne({ folderId, userId });

    if (!folder) {
      return NextResponse.json({
        success: false,
        message: "Folder not found",
      });
    }

    const folderPath = path.join(process.cwd(), "uploads", folderId);

    await rm(folderPath, {
      recursive: true,
      force: true,
    });

    await Folder.deleteOne({ folderId, userId });

    return NextResponse.json({
      success: true,
      message: "Folder deleted successfully",
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json({
      success: false,
      message: "Delete failed",
      error: String(error),
    });
  }
}