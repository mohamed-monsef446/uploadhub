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

export default function SmartCapsuleUpload() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const folderInputRef = useRef<HTMLInputElement | null>(null);

  const [user, setUser] = useState<User | null>(null);
  const [items, setItems] = useState<FileList | File[] | null>(null);

  const [capsuleName, setCapsuleName] = useState("My Smart Capsule");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("📦");
  const [color, setColor] = useState("purple");
  const [expiryDays, setExpiryDays] = useState("30");
  const [downloadLimit, setDownloadLimit] = useState("0");

  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadedBytes, setUploadedBytes] = useState(0);
  const [totalBytes, setTotalBytes] = useState(0);

  const [shareLink, setShareLink] = useState("");
  const [copied, setCopied] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const savedUser = localStorage.getItem("uploadhub_user");
    if (savedUser) setUser(JSON.parse(savedUser));
  }, []);

  const selectedFiles = items ? Array.from(items) : [];

  const handleSelectedFiles = (files: FileList | File[] | null) => {
    if (!files || files.length === 0) return;

    setItems(files);
    setTotalBytes(Array.from(files).reduce((sum, file) => sum + file.size, 0));
    setProgress(0);
    setUploadedBytes(0);
    setShareLink("");
    setMessage("");
  };

  const clearFiles = () => {
    setItems(null);
    setTotalBytes(0);
    setProgress(0);
    setUploadedBytes(0);
    setShareLink("");
    setMessage("");

    if (fileInputRef.current) fileInputRef.current.value = "";
    if (folderInputRef.current) folderInputRef.current.value = "";
  };

  const uploadCapsule = () => {
    if (!items || items.length === 0) {
      setMessage("Please select files or a folder first.");
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

    formData.append("capsuleName", capsuleName);
    formData.append("description", description);
    formData.append("icon", icon);
    formData.append("color", color);
    formData.append("expiryDays", expiryDays);
    formData.append("downloadLimit", downloadLimit);

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
          const appUrl =
            process.env.NEXT_PUBLIC_APP_URL || window.location.origin;

          setShareLink(`${appUrl}${data.url}`);
          setProgress(100);
          setUploadedBytes(totalBytes);
        } else {
          setMessage(data.message || "Upload failed.");
        }
      } catch {
        setMessage("Upload failed.");
      }

      setIsUploading(false);
    };

    xhr.onerror = () => {
      setMessage("Server error.");
      setIsUploading(false);
    };

    xhr.send(formData);
  };

  const copyLink = async () => {
    if (!shareLink) return;

    await navigator.clipboard.writeText(shareLink);
    setCopied(true);

    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 p-6">
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => handleSelectedFiles(e.target.files)}
      />

      <input
        ref={folderInputRef}
        type="file"
        multiple
        {...({ webkitdirectory: "" } as any)}
        className="hidden"
        onChange={(e) => handleSelectedFiles(e.target.files)}
      />

      <div className="max-w-7xl mx-auto">
        <header className="flex justify-between items-center mb-8 border-b pb-6">
          <div>
            <h1 className="text-4xl font-black text-slate-900">
              Upload Hub
            </h1>
            <p className="text-slate-500 font-semibold">
              Create your smart transfer capsule
            </p>
          </div>

          <div className="flex gap-3">
            {user && (
              <a
                href="/dashboard"
                className="px-5 py-3 rounded-2xl bg-white border text-blue-700 font-black shadow"
              >
                📊 Dashboard
              </a>
            )}

            {!user && (
              <>
                <a
                  href="/login"
                  className="px-5 py-3 rounded-2xl bg-slate-900 text-white font-black shadow"
                >
                  Login
                </a>

                <a
                  href="/register"
                  className="px-5 py-3 rounded-2xl bg-green-600 text-white font-black shadow"
                >
                  Register
                </a>
              </>
            )}
          </div>
        </header>

        <div className="grid lg:grid-cols-[420px_1fr] gap-8">
          <section className="bg-white rounded-[32px] shadow-xl border p-6">
            <h2 className="text-2xl font-black mb-5">
              📦 Capsule Details
            </h2>

            <label className="font-bold text-sm">Capsule Name</label>
            <input
              value={capsuleName}
              onChange={(e) => setCapsuleName(e.target.value)}
              className="w-full border rounded-2xl px-4 py-3 mt-2 mb-4"
              placeholder="Legal Documents"
            />

            <label className="font-bold text-sm">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full border rounded-2xl px-4 py-3 mt-2 mb-4 h-24"
              placeholder="Short note about this capsule"
            />

            <label className="font-bold text-sm">Choose Icon</label>
            <div className="grid grid-cols-8 gap-2 mt-2 mb-4">
              {["📦", "📁", "📄", "📸", "🎬", "🎵", "💼", "🔒"].map((item) => (
                <button
                  key={item}
                  onClick={() => setIcon(item)}
                  className={`h-11 rounded-xl border text-xl ${
                    icon === item
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white"
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>

            <label className="font-bold text-sm">Choose Color</label>
            <div className="grid grid-cols-6 gap-2 mt-2 mb-4">
              {[
                ["purple", "bg-purple-600"],
                ["blue", "bg-blue-600"],
                ["green", "bg-green-600"],
                ["orange", "bg-orange-500"],
                ["red", "bg-red-600"],
                ["dark", "bg-slate-900"],
              ].map(([name, className]) => (
                <button
                  key={name}
                  onClick={() => setColor(name)}
                  className={`h-10 rounded-xl ${className} ${
                    color === name ? "ring-4 ring-slate-300" : ""
                  }`}
                />
              ))}
            </div>

            <label className="font-bold text-sm">Expiration</label>
            <select
              value={expiryDays}
              onChange={(e) => setExpiryDays(e.target.value)}
              className="w-full border rounded-2xl px-4 py-3 mt-2 mb-4"
            >
              <option value="1">1 Day</option>
              <option value="3">3 Days</option>
              <option value="7">7 Days</option>
              <option value="15">15 Days</option>
              <option value="30">30 Days</option>
              <option value="90">90 Days</option>
            </select>

            <label className="font-bold text-sm">Download Limit</label>
            <select
              value={downloadLimit}
              onChange={(e) => setDownloadLimit(e.target.value)}
              className="w-full border rounded-2xl px-4 py-3 mt-2"
            >
              <option value="0">Unlimited</option>
              <option value="1">1 Download</option>
              <option value="5">5 Downloads</option>
              <option value="10">10 Downloads</option>
              <option value="20">20 Downloads</option>
            </select>
          </section>

          <section className="bg-white rounded-[32px] shadow-xl border p-6">
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                handleSelectedFiles(Array.from(e.dataTransfer.files));
              }}
              className={`border-2 border-dashed rounded-[28px] p-10 text-center transition ${
                isDragging
                  ? "border-blue-600 bg-blue-50 scale-[1.01]"
                  : "border-blue-200 bg-gradient-to-br from-blue-50 to-purple-50"
              }`}
            >
              <div className="text-7xl mb-4">{icon}</div>

              <h2 className="text-3xl font-black text-slate-900">
                Drop files into your capsule
              </h2>

              <p className="text-slate-500 mt-2 mb-6">
                Upload files or full folders in one smart capsule.
              </p>

              <div className="grid sm:grid-cols-2 gap-4 max-w-lg mx-auto">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-blue-600 text-white px-6 py-4 rounded-2xl font-black shadow"
                >
                  📄 Choose Files
                </button>

                <button
                  onClick={() => folderInputRef.current?.click()}
                  className="bg-purple-600 text-white px-6 py-4 rounded-2xl font-black shadow"
                >
                  📁 Choose Folder
                </button>
              </div>
            </div>

            {selectedFiles.length > 0 && (
              <div className="mt-6 bg-slate-50 border rounded-3xl p-5">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <p className="font-black text-slate-900">
                      {selectedFiles.length} item(s) selected
                    </p>
                    <p className="text-slate-500">
                      Total size: {formatBytes(totalBytes)}
                    </p>
                  </div>

                  <button
                    onClick={clearFiles}
                    className="text-red-600 font-black"
                  >
                    Clear
                  </button>
                </div>

                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {selectedFiles.slice(0, 6).map((file, index) => (
                    <div
                      key={`${file.name}-${index}`}
                      className="bg-white border rounded-2xl p-4 flex justify-between gap-4"
                    >
                      <p className="font-bold break-all">{file.name}</p>
                      <p className="text-slate-500 text-sm whitespace-nowrap">
                        {formatBytes(file.size)}
                      </p>
                    </div>
                  ))}

                  {selectedFiles.length > 6 && (
                    <p className="text-center text-slate-500 text-sm">
                      + {selectedFiles.length - 6} more item(s)
                    </p>
                  )}
                </div>
              </div>
            )}

            <button
              onClick={uploadCapsule}
              disabled={isUploading || selectedFiles.length === 0}
              className="mt-6 w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-5 rounded-3xl font-black text-xl shadow-xl disabled:from-gray-400 disabled:to-gray-400"
            >
              {isUploading ? "Creating Capsule..." : "🚀 Create Capsule"}
            </button>

            {(isUploading || progress > 0) && (
              <div className="mt-6 bg-slate-50 border rounded-3xl p-5">
                <div className="flex justify-between font-black mb-2">
                  <span>Uploading</span>
                  <span>{progress}%</span>
                </div>

                <div className="h-4 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-4 bg-gradient-to-r from-blue-600 to-purple-600"
                    style={{ width: `${progress}%` }}
                  />
                </div>

                <p className="text-center text-slate-500 mt-3">
                  {formatBytes(uploadedBytes)} / {formatBytes(totalBytes)}
                </p>
              </div>
            )}

            {shareLink && (
              <div className="mt-6 bg-green-50 border border-green-200 rounded-3xl p-6">
                <h3 className="text-2xl font-black text-green-700 mb-3">
                  ✅ Capsule Created
                </h3>

                <div className="bg-white border rounded-2xl p-4 break-all text-blue-700 text-sm mb-4">
                  {shareLink}
                </div>

                <div className="grid sm:grid-cols-3 gap-3">
                  <button
                    onClick={copyLink}
                    className="bg-blue-600 text-white py-3 rounded-2xl font-black"
                  >
                    {copied ? "Copied" : "Copy Link"}
                  </button>

                  <a
                    href={shareLink}
                    target="_blank"
                    className="text-center bg-slate-900 text-white py-3 rounded-2xl font-black"
                  >
                    Open
                  </a>

                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(
                      `Files shared with you: ${shareLink}`
                    )}`}
                    target="_blank"
                    className="text-center bg-green-600 text-white py-3 rounded-2xl font-black"
                  >
                    WhatsApp
                  </a>
                </div>
              </div>
            )}

            {message && (
              <p className="mt-4 text-red-600 font-bold text-center">
                {message}
              </p>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}