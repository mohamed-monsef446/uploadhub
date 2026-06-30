import CopyButton from "./CopyButton";
import CapsuleHeader from "@/components/capsule/CapsuleHeader";
import CapsuleStats from "@/components/capsule/CapsuleStats";
import connectDB from "../../../lib/mongodb";
import Folder from "../../../models/Folder";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function formatBytes(bytes: number) {
  if (!bytes) return "0 Bytes";
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

  await connectDB();

  const capsule = await Folder.findOneAndUpdate(
  { folderId: id },
  { $inc: { views: 1 } },
  { new: true }
).lean();

  console.log("Opening folder:", id);
  console.log("Capsule found:", !!capsule);

  if (!capsule) {
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

  const files = capsule.files || [];
  const totalSize = files.reduce(
    (sum: number, file: any) => sum + (file.size || 0),
    0
  );

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL || "https://uploadhub-teal.vercel.app";

  const shareLink = `${appUrl}/folder/${id}`;
  const capsuleName = capsule.capsuleName || `Capsule ${id.slice(-6)}`;

  const firstFile = files[0];
  const firstFileUrl = firstFile
    ? `/api/files/${encodeURIComponent(firstFile.storagePath)}`
    : "";

  const firstFileType = firstFile ? getFileType(firstFile.name || "") : "other";

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
              <p className="text-sm text-slate-500">Smart Transfer Capsules</p>
            </div>
          </a>

          <a
            href="/"
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-2xl font-black shadow-lg"
          >
            + New Capsule
          </a>
        </div>
      </header>

      <section className="max-w-7xl mx-auto px-8 py-10">
        <div className="bg-white rounded-[32px] shadow-xl border overflow-hidden">
          <CapsuleHeader capsuleName={capsuleName} id={id} />

          <div className="p-8">
            <CapsuleStats
              filesCount={files.length}
              totalSize={formatBytes(totalSize)}
              capsuleId={id}
            />

            <div className="grid lg:grid-cols-[1fr_300px] gap-6 mb-8">
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 border rounded-3xl p-6">
                <h3 className="text-2xl font-black text-slate-900 mb-2">
                  🔗 Share Capsule
                </h3>

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
                    ⬇ ZIP
                  </a>
                </div>
              </div>

              <div className="bg-white border rounded-3xl p-6 text-center shadow-sm">
                <p className="font-black text-slate-900 mb-3">📱 Scan QR</p>
                <div className="bg-slate-50 border rounded-2xl p-4 inline-block">
                  <img src={qrUrl} alt="Capsule QR Code" className="w-44 h-44" />
                </div>
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
                  <div className="bg-slate-50 border rounded-2xl p-10 text-center">
                    <div className="text-7xl mb-4">📕</div>
                    <p className="font-black text-slate-900 break-all">
                      {firstFile.name}
                    </p>
                    <a
                      href={firstFileUrl}
                      target="_blank"
                      className="inline-block bg-slate-900 text-white px-6 py-3 rounded-2xl font-black mt-5"
                    >
                      👁 Open PDF
                    </a>
                  </div>
                )}

                {firstFile && firstFileType === "other" && (
                  <div className="bg-slate-50 border rounded-2xl p-10 text-center">
                    <div className="text-7xl mb-4">📄</div>
                    <p className="font-black text-slate-900 break-all">
                      {firstFile.name}
                    </p>
                  </div>
                )}
              </div>

              <div className="bg-slate-900 text-white rounded-3xl p-6">
                <h3 className="text-2xl font-black mb-5">🛡 Capsule Trust</h3>
                <p className="text-white/70">
                  Files are stored securely in Supabase Storage and shared
                  through this capsule link.
                </p>
              </div>
            </div>

            <div className="bg-white border rounded-3xl p-6">
              <h3 className="text-2xl font-black text-slate-900 mb-5">
                Capsule Files
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
                      className="flex items-center justify-between gap-4 border rounded-2xl p-4"
                    >
                      <div>
                        <p className="font-black text-slate-900 break-all">
                          {file.name}
                        </p>
                        <p className="text-sm text-slate-500">
                          {formatBytes(file.size || 0)}
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <a
                          href={openUrl}
                          target="_blank"
                          className="bg-slate-900 text-white px-4 py-2 rounded-xl font-bold"
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