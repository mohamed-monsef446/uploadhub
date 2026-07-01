import connectDB from "../../../lib/mongodb";
import Folder from "../../../models/Folder";

function formatBytes(bytes: number) {
  if (!bytes) return "0 Bytes";

  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));

  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
}

function getFileType(fileName: string) {
  const ext = fileName.split(".").pop()?.toLowerCase();

  if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext || "")) return "image";
  if (["mp4", "mov", "webm"].includes(ext || "")) return "video";
  if (ext === "pdf") return "pdf";

  return "other";
}

function getFileIcon(fileName: string) {
  const ext = fileName.split(".").pop()?.toLowerCase();

  if (ext === "pdf") return "📕";
  if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext || "")) return "🖼️";
  if (["mp4", "mov", "webm", "avi", "mkv"].includes(ext || "")) return "🎬";
  if (["doc", "docx"].includes(ext || "")) return "📘";
  if (["xls", "xlsx", "csv"].includes(ext || "")) return "📗";
  if (["zip", "rar", "7z"].includes(ext || "")) return "📦";

  return "📄";
}

export default async function FilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  await connectDB();

  const fileDoc: any = await Folder.findOneAndUpdate(
    { folderId: id },
    { $inc: { views: 1 } },
    { new: true }
  ).lean();

  if (!fileDoc) {
    return (
      <main className="min-h-screen bg-[#f6f6f2] flex items-center justify-center p-8">
        <div className="bg-white rounded-[32px] shadow-xl border border-slate-200 p-10 text-center max-w-md">
          <div className="text-7xl mb-5">⏳</div>

          <h1 className="text-3xl font-black text-slate-950 mb-3">
            File Not Found
          </h1>

          <p className="text-slate-500 mb-6">
            This file link may be expired, deleted, or unavailable.
          </p>

          <a
            href="/"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-2xl font-black"
          >
            Upload New File
          </a>
        </div>
      </main>
    );
  }

  const files = fileDoc.files || [];
  const totalSize = files.reduce(
    (sum: number, file: any) => sum + (file.size || 0),
    0
  );

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://uploadhub.vercel.app";
  const shareLink = `${appUrl}/folder/${id}`;

  const fileName =
    fileDoc.capsuleName && fileDoc.capsuleName !== "Untitled Capsule"
      ? fileDoc.capsuleName
      : files.length === 1
      ? files[0].name
      : "Untitled File";

  const firstFile = files[0];

  const firstFileUrl = firstFile
    ? `/api/files/${encodeURIComponent(firstFile.storagePath)}`
    : "";

  const firstFileType = firstFile ? getFileType(firstFile.name || "") : "other";

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
    shareLink
  )}`;

  return (
    <main className="min-h-screen bg-[#f6f6f2] text-slate-950">
      <header className="bg-white/90 backdrop-blur border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-8 py-5 flex justify-between items-center">
          <a href="/" className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-3xl bg-slate-950 flex items-center justify-center text-3xl shadow-lg text-white">
              ☁️
            </div>

            <div>
              <h1 className="text-3xl font-black text-slate-950">
                Upload Hub
              </h1>
              <p className="text-sm text-slate-500">
                Smart File Transfer
              </p>
            </div>
          </a>

          <a
            href="/"
            className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-black shadow-lg"
          >
            + Upload New File
          </a>
        </div>
      </header>

      <section className="max-w-7xl mx-auto px-8 py-10">
        <div className="bg-white rounded-[32px] shadow-xl border border-slate-200 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-10 text-white">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
              <div>
                <p className="font-black text-white/80 mb-4">
                  Smart File Transfer
                </p>

                <div className="flex items-center gap-5">
                  <div className="text-6xl">
                    {firstFile ? getFileIcon(firstFile.name || "") : "📄"}
                  </div>

                  <div>
                    <h1 className="text-5xl font-black break-all">
                      {fileName}
                    </h1>

                    <p className="text-white/80 mt-3">
                      A private file link for secure sharing with Upload Hub.
                    </p>
                  </div>
                </div>
              </div>

              <a
                href={`/api/download-folder?id=${id}`}
                className="bg-white text-blue-700 px-8 py-5 rounded-3xl font-black shadow-xl text-center"
              >
                ⬇ Download All
              </a>
            </div>
          </div>

          <div className="p-8">
            <div className="grid md:grid-cols-4 gap-5 mb-8">
              <div className="border border-slate-200 rounded-3xl p-6 bg-slate-50">
                <p className="text-slate-500 font-black">Files</p>
                <h2 className="text-4xl font-black mt-3">{files.length}</h2>
              </div>

              <div className="border border-slate-200 rounded-3xl p-6 bg-slate-50">
                <p className="text-slate-500 font-black">Total Size</p>
                <h2 className="text-4xl font-black mt-3">
                  {formatBytes(totalSize)}
                </h2>
              </div>

              <div className="border border-green-200 rounded-3xl p-6 bg-green-50">
                <p className="text-green-700 font-black">Security</p>
                <h2 className="text-3xl font-black mt-3 text-green-700">
                  Private
                </h2>
              </div>

              <div className="border border-purple-200 rounded-3xl p-6 bg-purple-50">
                <p className="text-purple-700 font-black">File ID</p>
                <h2 className="text-2xl font-black mt-3 text-purple-700">
                  #{id.slice(-6)}
                </h2>
              </div>
            </div>

            <div className="grid lg:grid-cols-[1fr_320px] gap-6 mb-8">
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 border border-slate-200 rounded-3xl p-6">
                <h3 className="text-2xl font-black text-slate-950 mb-4">
                  🔗 Share File
                </h3>

                <div className="bg-white border border-blue-200 rounded-2xl p-4 text-blue-700 break-all text-sm mb-5">
                  {shareLink}
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <button
                    type="button"
                    className="text-center bg-blue-600 text-white px-5 py-3 rounded-2xl font-black"
                  >
                    📋 Copy Link
                  </button>

                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(
                      `Files shared with you: ${shareLink}`
                    )}`}
                    target="_blank"
                    className="text-center bg-green-600 text-white px-5 py-3 rounded-2xl font-black"
                  >
                    📱 WhatsApp
                  </a>

                  <a
                    href={`https://t.me/share/url?url=${encodeURIComponent(
                      shareLink
                    )}`}
                    target="_blank"
                    className="text-center bg-sky-600 text-white px-5 py-3 rounded-2xl font-black"
                  >
                    ✈️ Telegram
                  </a>

                  <a
                    href={`mailto:?subject=${encodeURIComponent(
                      "Files shared with you"
                    )}&body=${encodeURIComponent(shareLink)}`}
                    className="text-center bg-purple-600 text-white px-5 py-3 rounded-2xl font-black"
                  >
                    ✉️ Email
                  </a>

                  <a
                    href={`/api/download-folder?id=${id}`}
                    className="text-center bg-rose-600 text-white px-5 py-3 rounded-2xl font-black"
                  >
                    ⬇ Download
                  </a>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-3xl p-6 text-center shadow-sm">
                <p className="font-black text-slate-950 mb-3">📱 Scan QR</p>

                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 inline-block">
                  <img
                    src={qrUrl}
                    alt="File QR Code"
                    className="w-44 h-44"
                  />
                </div>
              </div>
            </div>

            <div className="grid lg:grid-cols-[1fr_340px] gap-6 mb-8">
              <div className="bg-white border border-slate-200 rounded-3xl p-6">
                <h3 className="text-2xl font-black text-slate-950 mb-4">
                  👁 File Preview
                </h3>

                {!firstFile && (
                  <div className="text-slate-500 text-center py-12">
                    No preview available.
                  </div>
                )}

                {firstFile && firstFileType === "image" && (
                  <img
                    src={firstFileUrl}
                    alt={firstFile.name}
                    className="w-full max-h-[420px] object-contain rounded-2xl border bg-slate-50"
                  />
                )}

                {firstFile && firstFileType === "video" && (
                  <video
                    src={firstFileUrl}
                    controls
                    className="w-full max-h-[420px] rounded-2xl border bg-black"
                  />
                )}

                {firstFile && firstFileType === "pdf" && (
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-10 text-center">
                    <div className="text-7xl mb-4">📕</div>

                    <p className="font-black text-slate-950 break-all">
                      {firstFile.name}
                    </p>

                    <a
                      href={firstFileUrl}
                      target="_blank"
                      className="inline-block bg-slate-950 text-white px-6 py-3 rounded-2xl font-black mt-5"
                    >
                      👁 Open PDF
                    </a>
                  </div>
                )}

                {firstFile && firstFileType === "other" && (
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-10 text-center">
                    <div className="text-7xl mb-4">📄</div>

                    <p className="font-black text-slate-950 break-all">
                      {firstFile.name}
                    </p>
                  </div>
                )}
              </div>

              <div className="bg-slate-950 text-white rounded-3xl p-6">
                <h3 className="text-2xl font-black mb-5">🛡 File Trust</h3>

                <p className="text-white/70">
                  Files are stored securely and shared through a private Upload
                  Hub file link.
                </p>

                <div className="mt-6 space-y-3 text-sm">
                  <div className="flex justify-between border-b border-white/10 pb-3">
                    <span className="text-white/60">Views</span>
                    <span className="font-black">{fileDoc.views || 0}</span>
                  </div>

                  <div className="flex justify-between border-b border-white/10 pb-3">
                    <span className="text-white/60">Downloads</span>
                    <span className="font-black">{fileDoc.downloads || 0}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-white/60">Expires</span>
                    <span className="font-black">
                      {fileDoc.expiresAt
                        ? new Date(fileDoc.expiresAt).toLocaleDateString()
                        : "Not set"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-3xl p-6">
              <h3 className="text-2xl font-black text-slate-950 mb-5">
                Files
              </h3>

              <div className="space-y-3">
                {files.map((file: any, index: number) => {
                  const openUrl = `/api/files/${encodeURIComponent(
                    file.storagePath
                  )}`;

                  const downloadUrl = `${openUrl}?download=1&name=${encodeURIComponent(
                    file.name
                  )}`;

                  return (
                    <div
                      key={`${file.storagePath}-${index}`}
                      className="flex items-center justify-between gap-4 border border-slate-200 rounded-2xl p-4"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="text-3xl">
                          {getFileIcon(file.name || "")}
                        </div>

                        <div className="min-w-0">
                          <p className="font-black text-slate-950 break-all">
                            {file.name}
                          </p>

                          <p className="text-sm text-slate-500">
                            {formatBytes(file.size || 0)}
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <a
                          href={openUrl}
                          target="_blank"
                          className="bg-slate-950 text-white px-4 py-2 rounded-xl font-bold"
                        >
                          Open
                        </a>

                        <a
                          href={downloadUrl}
                          className="bg-blue-600 text-white px-4 py-2 rounded-xl font-bold"
                        >
                          Download
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
