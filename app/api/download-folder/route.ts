import { NextRequest, NextResponse } from "next/server";
import AdmZip from "adm-zip";
import connectDB from "../../../lib/mongodb";
import Folder from "../../../models/Folder";
import { supabaseAdmin } from "../../../lib/supabase";

export async function GET(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Folder ID missing" }, { status: 400 });
    }

    await connectDB();

    const capsule = await Folder.findOneAndUpdate(
      { folderId: id },
      { $inc: { downloads: 1 } },
      { new: true }
    ).lean();

    if (!capsule) {
      return NextResponse.json({ error: "Capsule not found" }, { status: 404 });
    }

    const files = capsule.files || [];
    const zip = new AdmZip();

    for (const file of files) {
      const { data, error } = await supabaseAdmin.storage
        .from("uploads")
        .download(file.storagePath);

      if (error || !data) {
        console.error("Supabase ZIP download error:", error);
        continue;
      }

      const arrayBuffer = await data.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      zip.addFile(file.name || "file", buffer);
    }

    const buffer = zip.toBuffer();

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${id}.zip"`,
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "ZIP download failed" }, { status: 500 });
  }
}
        .download(file.storagePath);

      if (error || !data) {
        console.error("Supabase ZIP download error:", error);
        continue;
      }

      const arrayBuffer = await data.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      zip.addFile(file.name || "file", buffer);
    }

    const buffer = zip.toBuffer();

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${id}.zip"`,
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "ZIP download failed" }, { status: 500 });
  }
}