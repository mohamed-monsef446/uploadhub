"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type User = {
  id: string;
  name: string;
  email: string;
  plan: string;
};

type SelectedFile = {
  file: File;
  path: string;
};

type UploadResponse = {
  success: boolean;
  message?: string;
  folderId?: string;
  url?: string;
  error?: string;
};

function formatBytes(bytes: number) {
  if (!bytes) return "0 Bytes";
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
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

function estimateTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds <= 0) return "Calculating...";
  if (seconds < 60) return `${Math.ceil(seconds)} sec left`;
  const min = Math.floor(seconds / 60);
  const sec = Math.ceil(seconds % 60);
  return `${min} min ${sec} sec left`;
}

export default function Home() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const folderInputRef = useRef<HTMLInputElement | null>(null);
  const xhrRef = useRef<XMLHttpRequest | null>(null);

  const [user, setUser] = useState<User | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadedBytes, setUploadedBytes] = useState(0);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [shareLink, setShareLink] = useState("");
  const [folderId, setFolderId] = useState("");
  const [message, setMessage] = useState("");
  const [copied, setCopied] = useState(false);
  const [emailTo, setEmailTo] = useState("");

  useEffect(() => {
    const savedUser = localStorage.getItem("uploadhub_user");
    if (savedUser) setUser(JSON.parse(savedUser));
  }, []);

  const totalBytes = useMemo(
    () => selectedFiles.reduce((sum, item) => sum + item.file.size, 0),
    [selectedFiles]
  );

  const uploadSpeed = useMemo(() => {
    if (!startedAt || uploadedBytes <= 0) return 0;
    const seconds = (Date.now() - startedAt) / 1000;
    return seconds > 0 ? uploadedBytes / seconds : 0;
  }, [startedAt, uploadedBytes]);

  const remainingSeconds = useMemo(() => {
    if (!uploadSpeed || !totalBytes) return 0;
    return (totalBytes - uploadedBytes) / uploadSpeed;
  }, [totalBytes, uploadedBytes, uploadSpeed]);

  const primaryFileName =
    selectedFiles.length === 1
      ? selectedFiles[0].file.name
      : selectedFiles.length > 1
      ? `${selectedFiles.length} files selected`
      : "No file selected";

  const handleLogout = () => {
    localStorage.removeItem("uploadhub_user");
    setUser(null);
  };

  const resetUpload = () => {
    xhrRef.current?.abort();
    xhrRef.current = null;

    setSelectedFiles([]);
    setIsDragging(false);
    setIsUploading(false);
    setProgress(0);
    setUploadedBytes(0);
    setStartedAt(null);
    setShareLink("");
    setFolderId("");
    setMessage("");
    setCopied(false);
    setEmailTo("");

    if (fileInputRef.current) fileInputRef.current.value = "";
    if (folderInputRef.current) folderInputRef.current.value = "";
  };

  const buildSelectedFiles = (files: FileList | File[]) => {
    return Array.from(files).map((file: any) => ({
      file,
      path: file.webkitRelativePath || file.name,
    }));
  };

  const handleFiles = (files: FileList | File[] | null) => {
    if (!files || files.length === 0) return;

    setSelectedFiles(buildSelectedFiles(files));
    setShareLink("");
    setFolderId("");
    setMessage("");
    setProgress(0);
    setUploadedBytes(0);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    handleFiles(event.dataTransfer.files);
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

    const subject = encodeURIComponent(
      `${user?.name || "Someone"} shared files with you`
    );

    const body = encodeURIComponent(
      `Hello,\n\n${user?.name || "Someone"} shared files with you.\n\n${shareLink}\n\nUploadHub`
    );

    window.location.href = `mailto:${emailTo}?subject=${subject}&body=${body}`;
  };

  const uploadFiles = async () => {
    if (selectedFiles.length === 0) {
      setMessage("Please add files first.");
      return;
    }

    setIsUploading(true);
    setMessage("");
    setShareLink("");
    setFolderId("");
    setProgress(0);
    setUploadedBytes(0);
    setStartedAt(Date.now());

    const formData = new FormData();

    selectedFiles.forEach((item) => {
      formData.append("files", item.file);
      formData.append("paths", item.path);
    });

    if (user) formData.append("userId", user.id);

    const xhr = new XMLHttpRequest();
    xhrRef.current = xhr;

    xhr.open("POST", "/api/upload");

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        setProgress(Math.round((event.loaded / event.total) * 100));
        setUploadedBytes(event.loaded);
      }
    };

    xhr.onload = () => {
      try {
        const data: UploadResponse = JSON.parse(xhr.responseText);

        if (data.success && data.url) {
          const finalLink = `${window.location.origin}${data.url}`;
          setShareLink(finalLink);
          setFolderId(data.folderId || "");
          setProgress(100);
          setUploadedBytes(totalBytes);
          setMessage("Upload completed successfully.");
        } else {
          setMessage(data.error || data.message || "Upload failed.");
        }
      } catch {
        setMessage("Upload failed.");
      }

      setIsUploading(false);
      xhrRef.current = null;
    };

    xhr.onerror = () => {
      setMessage("Server error.");
      setIsUploading(false);
      xhrRef.current = null;
    };

    xhr.onabort = () => {
      setMessage("Upload canceled.");
      setIsUploading(false);
      xhrRef.current = null;
    };

    xhr.send(formData);
  };

  return (
    <main className="min-h-screen overflow-hidden bg-[#f6f7fb] text-slate-950">
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(event) => handleFiles(event.target.files)}
      />

      <input
        ref={folderInputRef}
        type="file"
        multiple
        {...({ webkitdirectory: "" } as any)}
        className="hidden"
        onChange={(event) => handleFiles(event.target.files)}
      />

      <header className="fixed left-0 right-0 top-0 z-30 px-6 py-5">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <a href="/" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-2xl text-white shadow-lg">
              ☁️
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight">UploadHub</h1>
              <p className="text-xs font-bold text-slate-500">
                Smart file sharing
              </p>
            </div>
          </a>

          <nav className="flex items-center gap-2 rounded-full border bg-white/85 p-1 shadow-sm backdrop-blur">
            {user && (
              <a
                href="/dashboard"
                className="rounded-full px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-100"
              >
                Dashboard
              </a>
            )}

            {!user ? (
              <>
                <a
                  href="/login"
                  className="rounded-full px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-100"
                >
                  Login
                </a>
                <a
                  href="/register"
                  className="rounded-full bg-slate-950 px-4 py-2 text-sm font-black text-white"
                >
                  Register
                </a>
              </>
            ) : (
              <button
                onClick={handleLogout}
                className="rounded-full bg-red-600 px-4 py-2 text-sm font-black text-white"
              >
                Logout
              </button>
            )}
          </nav>
        </div>
      </header>

      <section className="relative min-h-screen px-6 pt-28">
        <div className="absolute inset-0 -z-10">
          <div className="absolute left-[-120px] top-[150px] h-[420px] w-[420px] rounded-full bg-blue-200 blur-3xl" />
          <div className="absolute right-[-120px] top-[80px] h-[520px] w-[520px] rounded-full bg-purple-200 blur-3xl" />
          <div className="absolute bottom-[-160px] left-1/2 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-cyan-100 blur-3xl" />
        </div>

        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[390px_1fr] lg:items-center">
          <div className="rounded-[34px] border bg-white/95 p-5 shadow-2xl backdrop-blur">
            {!shareLink && !isUploading && (
              <>
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-sm font-black text-slate-500">
                    Send large files
                  </p>
                  <button
                    onClick={resetUpload}
                    className="rounded-full px-3 py-1 text-xs font-bold text-slate-400 hover:bg-slate-100"
                  >
                    Reset
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="rounded-3xl bg-blue-50 p-5 text-left hover:bg-blue-100"
                  >
                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-2xl text-white">
                      +
                    </div>
                    <p className="font-black">Add files</p>
                  </button>

                  <button
                    onClick={() => folderInputRef.current?.click()}
                    className="rounded-3xl bg-purple-50 p-5 text-left hover:bg-purple-100"
                  >
                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-600 text-2xl text-white">
                      📁
                    </div>
                    <p className="font-black">Add folder</p>
                  </button>
                </div>

                <div
                  onDragOver={(event) => {
                    event.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  className={`mt-4 rounded-3xl border-2 border-dashed p-6 text-center transition ${
                    isDragging
                      ? "border-blue-600 bg-blue-50"
                      : "border-slate-200 bg-slate-50"
                  }`}
                >
                  <div className="text-5xl">⬆️</div>
                  <p className="mt-3 font-black">Drag and drop here</p>
                  <p className="text-sm text-slate-500">
                    Files or complete folders
                  </p>
                </div>

                {selectedFiles.length > 0 && (
                  <div className="mt-4 rounded-3xl border bg-white p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-lg font-black">
                          {primaryFileName}
                        </p>
                        <p className="text-sm text-slate-500">
                          {selectedFiles.length} item(s) •{" "}
                          {formatBytes(totalBytes)}
                        </p>
                      </div>
                      <button
                        onClick={resetUpload}
                        className="rounded-full bg-slate-100 px-3 py-2 text-sm font-bold"
                      >
                        Remove
                      </button>
                    </div>

                    <div className="mt-4 max-h-40 space-y-2 overflow-y-auto">
                      {selectedFiles.slice(0, 5).map((item, index) => (
                        <div
                          key={`${item.path}-${index}`}
                          className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3"
                        >
                          <span className="text-2xl">
                            {getFileIcon(item.file.name)}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-bold">
                              {item.file.name}
                            </p>
                            <p className="text-xs text-slate-500">
                              {formatBytes(item.file.size)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  onClick={uploadFiles}
                  className="mt-4 w-full rounded-3xl bg-blue-600 py-5 text-lg font-black text-white shadow-lg hover:bg-blue-700"
                >
                  Transfer
                </button>

                <p className="mt-4 text-center text-xs text-slate-500">
                  {user
                    ? "Links stay active for 30 days."
                    : "Guest links stay active for 3 days."}
                </p>
              </>
            )}

            {isUploading && (
              <div className="py-8 text-center">
                <div className="mx-auto flex h-44 w-44 items-center justify-center rounded-full border-[14px] border-slate-200">
                  <div className="text-center">
                    <p className="text-5xl font-black">{progress}%</p>
                    <p className="mt-1 text-sm font-bold text-slate-500">
                      Transferring...
                    </p>
                  </div>
                </div>

                <p className="mt-6 font-bold text-slate-700">
                  {formatBytes(uploadedBytes)} of {formatBytes(totalBytes)}
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  {formatBytes(uploadSpeed)}/s • {estimateTime(remainingSeconds)}
                </p>

                <div className="mt-6 h-3 overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="h-3 rounded-full bg-blue-600 transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>

                <button
                  onClick={resetUpload}
                  className="mt-6 w-full rounded-3xl border py-4 font-black text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
              </div>
            )}

            {shareLink && !isUploading && (
              <div className="py-4">
                <div className="mx-auto mb-5 flex h-24 w-24 items-center justify-center rounded-full bg-green-100 text-5xl">
                  ✓
                </div>

                <h2 className="text-center text-2xl font-black">
                  Transfer complete
                </h2>
                <p className="mt-2 text-center text-sm text-slate-500">
                  Your files are ready to share.
                </p>

                <div className="mt-5 rounded-3xl border bg-slate-50 p-4">
                  <p className="truncate text-sm font-bold text-blue-700">
                    {shareLink}
                  </p>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <button
                    onClick={copyLink}
                    className="rounded-2xl bg-blue-600 px-4 py-3 font-black text-white"
                  >
                    {copied ? "Copied" : "Copy"}
                  </button>

                  <a
                    href={shareLink}
                    target="_blank"
                    className="rounded-2xl bg-slate-950 px-4 py-3 text-center font-black text-white"
                  >
                    Open
                  </a>

                  <a
                    href={folderId ? `/api/download-folder?id=${folderId}` : shareLink}
                    className="rounded-2xl bg-purple-600 px-4 py-3 text-center font-black text-white"
                  >
                    Download
                  </a>

                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(shareLink)}`}
                    target="_blank"
                    className="rounded-2xl bg-green-600 px-4 py-3 text-center font-black text-white"
                  >
                    WhatsApp
                  </a>
                </div>

                <div className="mt-5 border-t pt-5">
                  <p className="mb-2 text-sm font-black">Send by email</p>
                  <div className="flex gap-2">
                    <input
                      value={emailTo}
                      onChange={(event) => setEmailTo(event.target.value)}
                      type="email"
                      placeholder="recipient@email.com"
                      className="min-w-0 flex-1 rounded-2xl border px-4 py-3"
                    />
                    <button
                      onClick={sendByEmail}
                      className="rounded-2xl bg-slate-950 px-5 py-3 font-black text-white"
                    >
                      Send
                    </button>
                  </div>
                </div>

                <button
                  onClick={resetUpload}
                  className="mt-4 w-full rounded-3xl border py-4 font-black"
                >
                  Send another
                </button>
              </div>
            )}

            {message && !shareLink && (
              <p className="mt-4 rounded-2xl bg-red-50 p-3 text-center text-sm font-bold text-red-700">
                {message}
              </p>
            )}
          </div>

          <div className="hidden lg:block">
            <p className="mb-4 text-sm font-black uppercase tracking-[0.3em] text-blue-600">
              UploadHub V2
            </p>

            <h2 className="max-w-3xl text-7xl font-black leading-[0.92] tracking-tight text-slate-950">
              Send files beautifully, securely, and fast.
            </h2>

            <p className="mt-8 max-w-2xl text-xl font-medium leading-8 text-slate-600">
              UploadHub helps you transfer documents, folders, media, and
              business files with clean sharing links, previews, analytics, and
              secure cloud storage.
            </p>

            <div className="mt-10 grid max-w-2xl grid-cols-3 gap-4">
              <div className="rounded-3xl border bg-white/80 p-5 shadow-sm">
                <p className="text-3xl">⚡</p>
                <p className="mt-3 font-black">Fast</p>
                <p className="text-sm text-slate-500">Progress tracking</p>
              </div>

              <div className="rounded-3xl border bg-white/80 p-5 shadow-sm">
                <p className="text-3xl">🔒</p>
                <p className="mt-3 font-black">Secure</p>
                <p className="text-sm text-slate-500">Private links</p>
              </div>

              <div className="rounded-3xl border bg-white/80 p-5 shadow-sm">
                <p className="text-3xl">📊</p>
                <p className="mt-3 font-black">Tracked</p>
                <p className="text-sm text-slate-500">Views & downloads</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
