import { NextResponse } from "next/server";
import connectDB from "../../../lib/mongodb";
import Folder from "../../../models/Folder";
import { supabaseAdmin } from "../../../lib/supabase";

function getSafeFileName(fileName: string, index: number) {
  const extension = fileName.includes(".")
    ? fileName.split(".").pop()
    : "file";

  return `file-${index + 1}-${Date.now()}.${extension}`;
}

export async function POST(req: Request) {
  try {
    const data = await req.formData();

    const files = data.getAll("files") as File[];
    const paths = data.getAll("paths") as string[];

    const userId = data.get("userId")?.toString() || null;
    const capsuleName =
      data.get("capsuleName")?.toString() || "Untitled Capsule";
    const description = data.get("description")?.toString() || "";
    const icon = data.get("icon")?.toString() || "📦";
    const color = data.get("color")?.toString() || "purple";
    const expiryDays = Number(data.get("expiryDays") || (userId ? 30 : 3));
    const downloadLimit = Number(data.get("downloadLimit") || 0);

    if (!files || files.length === 0) {
      return NextResponse.json({
        success: false,
        message: "No files selected",
      });
    }

    const folderId = Date.now().toString();
    const uploadedFiles = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const originalPath = (paths[i] || file.name).replace(/\\/g, "/");
      const safeFileName = getSafeFileName(file.name, i);
      const storagePath = `${folderId}/${safeFileName}`;

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const { error } = await supabaseAdmin.storage
        .from("uploads")
        .upload(storagePath, buffer, {
          contentType: file.type || "application/octet-stream",
          upsert: true,
        });

      if (error) {
        console.error("Supabase upload error:", error);

        return NextResponse.json({
          success: false,
          message: "Upload to storage failed",
          error: error.message,
        });
      }

      const { data: publicUrlData } = supabaseAdmin.storage
        .from("uploads")
        .getPublicUrl(storagePath);

      uploadedFiles.push({
        name: file.name,
        path: originalPath,
        storagePath,
        url: publicUrlData.publicUrl,
        size: file.size,
        type: file.type || "application/octet-stream",
      });
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
      files: uploadedFiles,
      storageProvider: "supabase",
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