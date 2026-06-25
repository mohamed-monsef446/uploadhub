"use client";

import { useState } from "react";

function getFileIcon(file: string) {
  const ext = file.split(".").pop()?.toLowerCase();

  if (ext === "pdf") return "📕";
  if (["doc", "docx"].includes(ext || "")) return "📘";
  if (["xls", "xlsx", "csv"].includes(ext || "")) return "📗";
  if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext || "")) return "🖼️";
  if (["mp4", "mov", "avi", "mkv"].includes(ext || "")) return "🎬";
  if (["zip", "rar", "7z"].includes(ext || "")) return "📦";

  return "📄";
}

export default function FileList({
  files,
  id,
}: {
  files: string[];
  id: string;
}) {
  const [search, setSearch] = useState("");

  const filteredFiles = files.filter((file) =>
    file.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="mb-5">
        <input
          type="text"
          placeholder="🔍 Search files inside capsule..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full border rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="grid gap-4">
        {filteredFiles.map((file) => {
          const fileUrl = `/api/files/${encodeURIComponent(id + "/" + file)}`;

          return (
            <div
              key={file}
              className="bg-gradient-to-br from-slate-50 to-white border rounded-3xl p-5 hover:shadow-lg transition"
            >
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-4xl shadow">
                    {getFileIcon(file)}
                  </div>

                  <div className="min-w-0">
                    <p className="text-lg font-black text-slate-900 break-all">
                      {file}
                    </p>

                    <p className="text-sm text-slate-500">
                      Ready to preview or download
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <a
                    href={fileUrl}
                    target="_blank"
                    className="px-5 py-3 rounded-2xl bg-slate-900 text-white font-black hover:bg-black transition"
                  >
                    👁 Open
                  </a>

                  <a
                    href={`${fileUrl}?download=1`}
                    className="px-5 py-3 rounded-2xl bg-purple-600 text-white font-black hover:bg-purple-700 transition"
                  >
                    ⬇ Download
                  </a>
                </div>
              </div>
            </div>
          );
        })}

        {filteredFiles.length === 0 && (
          <div className="text-center py-12 text-slate-500">
            No files found.
          </div>
        )}
      </div>
    </div>
  );
}