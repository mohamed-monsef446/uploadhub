"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type User = { id: string; name: string; email: string; plan: string };
type SelectedFile = { file: File; path: string };
type UploadResponse = { success: boolean; message?: string; folderId?: string; url?: string; error?: string };

function formatBytes(bytes: number) {
  if (!bytes) return "0 Bytes";
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
}

function estimateTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds <= 0) return "Calculating...";
  if (seconds < 60) return `${Math.ceil(seconds)} sec left`;
  const min = Math.floor(seconds / 60);
  const sec = Math.ceil(seconds % 60);
  return `${min} min ${sec} sec left`;
}

function fileLabel(files: SelectedFile[]) {
  if (files.length === 0) return "No files selected";
  if (files.length === 1) return files[0].file.name;
  return `${files.length} files selected`;
}

export default function Home() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const folderInputRef = useRef<HTMLInputElement | null>(null);
  const xhrRef = useRef<XMLHttpRequest | null>(null);

  const [user, setUser] = useState<User | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([]);
  const [emailTo, setEmailTo] = useState("");
  const [emailFrom, setEmailFrom] = useState("");
  const [transferTitle, setTransferTitle] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadedBytes, setUploadedBytes] = useState(0);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [shareLink, setShareLink] = useState("");
  const [folderId, setFolderId] = useState("");
  const [message, setMessage] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem("uploadhub_user");
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        setUser(parsed);
        setEmailFrom(parsed.email || "");
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

  const handleLogout = () => {
    localStorage.removeItem("uploadhub_user");
    setUser(null);
    setEmailFrom("");
  };

  const resetAll = () => {
    xhrRef.current?.abort();
    xhrRef.current = null;
    setSelectedFiles([]);
    setEmailTo("");
    setTransferTitle("");
    setIsUploading(false);
    setProgress(0);
    setUploadedBytes(0);
    setStartedAt(null);
    setShareLink("");
    setFolderId("");
    setMessage("");
    setCopied(false);
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

  const copyLink = async () => {
    if (!shareLink) return;
    await navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const openEmailDraft = (link: string) => {
    if (!emailTo) return;

    const subject = encodeURIComponent(transferTitle || "Files shared with you");
    const body = encodeURIComponent(
      `Hello,\n\n${emailFrom || "Someone"} shared files with you using UploadHub.\n\n${link}\n\nThis link expires in ${user ? "30 days" : "3 days"}.\n\nUploadHub`
    );

    window.location.href = `mailto:${emailTo}?subject=${subject}&body=${body}`;
  };

  const uploadFiles = () => {
    if (selectedFiles.length === 0) {
      setMessage("Please add files or a folder first.");
      return;
    }

    if (!emailTo.trim()) {
      setMessage("Please enter recipient email.");
      return;
    }

    if (!emailFrom.trim()) {
      setMessage("Please enter your email.");
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
    if (transferTitle) formData.append("capsuleName", transferTitle);

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
          localStorage.setItem("uploadhub_last_link", finalLink);
          localStorage.setItem("uploadhub_last_id", data.folderId || "");
          setTimeout(() => openEmailDraft(finalLink), 600);
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
    <main className="min-h-screen overflow-hidden bg-[#f6f6f3] text-slate-950">
      <input ref={fileInputRef} type="file" multiple className="hidden" onChange={(event) => handleFiles(event.target.files)} />
      <input ref={folderInputRef} type="file" multiple {...({ webkitdirectory: "" } as any)} className="hidden" onChange={(event) => handleFiles(event.target.files)} />

      <header className="fixed left-0 right-0 top-0 z-30 px-5 py-5">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <a href="/" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-2xl text-white shadow-xl">☁️</div>
            <div>
              <h1 className="text-xl font-black">UploadHub</h1>
              <p className="text-xs font-bold text-slate-500">Send large files</p>
            </div>
          </a>

          <nav className="flex items-center gap-2 rounded-full border bg-white/80 p-1 shadow-sm backdrop-blur">
            {user && <a href="/dashboard" className="rounded-full px-4 py-2 text-sm font-black text-slate-800 hover:bg-slate-100">Dashboard</a>}

            {!user ? (
              <>
                <a href="/login" className="rounded-full px-4 py-2 text-sm font-black text-slate-700 hover:bg-slate-100">Login</a>
                <a href="/register" className="rounded-full bg-slate-950 px-4 py-2 text-sm font-black text-white">Register</a>
              </>
            ) : (
              <button onClick={handleLogout} className="rounded-full bg-red-600 px-4 py-2 text-sm font-black text-white">Logout</button>
            )}
          </nav>
        </div>
      </header>

      <section className="relative min-h-screen px-5 pt-28">
        <div className="absolute inset-0 -z-10">
          <div className="absolute left-[38%] top-[18%] h-[520px] w-[520px] rounded-full bg-white/70 blur-3xl" />
          <div className="absolute right-[-120px] top-[70px] h-[520px] w-[520px] rounded-full bg-blue-100/70 blur-3xl" />
          <div className="absolute bottom-[-160px] left-[-120px] h-[420px] w-[420px] rounded-full bg-purple-100/60 blur-3xl" />
        </div>

        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[340px_1fr] lg:items-start">
          <div className="rounded-[26px] bg-white p-4 shadow-[0_18px_60px_rgba(15,23,42,0.16)]">
            {!isUploading && !shareLink && (
              <>
                <div className="mb-3 text-center text-sm font-black text-slate-400">Send files</div>

                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => fileInputRef.current?.click()} className="rounded-2xl bg-blue-50 p-4 text-center hover:bg-blue-100">
                    <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-xl text-white">+</div>
                    <p className="text-sm font-black">Add files</p>
                  </button>

                  <button onClick={() => folderInputRef.current?.click()} className="rounded-2xl bg-slate-100 p-4 text-center hover:bg-slate-200">
                    <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-xl text-white">📁</div>
                    <p className="text-sm font-black">Add folders</p>
                  </button>
                </div>

                {selectedFiles.length > 0 && (
                  <div className="mt-3 rounded-2xl border bg-slate-50 p-3">
                    <p className="truncate text-sm font-black">{fileLabel(selectedFiles)}</p>
                    <p className="text-xs font-bold text-slate-500">{selectedFiles.length} item(s) • {formatBytes(totalBytes)}</p>
                  </div>
                )}

                <div className="mt-4 space-y-3">
                  <div>
                    <label className="mb-1 block text-xs font-black text-slate-500">Email to</label>
                    <input value={emailTo} onChange={(event) => setEmailTo(event.target.value)} type="email" placeholder="recipient@email.com" className="w-full border-b border-slate-300 bg-transparent px-1 py-2 text-sm outline-none focus:border-blue-600" />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-black text-slate-500">Your email</label>
                    <input value={emailFrom} onChange={(event) => setEmailFrom(event.target.value)} type="email" placeholder="your@email.com" className="w-full border-b border-slate-300 bg-transparent px-1 py-2 text-sm outline-none focus:border-blue-600" />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-black text-slate-500">Title</label>
                    <input value={transferTitle} onChange={(event) => setTransferTitle(event.target.value)} type="text" placeholder="Transfer title" className="w-full border-b border-slate-300 bg-transparent px-1 py-2 text-sm outline-none focus:border-blue-600" />
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between rounded-2xl bg-slate-50 px-3 py-3">
                  <span className="text-sm font-black text-slate-500">Expiry</span>
                  <span className="rounded-full bg-white px-3 py-1 text-sm font-black text-blue-600">{user ? "30 days" : "3 days"}</span>
                </div>

                {message && <p className="mt-3 rounded-xl bg-red-50 p-2 text-center text-xs font-black text-red-600">{message}</p>}

                <button onClick={uploadFiles} className="mt-4 w-full rounded-2xl bg-blue-600 py-4 text-base font-black text-white shadow-lg hover:bg-blue-700">Transfer</button>
              </>
            )}

            {isUploading && (
              <div className="py-5 text-center">
                <div className="mx-auto flex h-40 w-40 items-center justify-center rounded-full border-[12px] border-slate-200">
                  <div>
                    <p className="text-5xl font-black">{progress}%</p>
                    <p className="mt-1 text-sm font-black text-slate-500">Transferring...</p>
                  </div>
                </div>

                <p className="mt-5 text-sm font-bold text-slate-600">{formatBytes(uploadedBytes)} of {formatBytes(totalBytes)}</p>
                <p className="mt-1 text-xs font-bold text-slate-400">{formatBytes(uploadSpeed)}/s • {estimateTime(remainingSeconds)}</p>

                <button onClick={resetAll} className="mt-5 w-full rounded-2xl border py-3 text-sm font-black">Cancel</button>
              </div>
            )}

            {!isUploading && shareLink && (
              <div className="py-4 text-center">
                <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-green-100 text-5xl">✓</div>

                <h2 className="text-2xl font-black">Email ready</h2>
                <p className="mt-1 text-sm font-bold text-slate-500">A mail draft opened with your link.</p>

                <div className="mt-4 rounded-2xl border bg-slate-50 p-3">
                  <p className="truncate text-xs font-black text-blue-700">{shareLink}</p>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button onClick={copyLink} className="rounded-xl bg-blue-600 px-3 py-3 text-sm font-black text-white">{copied ? "Copied" : "Copy"}</button>
                  <a href={shareLink} target="_blank" className="rounded-xl bg-slate-950 px-3 py-3 text-center text-sm font-black text-white">Open</a>
                  <a href={folderId ? `/api/download-folder?id=${folderId}` : shareLink} className="rounded-xl bg-purple-600 px-3 py-3 text-center text-sm font-black text-white">Download</a>
                  <a href={`https://wa.me/?text=${encodeURIComponent(shareLink)}`} target="_blank" className="rounded-xl bg-green-600 px-3 py-3 text-center text-sm font-black text-white">WhatsApp</a>
                </div>

                <button onClick={resetAll} className="mt-3 w-full rounded-2xl border py-3 text-sm font-black">Send another</button>
              </div>
            )}
          </div>

          <div className="hidden min-h-[640px] rounded-[38px] bg-white/60 p-8 lg:block">
            <div className="grid h-full grid-cols-[1fr_320px] gap-10">
              <div className="flex flex-col justify-end">
                <p className="mb-5 text-sm font-black uppercase tracking-[0.35em] text-blue-600">UploadHub</p>
                <h2 className="max-w-3xl text-7xl font-black leading-[0.92] tracking-tight">Send files simply.</h2>
                <p className="mt-6 max-w-xl text-xl font-medium leading-8 text-slate-600">Add files, enter emails, transfer, and share instantly.</p>
              </div>

              <div className="overflow-hidden rounded-[34px] bg-slate-200">
                <div className="h-full w-full bg-gradient-to-br from-white via-blue-50 to-purple-100" />
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
