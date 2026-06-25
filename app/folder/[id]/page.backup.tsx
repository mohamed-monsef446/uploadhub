import fs from "fs";
import path from "path";
import CopyButton from "./CopyButton";
import FileList from "./FileList";

function getAllFiles(dir: string, basePath = ""): string[] {
  const items = fs.readdirSync(dir);
  let files: string[] = [];

  for (const item of items) {
    const fullPath = path.join(dir, item);
    const relativePath = path.join(basePath, item);

    if (fs.statSync(fullPath).isDirectory()) {
      files = files.concat(getAllFiles(fullPath, relativePath));
    } else {
      files.push(relativePath);
    }
  }

  return files;
}

function getFolderSize(dir: string): number {
  const items = fs.readdirSync(dir);
  let total = 0;

  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      total += getFolderSize(fullPath);
    } else {
      total += stat.size;
    }
  }

  return total;
}

function formatBytes(bytes: number) {
  if (bytes === 0) return "0 Bytes";
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
}

function getFileType(file: string) {
  const ext = file.split(".").pop()?.toLowerCase();

  if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext || "")) return "image";
  if (["mp4", "mov", "webm"].includes(ext || "")) return "video";
  if (ext === "pdf") return "pdf";

  return "other";
}

export default async function FolderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const capsulePath = path.join(process.cwd(), "uploads", id);

  if (!fs.existsSync(capsulePath)) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-8">
        <div className="bg-white rounded-3xl shadow-xl border p-10 text-center max-w-md">
          <div className="text-7xl mb-5">⏳</div>
          <h1 className="text-3xl font-black text-slate-900 mb-3">
            Capsule Not Found
          </h1>
          <p className="text-slate-500 mb-6">
            This capsule may be expired, deleted, or unavailable.
          </p>
          <a
            href="/"
            className="inline-block bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-2xl font-black"
          >
            Create New Capsule
          </a>
        </div>
      </main>
    );
  }

  const files = getAllFiles(capsulePath);
  const totalSize = getFolderSize(capsulePath);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const shareLink = `${appUrl}/folder/${id}`;
  const capsuleName = `Capsule ${id.slice(-6)}`;

  const firstFile = files[0];
  const firstFileUrl = firstFile
    ? `/api/files/${encodeURIComponent(id + "/" + firstFile)}`
    : "";

  const firstFileType = firstFile ? getFileType(firstFile) : "other";

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
    shareLink
  )}`;

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50">
      <header className="bg-white/90 backdrop-blur border-b">
        <div className="max-w-7xl mx-auto px-8 py-5 flex justify-between items-center">
          <a href="/" className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-3xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-3xl shadow-lg">
              ☁️
            </div>

            <div>
              <h1 className="text-3xl font-black text-slate-900">
                Upload Hub
              </h1>
              <p className="text-sm text-slate-500">
                Smart Transfer Capsules
              </p>
            </div>
          </a>

          <a
            href="/"
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-2xl font-black shadow-lg hover:scale-105 active:scale-95 transition"
          >
            + New Capsule
          </a>
        </div>
      </header>

      <section className="max-w-7xl mx-auto px-8 py-10">
        <div className="bg-white rounded-[32px] shadow-xl border overflow-hidden">
          <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 p-10 text-white">
            <div className="absolute -right-20 -top-20 w-72 h-72 bg-white/10 rounded-full blur-3xl"></div>
            <div className="absolute -left-20 -bottom-20 w-72 h-72 bg-white/10 rounded-full blur-3xl"></div>

            <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
              <div>
                <p className="text-white/80 font-bold mb-2">
                  Smart Transfer Capsule
                </p>

                <h2 className="text-5xl font-black mb-3">
                  📦 {capsuleName}
                </h2>

                <p className="text-white/80 max-w-2xl">
                  A private capsule for sharing files securely with QR, instant
                  sharing, preview, and download controls.
                </p>
              </div>

              <a
                href={`/api/download-folder?id=${id}`}
                className="bg-white text-blue-700 px-8 py-4 rounded-2xl font-black shadow-lg text-center hover:scale-105 active:scale-95 transition"
              >
                ⬇ Download All
              </a>
            </div>
          </div>

          <div className="p-8">
            <div className="grid md:grid-cols-4 gap-5 mb-8">
              <div className="bg-slate-50 border rounded-3xl p-6">
                <p className="text-slate-500 font-bold">Files</p>
                <h3 className="text-4xl font-black mt-2">{files.length}</h3>
              </div>

              <div className="bg-slate-50 border rounded-3xl p-6">
                <p className="text-slate-500 font-bold">Total Size</p>
                <h3 className="text-4xl font-black mt-2">
                  {formatBytes(totalSize)}
                </h3>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-3xl p-6">
                <p className="text-green-700 font-bold">Security</p>
                <h3 className="text-2xl font-black mt-3 text-green-700">
                  Private
                </h3>
              </div>

              <div className="bg-purple-50 border border-purple-200 rounded-3xl p-6">
                <p className="text-purple-700 font-bold">Capsule ID</p>
                <h3 className="text-xl font-black mt-4 text-purple-700">
                  #{id.slice(-6)}
                </h3>
              </div>
            </div>

            <div className="grid lg:grid-cols-[1fr_300px] gap-6 mb-8">
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 border rounded-3xl p-6">
                <div className="mb-5">
                  <h3 className="text-2xl font-black text-slate-900">
                    🔗 Share Capsule
                  </h3>

                  <p className="text-slate-500 text-sm">
                    Share this capsule anywhere using link, QR, WhatsApp,
                    Telegram, Email, Teams, Slack, or Discord.
                  </p>
                </div>

                <div className="bg-white border rounded-2xl p-4 text-blue-700 break-all text-sm mb-5">
                  {shareLink}
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <CopyButton link={shareLink} />

                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(
                      `Files shared with you: ${shareLink}`
                    )}`}
                    target="_blank"
                    className="text-center bg-green-600 hover:bg-green-700 text-white px-5 py-3 rounded-2xl font-black transition"
                  >
                    📱 WhatsApp
                  </a>

                  <a
                    href={`https://t.me/share/url?url=${encodeURIComponent(
                      shareLink
                    )}&text=${encodeURIComponent(
                      "Files shared with you via Upload Hub"
                    )}`}
                    target="_blank"
                    className="text-center bg-sky-600 hover:bg-sky-700 text-white px-5 py-3 rounded-2xl font-black transition"
                  >
                    ✈️ Telegram
                  </a>

                  <a
                    href={`mailto:?subject=${encodeURIComponent(
                      "Files shared with you"
                    )}&body=${encodeURIComponent(
                      `Hello,\n\nFiles have been shared with you via Upload Hub.\n\nOpen the capsule here:\n${shareLink}\n\nUpload Hub`
                    )}`}
                    className="text-center bg-purple-600 hover:bg-purple-700 text-white px-5 py-3 rounded-2xl font-black transition"
                  >
                    ✉️ Email
                  </a>

                  <a
                    href={`https://teams.microsoft.com/share?href=${encodeURIComponent(
                      shareLink
                    )}`}
                    target="_blank"
                    className="text-center bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 rounded-2xl font-black transition"
                  >
                    👥 Teams
                  </a>

                  <a
                    href="https://slack.com/intl/en-gb/"
                    target="_blank"
                    className="text-center bg-slate-800 hover:bg-black text-white px-5 py-3 rounded-2xl font-black transition"
                  >
                    💬 Slack
                  </a>

                  <a
                    href="https://discord.com/channels/@me"
                    target="_blank"
                    className="text-center bg-violet-600 hover:bg-violet-700 text-white px-5 py-3 rounded-2xl font-black transition"
                  >
                    🎮 Discord
                  </a>

                  <a
                    href={`/api/download-folder?id=${id}`}
                    className="text-center bg-rose-600 hover:bg-rose-700 text-white px-5 py-3 rounded-2xl font-black transition"
                  >
                    ⬇ ZIP
                  </a>
                </div>
              </div>

              <div className="bg-white border rounded-3xl p-6 text-center shadow-sm">
                <p className="font-black text-slate-900 mb-3">📱 Scan QR</p>

                <div className="bg-slate-50 border rounded-2xl p-4 inline-block">
                  <img
                    src={qrUrl}
                    alt="Capsule QR Code"
                    className="w-44 h-44"
                  />
                </div>

                <p className="text-xs text-slate-500 mt-3">
                  Scan to open this capsule on mobile.
                </p>
              </div>
            </div>

            <div className="grid lg:grid-cols-[1fr_340px] gap-6 mb-8">
              <div className="bg-white border rounded-3xl p-6">
                <h3 className="text-2xl font-black text-slate-900 mb-4">
                  👁 Capsule Preview
                </h3>

                {!firstFile && (
                  <div className="text-slate-500 text-center py-12">
                    No preview available.
                  </div>
                )}

                {firstFile && firstFileType === "image" && (
                  <img
                    src={firstFileUrl}
                    alt={firstFile}
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
                  <div className="bg-slate-50 border rounded-2xl p-10 text-center">
                    <div className="text-7xl mb-4">📕</div>

                    <p className="font-black text-slate-900 break-all">
                      {firstFile}
                    </p>

                    <p className="text-slate-500 mt-2 mb-5">
                      PDF preview is disabled to prevent automatic downloads.
                    </p>

                    <a
                      href={firstFileUrl}
                      target="_blank"
                      className="inline-block bg-slate-900 text-white px-6 py-3 rounded-2xl font-black"
                    >
                      👁 Open PDF
                    </a>
                  </div>
                )}

                {firstFile && firstFileType === "other" && (
                  <div className="bg-slate-50 border rounded-2xl p-10 text-center">
                    <div className="text-7xl mb-4">📄</div>
                    <p className="font-black text-slate-900 break-all">
                      {firstFile}
                    </p>
                    <p className="text-slate-500 mt-2">
                      Preview is not available for this file type.
                    </p>
                  </div>
                )}
              </div>

              <div className="bg-slate-900 text-white rounded-3xl p-6">
                <h3 className="text-2xl font-black mb-5">🛡 Capsule Trust</h3>

                <div className="space-y-4">
                  <div className="bg-white/10 rounded-2xl p-4">
                    <p className="font-black">🔒 Private Link</p>
                    <p className="text-white/60 text-sm">
                      Only people with this capsule link can open it.
                    </p>
                  </div>

                  <div className="bg-white/10 rounded-2xl p-4">
                    <p className="font-black">⏳ Expiry Control</p>
                    <p className="text-white/60 text-sm">
                      Registered capsules stay active for 30 days.
                    </p>
                  </div>

                  <div className="bg-white/10 rounded-2xl p-4">
                    <p className="font-black">📦 One Capsule</p>
                    <p className="text-white/60 text-sm">
                      Multiple files collected in one smart share capsule.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white border rounded-3xl p-6 mb-8">
              <h3 className="text-2xl font-black text-slate-900 mb-5">
                🕘 Capsule Timeline
              </h3>

              <div className="grid md:grid-cols-4 gap-4">
                <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
                  <p className="font-black text-blue-700">Created</p>
                  <p className="text-sm text-slate-500 mt-1">
                    Capsule initialized
                  </p>
                </div>

                <div className="bg-purple-50 border border-purple-100 rounded-2xl p-4">
                  <p className="font-black text-purple-700">Uploaded</p>
                  <p className="text-sm text-slate-500 mt-1">
                    {files.length} file(s) secured
                  </p>
                </div>

                <div className="bg-green-50 border border-green-100 rounded-2xl p-4">
                  <p className="font-black text-green-700">Ready</p>
                  <p className="text-sm text-slate-500 mt-1">
                    Share link generated
                  </p>
                </div>

                <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4">
                  <p className="font-black text-amber-700">Expires</p>
                  <p className="text-sm text-slate-500 mt-1">
                    Controlled by your account plan
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white border rounded-3xl p-6">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-2xl font-black text-slate-900">
                    Capsule Files
                  </h3>

                  <p className="text-slate-500 text-sm">
                    Preview, open, or download files inside this capsule.
                  </p>
                </div>
              </div>

              <FileList files={files} id={id} />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}