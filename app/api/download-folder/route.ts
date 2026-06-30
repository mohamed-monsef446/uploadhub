import { NextRequest, NextResponse } from "next/server";
import AdmZip from "adm-zip";
import connectDB from "../../../lib/mongodb";
import Folder from "../../../models/Folder";
import { supabaseAdmin } from "../../../lib/supabase";

function safeAsciiName(name: string) {
  return name.replace(/[^\x20-\x7E]/g, "_");
}

function contentDisposition(filename: string) {
  return `attachment; filename="${safeAsciiName(
    filename
  )}"; filename*=UTF-8''${encodeURIComponent(filename)}`;
}

export async function GET(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "File ID missing" }, { status: 400 });
    }

    await connectDB();

    const fileData = await Folder.findOneAndUpdate(
      { folderId: id },
      { $inc: { downloads: 1 } },
      { new: true }
    ).lean();

    if (!fileData) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    const files = fileData.files || [];

    if (files.length === 1) {
      const file = files[0];

      const { data, error } = await supabaseAdmin.storage
        .from("uploads")
        .download(file.storagePath);

      if (error || !data) {
        return NextResponse.json(
          { error: "File download failed" },
          { status: 500 }
        );
      }

      const buffer = Buffer.from(await data.arrayBuffer());

      return new NextResponse(buffer, {
        headers: {
          "Content-Type": file.type || "application/octet-stream",
          "Content-Disposition": contentDisposition(file.name || "file"),
        },
      });
    }

    const zip = new AdmZip();

    for (const file of files) {
      const { data, error } = await supabaseAdmin.storage
        .from("uploads")
        .download(file.storagePath);

      if (error || !data) continue;

      const buffer = Buffer.from(await data.arrayBuffer());
      zip.addFile(file.name || "file", buffer);
    }

    const zipName = `${id}.zip`;

    return new NextResponse(zip.toBuffer(), {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": contentDisposition(zipName),
      },
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json({ error: "Download failed" }, { status: 500 });
  }
}