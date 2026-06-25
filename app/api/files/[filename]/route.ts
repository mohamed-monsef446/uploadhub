import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params;
    const decodedFilename = decodeURIComponent(filename);

    const filePath = path.join(process.cwd(), "uploads", decodedFilename);

    if (!fs.existsSync(filePath)) {
      return new NextResponse("File not found", { status: 404 });
    }

    const url = new URL(req.url);
    const download = url.searchParams.get("download") === "1";

    const fileBuffer = fs.readFileSync(filePath);
    const fileNameOnly = path.basename(decodedFilename);

    return new NextResponse(new Uint8Array(fileBuffer), {
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `${
          download ? "attachment" : "inline"
        }; filename="file"; filename*=UTF-8''${encodeURIComponent(fileNameOnly)}`,
      },
    });
  } catch (error) {
    console.error(error);
    return new NextResponse("Error", { status: 500 });
  }
}