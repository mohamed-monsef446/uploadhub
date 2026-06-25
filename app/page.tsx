"use client";

import { useEffect, useRef, useState } from "react";

type User = {
  id: string;
  name: string;
  email: string;
  plan: string;
};

function formatBytes(bytes: number) {
  if (bytes === 0) return "0 Bytes";
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
}

function getFileIcon(fileName: string) {
  const ext = fileName.split(".").pop()?.toLowerCase();

  if (ext === "pdf") return "📕";
  if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext || "")) return "🖼️";
  if (["mp4", "mov", "avi", "mkv"].includes(ext || "")) return "🎬";
  if (["doc", "docx"].includes(ext || "")) return "📘";
  if (["xls", "xlsx", "csv"].includes(ext || "")) return "📗";
  if (["zip", "rar", "7z"].includes(ext || "")) return "📦";

  return "📄";
}

export default function Home() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const folderInputRef = useRef<HTMLInputElement | null>(null);

  const [items, setItems] = useState<FileList | File[] | null>(null);
  const [uploadType, setUploadType] = useState<"files" | "folder" | "drop" | null>(null);
  const [message, setMessage] = useState("");
  const [shareLink, setShareLink] = useState("");
  const [emailTo, setEmailTo] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadedBytes, setUploadedBytes] = useState(0);
  const [totalBytes, setTotalBytes] = useState(0);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem("uploadhub_user");
    if (savedUser) setUser(JSON.parse(savedUser));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("uploadhub_user");
    setUser(null);
    setMessage("");
    setShareLink("");
  };

  const clearSelection = () => {
    setItems(null);
    setUploadType(null);
    setTotalBytes(0);
    setProgress(0);
    setUploadedBytes(0);
    setMessage("");
    setShareLink("");

    if (fileInputRef.current) fileInputRef.current.value = "";
    if (folderInputRef.current) folderInputRef.current.value = "";
  };

  const handleSelectedFiles = (
    files: FileList | File[] | null,
    type: "files" | "folder" | "drop"
  ) => {
    if (!files || files.length === 0) return;

    setItems(files);
    setUploadType(type);
    setTotalBytes(Array.from(files).reduce((sum, file) => sum + file.size, 0));
    setMessage("");
    setShareLink("");
    setProgress(0);
    setUploadedBytes(0);
  };

  const copyLink = async () => {
    if (!shareLink) return;

    await navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const sendByEmail = () => {
    if (!emailTo || !shareLink) {
      alert("Please enter recipient email");
      return;
    }

    const subject = encodeURIComponent(`${user?.name || "Someone"} shared files with you`);

    const body = encodeURIComponent(
      `Hello,\n\n${user?.name || "Someone"} has shared files with you.\n\nOpen the link below:\n${shareLink}\n\nThis link expires in ${
        user ? "30 days" : "3 days"
      }.\n\nUpload Hub`
    );

    window.location.href = `mailto:${emailTo}?subject=${subject}&body=${body}`;
  };

  const uploadFiles = async () => {
    if (!items || items.length === 0) {
      setMessage("Please select files or drag files here");
      return;
    }

    setIsUploading(true);
    setMessage("");
    setShareLink("");
    setProgress(0);
    setUploadedBytes(0);

    const formData = new FormData();

    Array.from(items).forEach((file: any) => {
      formData.append("files", file);
      formData.append("paths", file.webkitRelativePath || file.name);
    });

    if (user) formData.append("userId", user.id);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/upload");

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        setProgress(Math.round((event.loaded / event.total) * 100));
        setUploadedBytes(event.loaded);
      }
    };

    xhr.onload = () => {
      try {
        const data = JSON.parse(xhr.responseText);

        if (data.success) {
          const finalLink = `${window.location.origin}${data.url}`;
          setShareLink(finalLink);
          setMessage("Upload completed successfully");
          setProgress(100);
          setUploadedBytes(totalBytes);
        } else {
          setMessage("Upload failed");
        }
      } catch {
        setMessage("Upload failed");
      }

      setIsUploading(false);
    };

    xhr.onerror = () => {
      setMessage("Server error");
      setIsUploading(false);
    };

    xhr.send(formData);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    handleSelectedFiles(Array.from(e.dataTransfer.files), "drop");
  };

  const selectedFiles = items ? Array.from(items) : [];

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 p-6">
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => handleSelectedFiles(e.target.files, "files")}
      />

      <input
        ref={folderInputRef}
        type="file"
        multiple
        {...({ webkitdirectory: "" } as any)}
        className="hidden"
        onChange={(e) => handleSelectedFiles(e.target.files, "folder")}
      />

      <div className="max-w-7xl mx-auto">
        <header className="flex justify-between items-center mb-8 border-b border-slate-200 pb-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-3xl shadow-lg">
              ☁️
            </div>

            <div>
              <h1 className="text-4xl font-black text-slate-900">Upload Hub</h1>
              <p className="text-sm text-slate-500 mt-1">
                Secure file and folder sharing
              </p>
            </div>
          </div>

          {!user ? (
            <div className="flex gap-3">
              <a
                href="/login"
                className="px-5 py-3 rounded-xl bg-slate-900 text-white font-bold shadow hover:scale-105 active:scale-95 transition"
              >
                Login
              </a>

              <a
                href="/register"
                className="px-5 py-3 rounded-xl bg-green-600 text-white font-bold shadow hover:scale-105 active:scale-95 transition"
              >
                Register
              </a>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <a
                href="/dashboard"
                className="px-5 py-3 rounded-xl bg-white border border-blue-200 text-blue-700 font-bold shadow-sm hover:scale-105 active:scale-95 transition"
              >
                📊 Dashboard
              </a>

              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xl">
                  👤
                </div>

                <div>
                  <p className="font-bold text-slate-900">{user.name}</p>
                  <p className="text-xs text-slate-500">
                    {user.plan} plan • links active for 30 days
                  </p>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="px-5 py-3 rounded-xl bg-red-600 text-white font-bold shadow hover:scale-105 active:scale-95 transition"
              >
                Logout
              </button>
            </div>
          )}
        </header>

        <div className="mb-6 grid md:grid-cols-2 gap-4">
          <div className="bg-white/80 border border-blue-100 rounded-2xl p-5 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-2xl">
              🛡️
            </div>
            <p className="font-semibold text-slate-700">
              {user ? `Logged in as ${user.name}` : "Guest links active for 3 days"}
            </p>
          </div>

          <div className="bg-white/80 border border-purple-100 rounded-2xl p-5 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center text-2xl">
              ⏰
            </div>
            <p className="font-semibold text-slate-700">
              {user
                ? "Your links will stay active for 30 days"
                : "Register to keep links active for 30 days"}
            </p>
          </div>
        </div>

        <section className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={`relative overflow-hidden border-2 border-dashed rounded-3xl p-12 transition-all ${
              isDragging
                ? "border-blue-600 bg-blue-50 scale-[1.01]"
                : "border-blue-300 bg-gradient-to-br from-blue-50 via-white to-purple-50"
            }`}
          >
            <div className="absolute left-8 top-16 text-7xl opacity-20">📁</div>
            <div className="absolute right-10 top-20 text-7xl opacity-20">📄</div>

            <div className="relative text-center">
              <div className="mx-auto mb-5 w-28 h-28 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-6xl shadow-lg">
                ☁️
              </div>

              <h2 className="text-3xl font-black text-slate-900 mb-3">
                Drag & Drop Files or Folders Here
              </h2>

              <p className="text-slate-500 mb-8">
                Upload files or complete folders and share them securely
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl mx-auto">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-white border border-blue-100 text-blue-700 px-6 py-4 rounded-2xl font-black shadow-sm hover:shadow-md hover:scale-105 active:scale-95 transition"
                >
                  📄 Choose Files
                </button>

                <button
                  type="button"
                  onClick={() => folderInputRef.current?.click()}
                  className="bg-purple-50 border border-purple-100 text-purple-700 px-6 py-4 rounded-2xl font-black shadow-sm hover:shadow-md hover:scale-105 active:scale-95 transition"
                >
                  📁 Choose Folder
                </button>
              </div>

              <p className="mt-6 text-sm text-slate-500">
                or drag and drop anywhere in this area
              </p>
            </div>
          </div>

          {selectedFiles.length > 0 && (
            <div className="mt-6">
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-green-500 text-white flex items-center justify-center text-2xl">
                    ✓
                  </div>

                  <div>
                    <p className="text-xl font-black text-slate-900">
                      {selectedFiles.length} item(s) selected
                    </p>

                    <p className="text-slate-500">
                      Total size: {formatBytes(totalBytes)}
                    </p>
                  </div>
                </div>

                <button
                  onClick={clearSelection}
                  className="text-red-600 font-bold hover:underline"
                >
                  🗑 Clear all
                </button>
              </div>

              <div className="mt-4 space-y-3 max-h-72 overflow-y-auto">
                {selectedFiles.slice(0, 5).map((file, index) => (
                  <div
                    key={`${file.name}-${index}`}
                    className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex justify-between items-center"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-2xl">
                        {getFileIcon(file.name)}
                      </div>

                      <div>
                        <p className="font-bold text-slate-900 break-all">
                          {file.name}
                        </p>

                        <p className="text-sm text-slate-500">
                          {formatBytes(file.size)} • Ready
                        </p>
                      </div>
                    </div>

                    <div className="text-green-600 font-bold">✓</div>
                  </div>
                ))}

                {selectedFiles.length > 5 && (
                  <div className="text-center text-sm text-slate-500">
                    + {selectedFiles.length - 5} more item(s)
                  </div>
                )}
              </div>
            </div>
          )}

          <button
            onClick={uploadFiles}
            disabled={isUploading}
            className="mt-6 w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-5 rounded-2xl font-black text-xl shadow-lg transition-all duration-150 hover:scale-[1.01] active:scale-95 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isUploading ? "Uploading..." : "🚀 Upload Now"}
          </button>

          {(isUploading || progress > 0) && (
            <div className="mt-6 p-5 bg-slate-50 rounded-2xl border border-slate-200">
              <div className="flex justify-between text-sm font-bold mb-2">
                <span>Uploading Progress</span>
                <span>{progress}%</span>
              </div>

              <div className="w-full bg-slate-200 rounded-full h-4 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-blue-600 to-purple-600 h-4 transition-all duration-200"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>

              <p className="mt-3 text-sm text-slate-600 text-center">
                {formatBytes(uploadedBytes)} / {formatBytes(totalBytes)}
              </p>
            </div>
          )}

          {shareLink && (
            <div className="mt-6 p-6 bg-green-50 border border-green-200 rounded-3xl">
              <h2 className="text-2xl font-black text-green-700 mb-2">
                🎉 Upload Completed Successfully
              </h2>

              <p className="text-sm text-slate-600 mb-4">
                Share your files using the options below.
              </p>

              <div className="bg-white border rounded-2xl p-4 mb-4 break-all text-sm text-blue-700">
                {shareLink}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                <button
                  onClick={copyLink}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-xl font-bold transition-all hover:scale-105 active:scale-95"
                >
                  {copied ? "✓ Copied" : "📋 Copy Link"}
                </button>

                <a
                  href={shareLink}
                  target="_blank"
                  className="text-center bg-slate-900 hover:bg-black text-white px-4 py-3 rounded-xl font-bold transition-all hover:scale-105 active:scale-95"
                >
                  📂 View Folder
                </a>

                <a
                  href={`https://wa.me/?text=${encodeURIComponent(
                    `Files shared with you: ${shareLink}`
                  )}`}
                  target="_blank"
                  className="text-center bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-xl font-bold transition-all hover:scale-105 active:scale-95"
                >
                  📱 WhatsApp
                </a>
              </div>

              <div className="border-t pt-4">
                <label className="block mb-2 font-bold">
                  ✉️ Send by Email
                </label>

                <div className="flex gap-3">
                  <input
                    type="email"
                    value={emailTo}
                    onChange={(e) => setEmailTo(e.target.value)}
                    placeholder="recipient@email.com"
                    className="flex-1 border p-3 rounded-xl"
                  />

                  <button
                    onClick={sendByEmail}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl font-bold"
                  >
                    Send
                  </button>
                </div>
              </div>
            </div>
          )}

          {message && !shareLink && (
            <p className="mt-4 text-sm text-red-600">{message}</p>
          )}

          <div className="mt-8 grid md:grid-cols-4 gap-4">
            <div className="bg-slate-50 border rounded-2xl p-4">
              <p className="font-black">⚡ Fast Upload</p>
              <p className="text-sm text-slate-500">Blazing fast speeds</p>
            </div>

            <div className="bg-slate-50 border rounded-2xl p-4">
              <p className="font-black">🛡 Secure</p>
              <p className="text-sm text-slate-500">Protected sharing</p>
            </div>

            <div className="bg-slate-50 border rounded-2xl p-4">
              <p className="font-black">🔒 Private</p>
              <p className="text-sm text-slate-500">Only you share the link</p>
            </div>

            <div className="bg-slate-50 border rounded-2xl p-4">
              <p className="font-black">☁️ Reliable</p>
              <p className="text-sm text-slate-500">Available 24/7</p>
            </div>
          </div>

          <div className="mt-8 flex justify-between text-sm text-slate-500">
            <span>Free Trial: 100 uploads • Guest links valid for 3 days</span>
            <span>Registered account • Links valid for 30 days</span>
          </div>
        </section>
      </div>
    </main>
  );
}