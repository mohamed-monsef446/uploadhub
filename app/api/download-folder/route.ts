import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import AdmZip from "adm-zip";

function addFolderToZip(zip: AdmZip, folderPath: string, zipPath = "") {
  const items = fs.readdirSync(folderPath);

  for (const item of items) {
    const fullPath = path.join(folderPath, item);
    const relativePath = path.join(zipPath, item);

    if (fs.statSync(fullPath).isDirectory()) {
      addFolderToZip(zip, fullPath, relativePath);
    } else {
      zip.addLocalFile(fullPath, path.dirname(relativePath));
    }
  }
}

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");

  if (!id) {
    return NextResponse.json(
      { error: "Folder ID missing" },
      { status: 400 }
    );
  }

  const folderPath = path.join(process.cwd(), "uploads", id);

  if (!fs.existsSync(folderPath)) {
    return NextResponse.json(
      { error: "Folder not found" },
      { status: 404 }
    );
  }

  const zip = new AdmZip();

  addFolderToZip(zip, folderPath);

  const buffer = zip.toBuffer();

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${id}.zip"`,
    },
  });
}