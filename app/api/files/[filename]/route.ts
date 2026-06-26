import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabase";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params;
    const storagePath = decodeURIComponent(filename);

    const url = new URL(req.url);
    const download = url.searchParams.get("download") === "1";
    const originalName = url.searchParams.get("name") || "file";

    const { data, error } = await supabaseAdmin.storage
      .from("uploads")
      .download(storagePath);

    if (error || !data) {
      console.error("Supabase download error:", error);
      return new NextResponse("File not found", { status: 404 });
    }

    const arrayBuffer = await data.arrayBuffer();

    return new NextResponse(arrayBuffer, {
      headers: {
        "Content-Type": data.type || "application/octet-stream",
        "Content-Disposition": `${
          download ? "attachment" : "inline"
        }; filename="file"; filename*=UTF-8''${encodeURIComponent(originalName)}`,
      },
    });
  } catch (error) {
    console.error(error);
    return new NextResponse("Error", { status: 500 });
  }
}