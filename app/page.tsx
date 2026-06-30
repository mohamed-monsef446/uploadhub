use client";

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
  const minutes = Math.floor(seconds / 60);
  const secs = Math.ceil(seconds % 60);
  return `${minutes} min ${secs} sec left`;
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
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem("uploadhub_user");
      }
    }
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

  const selectedTitle =
    selectedFiles.length === 0
      ? "No file selected"
      : selectedFiles.length === 1
      ? selectedFiles[0].file.name
      : `${selectedFiles.length} files selected`;

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

  const handleFiles = (files: FileList | File[] | null) => {
    if (!files || files.length === 0) return;

    const nextFiles = Array.from(files).map((file: any) => ({
      file,
      path: file.webkitRelativePath || file.name,
    }));

    setSelectedFiles(nextFiles);
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

  const uploadFiles = () => {
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
    <main className="min-h-screen overflow-hidden bg-[#f4f3ef] text-slate-950">
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

      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute left-[-120px] top-[-80px] h-[420px] w-[420px] rounded-full bg-blue-200/60 blur-3xl" />
        <div className="absolute right-[-180px] top-[80px] h-[560px] w-[560px] rounded-full bg-violet-200/70 blur-3xl" />
        <div className="absolute bottom-[-220px] left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-cyan-100 blur-3xl" />
      </div>

      <header className="fixed left-0 right-0 top-0 z-30 px-6 py-5">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <a href="/" className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-2xl text-white shadow-xl">
              ☁️
            </div>

            <div>
              <h1 className="text-2xl font-black tracking-tight">UploadHub</h1>
              <p className="text-xs font-bold text-slate-500">
                Smart file sharing
              </p>
            </div>
          </a>

          <nav className="flex items-center gap-2 rounded-full border border-slate-950 bg-white/90 p-1 shadow-sm backdrop-blur">
            {user && (
              <a
                href="/dashboard"
                className="rounded-full px-5 py-2.5 text-sm font-black text-slate-800 hover:bg-slate-100"
              >
                Dashboard
              </a>
            )}

            {!user ? (
              <>
                <a
                  href="/login"
                  className="rounded-full px-5 py-2.5 text-sm font-black text-slate-800 hover:bg-slate-100"
                >
                  Login
                </a>

                <a
                  href="/register"
                  className="rounded-full bg-slate-950 px-5 py-2.5 text-sm font-black text-white"
                >
                  Register
                </a>
              </>
            ) : (
              <button
                onClick={handleLogout}
                className="rounded-full bg-red-600 px-5 py-2.5 text-sm font-black text-white hover:bg-red-700"
              >
                Logout
              </button>
            )}
          </nav>
        </div>
      </header>

      <section className="mx-auto grid min-h-screen max-w-7xl gap-10 px-6 pb-16 pt-28 lg:grid-cols-[430px_1fr] lg:items-center">
        <div className="relative">
          <div className="absolute -inset-8 rounded-[48px] bg-white/40 blur-2xl" />

          <div className="relative rounded-[36px] border border-slate-950 bg-white/95 p-5 shadow-[0_30px_90px_rgba(15,23,42,0.18)] backdrop-blur">
            {!isUploading && !shareLink && (
              <div>
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-sm font-black text-slate-500">
                    Send large files
                  </p>

                  <button
                    onClick={resetUpload}
                    className="rounded-full px-3 py-1 text-xs font-black text-slate-400 hover:bg-slate-100"
                  >
                    Reset
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="rounded-[28px] bg-blue-50 p-5 text-left transition hover:-translate-y-1 hover:bg-blue-100"
                  >
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-2xl text-white">
                      +
                    </div>
                    <p className="font-black">Add files</p>
                    <p className="mt-1 text-xs font-bold text-slate-500">
                      Select one or more
                    </p>
                  </button>

                  <button
                    onClick={() => folderInputRef.current?.click()}
                    className="rounded-[28px] bg-purple-50 p-5 text-left transition hover:-translate-y-1 hover:bg-purple-100"
                  >
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-600 text-2xl text-white">
                      📁
                    </div>
                    <p className="font-black">Add folder</p>
                    <p className="mt-1 text-xs font-bold text-slate-500">
                      Keep structure
                    </p>
                  </button>
                </div>

                <div
                  onDragOver={(event) => {
                    event.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  className={`mt-4 rounded-[30px] border-2 border-dashed p-8 text-center transition ${
                    isDragging
                      ? "scale-[1.02] border-blue-600 bg-blue-50"
                      : "border-slate-300 bg-slate-50"
                  }`}
                >
                  <div className="text-5xl">⬆️</div>
                  <p className="mt-3 text-xl font-black">Drag & drop here</p>
                  <p className="text-sm font-medium text-slate-500">
                    Files or complete folders
                  </p>
                </div>

                {selectedFiles.length > 0 && (
                  <div className="mt-4 rounded-[28px] border border-slate-950 bg-white p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-lg font-black">
                          {selectedTitle}
                        </p>
                        <p className="text-sm font-medium text-slate-500">
                          {selectedFiles.length} item(s) •{" "}
                          {formatBytes(totalBytes)}
                        </p>
                      </div>

                      <button
                        onClick={resetUpload}
                        className="rounded-full border border-slate-950 px-4 py-2 text-sm font-black hover:bg-slate-100"
                      >
                        Remove
                      </button>
                    </div>

                    <div className="mt-4 max-h-44 space-y-2 overflow-y-auto pr-1">
                      {selectedFiles.slice(0, 6).map((item, index) => (
                        <div
                          key={`${item.path}-${index}`}
                          className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3"
                        >
                          <span className="text-2xl">
                            {getFileIcon(item.file.name)}
                          </span>

                          <div className="min-w-0">
                            <p className="truncate text-sm font-black">
                              {item.file.name}
                            </p>
                            <p className="text-xs font-bold text-slate-500">
                              {formatBytes(item.file.size)}
                            </p>
                          </div>
                        </div>
                      ))}

                      {selectedFiles.length > 6 && (
                        <p className="text-center text-xs font-bold text-slate-500">
                          + {selectedFiles.length - 6} more item(s)
                        </p>
                      )}
                    </div>
                  </div>
                )}

                <button
                  onClick={uploadFiles}
                  className="mt-4 w-full rounded-[28px] bg-blue-600 py-5 text-lg font-black text-white shadow-xl transition hover:-translate-y-0.5 hover:bg-blue-700"
                >
                  Transfer
                </button>

                <p className="mt-4 text-center text-xs font-bold text-slate-500">
                  {user
                    ? "Links stay active for 30 days."
                    : "Guest links stay active for 3 days."}
                </p>

                {message && (
                  <p className="mt-4 rounded-2xl bg-red-50 p-3 text-center text-sm font-black text-red-700">
                    {message}
                  </p>
                )}
              </div>
            )}

            {isUploading && (
              <div className="py-8 text-center">
                <div className="mx-auto flex h-48 w-48 items-center justify-center rounded-full border-[16px] border-slate-200 bg-white shadow-inner">
                  <div>
                    <p className="text-6xl font-black">{progress}%</p>
                    <p className="mt-1 text-sm font-black text-slate-500">
                      Transferring...
                    </p>
                  </div>
                </div>

                <p className="mt-7 text-lg font-black text-slate-800">
                  {formatBytes(uploadedBytes)} of {formatBytes(totalBytes)}
                </p>

                <p className="mt-1 text-sm font-bold text-slate-500">
                  {formatBytes(uploadSpeed)}/s •{" "}
                  {estimateTime(remainingSeconds)}
                </p>

                <div className="mt-7 h-4 overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="h-4 rounded-full bg-blue-600 transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>

                <button
                  onClick={resetUpload}
                  className="mt-7 w-full rounded-[28px] border border-slate-950 py-4 font-black text-slate-800 hover:bg-slate-50"
                >
                  Cancel
                </button>
              </div>
            )}

            {!isUploading && shareLink && (
              <div className="py-5">
                <div className="mx-auto mb-6 flex h-28 w-28 items-center justify-center rounded-full bg-green-100 text-6xl">
                  ✓
                </div>

                <h2 className="text-center text-3xl font-black">
                  Transfer complete
                </h2>

                <p className="mt-2 text-center text-sm font-medium text-slate-500">
                  Your files are ready to share.
                </p>

                <div className="mt-6 rounded-[28px] border border-slate-950 bg-slate-50 p-4">
                  <p className="truncate text-sm font-black text-blue-700">
                    {shareLink}
                  </p>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <button
                    onClick={copyLink}
                    className="rounded-2xl bg-blue-600 px-4 py-4 font-black text-white"
                  >
                    {copied ? "Copied" : "Copy"}
                  </button>

                  <a
                    href={shareLink}
                    target="_blank"
                    className="rounded-2xl bg-slate-950 px-4 py-4 text-center font-black text-white"
                  >
                    Open
                  </a>

                  <a
                    href={folderId ? `/api/download-folder?id=${folderId}` : shareLink}
                    className="rounded-2xl bg-purple-600 px-4 py-4 text-center font-black text-white"
                  >
                    Download
                  </a>

                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(
                      shareLink
                    )}`}
                    target="_blank"
                    className="rounded-2xl bg-green-600 px-4 py-4 text-center font-black text-white"
                  >
                    WhatsApp
                  </a>
                </div>

                <div className="mt-6 border-t border-slate-300 pt-5">
                  <p className="mb-2 text-sm font-black">Send by email</p>

                  <div className="flex gap-2">
                    <input
                      value={emailTo}
                      onChange={(event) => setEmailTo(event.target.value)}
                      type="email"
                      placeholder="recipient@email.com"
                      className="min-w-0 flex-1 rounded-2xl border border-slate-950 px-4 py-3"
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
                  className="mt-5 w-full rounded-[28px] border border-slate-950 py-4 font-black hover:bg-slate-50"
                >
                  Send another
                </button>
              </div>
            )}
          </div>
        </div>
<div className="hidden lg:block">
  <p className="mb-4 text-sm font-black uppercase tracking-[0.35em] text-blue-600">
    UploadHub
  </p>

  <h2 className="max-w-4xl text-7xl font-black leading-[0.92] tracking-tight text-slate-950 xl:text-8xl">
    Send large files in seconds.
  </h2>

  <p className="mt-8 max-w-2xl text-xl font-medium leading-8 text-slate-600">
    Upload documents, folders, images, videos, and business files.
    Share them instantly with clean links, previews, downloads, and tracking.
  </p>

  <div className="mt-10 grid max-w-2xl grid-cols-3 gap-4">
    <div className="rounded-3xl border border-slate-950 bg-white/80 p-5 shadow-sm">
      <p className="text-3xl">⚡</p>
      <p className="mt-4 font-black">Fast</p>
      <p className="text-sm text-slate-500">Live upload progress</p>
    </div>

    <div className="rounded-3xl border border-slate-950 bg-white/80 p-5 shadow-sm">
      <p className="text-3xl">🔗</p>
      <p className="mt-4 font-black">Share</p>
      <p className="text-sm text-slate-500">One secure link</p>
    </div>

    <div className="rounded-3xl border border-slate-950 bg-white/80 p-5 shadow-sm">
      <p className="text-3xl">📊</p>
      <p className="mt-4 font-black">Track</p>
      <p className="text-sm text-slate-500">Views & downloads</p>
    </div>
  </div>

  <div className="mt-10 rounded-[36px] border border-slate-950 bg-slate-950 p-7 text-white shadow-2xl">
    <p className="text-sm font-black uppercase tracking-[0.25em] text-blue-300">
      Ready to send
    </p>
    <p className="mt-3 text-2xl font-black">
      Add files, transfer, copy the link — done.
    </p>
  </div>
</div>
</section>
</main>
);
}