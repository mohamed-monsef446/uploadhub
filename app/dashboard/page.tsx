"use client";

import { useEffect, useState } from "react";

type User = {
  id: string;
  name: string;
  email: string;
  plan: string;
};

type UploadedFile = {
  name: string;
  size: number;
  type: string;
};

type Folder = {
  _id: string;
  folderId: string;
  capsuleName?: string;
  filesCount: number;
  files?: UploadedFile[];
  views: number;
  downloads: number;
  createdAt: string;
  expiresAt: string;
};

function formatBytes(bytes: number) {
  if (!bytes) return "0 Bytes";
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
}

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [search, setSearch] = useState("");
  const [copiedId, setCopiedId] = useState("");

  const [stats, setStats] = useState({
    totalUploads: 0,
    activeLinks: 0,
    totalDownloads: 0,
    totalViews: 0,
    storageUsed: 0,
  });

  const loadDashboard = (userId: string) => {
    fetch(`/api/dashboard?userId=${userId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setStats(data.stats);
          setFolders(data.folders);
        }
      });
  };

  useEffect(() => {
    const savedUser = localStorage.getItem("uploadhub_user");

    if (!savedUser) {
      window.location.href = "/login";
      return;
    }

    const currentUser = JSON.parse(savedUser);
    setUser(currentUser);
    loadDashboard(currentUser.id);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("uploadhub_user");
    window.location.href = "/";
  };

  const copyLink = async (folderId: string) => {
    const link = `${window.location.origin}/folder/${folderId}`;
    await navigator.clipboard.writeText(link);
    setCopiedId(folderId);
    setTimeout(() => setCopiedId(""), 2000);
  };

  const deleteFolder = async (folderId: string) => {
    if (!user) return;

    const ok = confirm("Delete this file link permanently?");
    if (!ok) return;

    const res = await fetch(
      `/api/delete-folder?folderId=${folderId}&userId=${user.id}`,
      { method: "DELETE" }
    );

    const data = await res.json();

    if (data.success) {
      loadDashboard(user.id);
    } else {
      alert(data.message || "Delete failed");
    }
  };

  const getDaysLeft = (expiresAt: string) => {
    const diff = new Date(expiresAt).getTime() - Date.now();
    if (diff <= 0) return "Expired";
    return `${Math.ceil(diff / (1000 * 60 * 60 * 24))} days left`;
  };

  const isExpired = (expiresAt: string) => {
    return new Date(expiresAt).getTime() <= Date.now();
  };

  const getFileTitle = (folder: Folder) => {
    if (folder.capsuleName && folder.capsuleName !== "Untitled Capsule") {
      return folder.capsuleName;
    }

    if (folder.files && folder.files.length === 1) {
      return folder.files[0].name;
    }

    return `File ${folder.folderId.slice(0, 8)}`;
  };

  const filteredFolders = folders.filter((folder) => {
    const title = getFileTitle(folder).toLowerCase();
    return (
      title.includes(search.toLowerCase()) ||
      folder.folderId.toLowerCase().includes(search.toLowerCase())
    );
  });

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50">
      <div className="flex">
        <aside className="hidden lg:flex w-80 min-h-screen bg-white border-r border-slate-200 p-6 flex-col">
          <a href="/" className="flex items-center gap-3 mb-10">
            <div className="w-14 h-14 rounded-3xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-3xl shadow-lg">
              ☁️
            </div>

            <div>
              <h1 className="text-2xl font-black text-slate-900">
                Upload Hub
              </h1>
              <p className="text-xs text-slate-500">Smart file sharing</p>
            </div>
          </a>

          <nav className="space-y-3">
            <a
              href="/"
              className="flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-slate-100 font-bold text-slate-700"
            >
              🏠 Home
            </a>

            <a
              href="/dashboard"
              className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-black shadow-lg"
            >
              📊 Dashboard
            </a>

            <a
              href="/"
              className="flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-slate-100 font-bold text-slate-700"
            >
              ⬆ Upload File
            </a>
          </nav>

          <div className="mt-auto space-y-4">
            <div className="bg-slate-50 border rounded-3xl p-4 flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white flex items-center justify-center font-black">
                {user?.name?.charAt(0)?.toUpperCase() || "U"}
              </div>

              <div className="min-w-0">
                <p className="font-black text-slate-900 truncate">
                  {user?.name}
                </p>
                <p className="text-xs text-slate-500">{user?.plan} plan</p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-2xl font-black"
            >
              Logout
            </button>
          </div>
        </aside>

        <section className="flex-1 p-6 lg:p-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5 mb-8">
            <div>
              <p className="text-sm font-bold text-blue-600 mb-1">
                Welcome back
              </p>

              <h1 className="text-4xl lg:text-5xl font-black text-slate-900">
                {user?.name || "Dashboard"} 👋
              </h1>

              <p className="text-slate-500 mt-2">
                Manage your uploaded files and sharing links.
              </p>
            </div>

            <a
              href="/"
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-4 rounded-2xl font-black shadow-xl text-center"
            >
              + Upload File
            </a>
          </div>

          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-3xl shadow-lg border p-6">
              <p className="text-slate-500 font-bold">Total Files</p>
              <h2 className="text-4xl font-black mt-3">{stats.totalUploads}</h2>
            </div>

            <div className="bg-white rounded-3xl shadow-lg border p-6">
              <p className="text-slate-500 font-bold">Total Views</p>
              <h2 className="text-4xl font-black mt-3">{stats.totalViews}</h2>
            </div>

            <div className="bg-white rounded-3xl shadow-lg border p-6">
              <p className="text-slate-500 font-bold">Downloads</p>
              <h2 className="text-4xl font-black mt-3">
                {stats.totalDownloads}
              </h2>
            </div>

            <div className="bg-white rounded-3xl shadow-lg border p-6">
              <p className="text-slate-500 font-bold">Storage Used</p>
              <h2 className="text-3xl font-black mt-3">
                {formatBytes(stats.storageUsed)}
              </h2>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-xl border p-6">
            <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 mb-6">
              <div>
                <h2 className="text-3xl font-black text-slate-900">
                  My Files
                </h2>
                <p className="text-slate-500 text-sm">
                  Open, download, copy or delete your uploaded file links.
                </p>
              </div>

              <input
                type="text"
                placeholder="Search files..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="border rounded-2xl px-4 py-3 w-full sm:w-80"
              />
            </div>

            {filteredFolders.length === 0 ? (
              <div className="text-center py-20 text-slate-500">
                <div className="text-6xl mb-4">📭</div>
                <p className="font-bold">No files found.</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {filteredFolders.map((folder) => (
                  <div
                    key={folder._id}
                    className="border rounded-3xl p-5 bg-gradient-to-br from-slate-50 to-white hover:shadow-lg transition"
                  >
                    <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-5">
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-4xl shadow">
                          📄
                        </div>

                        <div className="min-w-0">
                          <p className="text-xl font-black text-slate-900 truncate">
                            {getFileTitle(folder)}
                          </p>

                          <p className="text-sm text-slate-500">
                            {folder.filesCount} file(s) •{" "}
                            {formatBytes(
                              folder.files?.reduce(
                                (sum, f) => sum + (f.size || 0),
                                0
                              ) || 0
                            )}
                          </p>

                          <p className="text-xs text-slate-400 mt-1">
                            Created{" "}
                            {new Date(folder.createdAt).toLocaleDateString()} •{" "}
                            {getDaysLeft(folder.expiresAt)}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-3 items-center xl:justify-end">
                        <span className="px-4 py-2 rounded-full bg-blue-100 text-blue-700 text-sm font-black">
                          👁 {folder.views || 0}
                        </span>

                        <span className="px-4 py-2 rounded-full bg-purple-100 text-purple-700 text-sm font-black">
                          ⬇ {folder.downloads || 0}
                        </span>

                        <span
                          className={`px-4 py-2 rounded-full text-sm font-black ${
                            isExpired(folder.expiresAt)
                              ? "bg-red-100 text-red-700"
                              : "bg-green-100 text-green-700"
                          }`}
                        >
                          {getDaysLeft(folder.expiresAt)}
                        </span>

                        <a
                          href={`/folder/${folder.folderId}`}
                          target="_blank"
                          title="Open"
                          className="w-11 h-11 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-black"
                        >
                          👁
                        </a>

                        <button
                          onClick={() => copyLink(folder.folderId)}
                          title="Copy Link"
                          className="w-11 h-11 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black"
                        >
                          {copiedId === folder.folderId ? "✓" : "📋"}
                        </button>

                        <a
                          href={`/api/download-folder?id=${folder.folderId}`}
                          title="Download"
                          className="w-11 h-11 rounded-2xl bg-purple-600 text-white flex items-center justify-center font-black"
                        >
                          ⬇
                        </a>

                        <button
                          onClick={() => deleteFolder(folder.folderId)}
                          title="Delete"
                          className="w-11 h-11 rounded-2xl bg-red-600 text-white flex items-center justify-center font-black"
                        >
                          🗑
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}