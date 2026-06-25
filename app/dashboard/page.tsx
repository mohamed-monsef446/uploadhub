"use client";

import { useEffect, useState } from "react";

type User = {
  id: string;
  name: string;
  email: string;
  plan: string;
};

type Folder = {
  _id: string;
  folderId: string;
  filesCount: number;
  downloads: number;
  createdAt: string;
  expiresAt: string;
};

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [copiedId, setCopiedId] = useState("");

  const [stats, setStats] = useState({
    totalUploads: 0,
    activeLinks: 0,
    totalDownloads: 0,
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

    setTimeout(() => {
      setCopiedId("");
    }, 2000);
  };

  const deleteFolder = async (folderId: string) => {
    if (!user) return;

    const confirmDelete = confirm("Delete this upload permanently?");
    if (!confirmDelete) return;

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
    const now = new Date().getTime();
    const expires = new Date(expiresAt).getTime();
    const diff = expires - now;

    if (diff <= 0) return "Expired";

    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return `${days} days left`;
  };

  const isExpired = (expiresAt: string) => {
    return new Date(expiresAt).getTime() <= new Date().getTime();
  };

  const getCapsuleName = (folderId: string) => {
    return `Capsule ${folderId.slice(-6)}`;
  };

  const filteredFolders = folders
    .filter((folder) => {
      const matchesSearch =
        folder.folderId.toLowerCase().includes(search.toLowerCase()) ||
        getCapsuleName(folder.folderId)
          .toLowerCase()
          .includes(search.toLowerCase());

      if (filter === "active") {
        return matchesSearch && !isExpired(folder.expiresAt);
      }

      if (filter === "expired") {
        return matchesSearch && isExpired(folder.expiresAt);
      }

      return matchesSearch;
    })
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50">
      <div className="flex">
        <aside className="hidden lg:flex w-80 min-h-screen bg-white/90 backdrop-blur border-r border-slate-200 p-6 flex-col">
          <a href="/" className="flex items-center gap-3 mb-10">
            <div className="w-14 h-14 rounded-3xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-3xl shadow-lg">
              ☁️
            </div>

            <div>
              <h1 className="text-2xl font-black text-slate-900">
                Upload Hub
              </h1>
              <p className="text-xs text-slate-500">
                Smart transfer capsules
              </p>
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
              🚀 New Capsule
            </a>

            <a
              href="#"
              className="flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-slate-100 font-bold text-slate-700"
            >
              ⚙️ Settings
            </a>
          </nav>

          <div className="mt-auto space-y-4">
            <div className="bg-gradient-to-br from-slate-50 to-blue-50 border rounded-3xl p-5">
              <p className="text-sm text-slate-500 mb-2">Storage</p>

              <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden mb-2">
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 h-3 w-[18%]"></div>
              </div>

              <p className="text-xs text-slate-500">
                Demo usage • cloud storage next
              </p>
            </div>

            <div className="bg-slate-50 border rounded-3xl p-4 flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white flex items-center justify-center font-black">
                {user?.name?.charAt(0)?.toUpperCase() || "U"}
              </div>

              <div className="min-w-0">
                <p className="font-black text-slate-900 truncate">
                  {user?.name}
                </p>
                <p className="text-xs text-slate-500">
                  {user?.plan} plan
                </p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-2xl font-black transition"
            >
              🚪 Logout
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
                You have {stats.activeLinks} active transfer capsule(s).
              </p>
            </div>

            <a
              href="/"
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-4 rounded-2xl font-black shadow-xl hover:scale-105 active:scale-95 transition text-center"
            >
              + New Capsule
            </a>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-3xl shadow-lg border p-6 hover:shadow-xl transition">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-slate-500 font-bold">Total Uploads</p>
                  <h2 className="text-5xl font-black mt-3">
                    {stats.totalUploads}
                  </h2>
                </div>

                <div className="w-16 h-16 rounded-3xl bg-blue-100 flex items-center justify-center text-4xl">
                  ☁️
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl shadow-lg border p-6 hover:shadow-xl transition">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-slate-500 font-bold">Active Links</p>
                  <h2 className="text-5xl font-black mt-3">
                    {stats.activeLinks}
                  </h2>
                </div>

                <div className="w-16 h-16 rounded-3xl bg-green-100 flex items-center justify-center text-4xl">
                  🔗
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl shadow-lg border p-6 hover:shadow-xl transition">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-slate-500 font-bold">Downloads</p>
                  <h2 className="text-5xl font-black mt-3">
                    {stats.totalDownloads}
                  </h2>
                </div>

                <div className="w-16 h-16 rounded-3xl bg-purple-100 flex items-center justify-center text-4xl">
                  ⬇️
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-xl border p-6">
            <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 mb-6">
              <div>
                <h2 className="text-3xl font-black text-slate-900">
                  My Capsules
                </h2>

                <p className="text-slate-500 text-sm">
                  Manage your shared uploads, links, downloads and expiry.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  placeholder="🔍 Search capsules..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="border rounded-2xl px-4 py-3 w-full sm:w-80"
                />

                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="border rounded-2xl px-4 py-3 font-bold"
                >
                  <option value="all">All</option>
                  <option value="active">Active</option>
                  <option value="expired">Expired</option>
                </select>
              </div>
            </div>

            {filteredFolders.length === 0 ? (
              <div className="text-center py-20 text-slate-500">
                <div className="text-6xl mb-4">📭</div>
                <p className="font-bold">No capsules found.</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {filteredFolders.map((folder) => (
                  <div
                    key={folder._id}
                    className="group border rounded-3xl p-5 bg-gradient-to-br from-slate-50 to-white hover:shadow-lg transition"
                  >
                    <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-5">
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-4xl shadow">
                          📦
                        </div>

                        <div className="min-w-0">
                          <p className="text-xl font-black text-slate-900 truncate">
                            {getCapsuleName(folder.folderId)}
                          </p>

                          <p className="text-sm text-slate-500">
                            {folder.filesCount} file(s) • Created{" "}
                            {new Date(folder.createdAt).toLocaleDateString()}
                          </p>

                          <p className="text-xs text-slate-400 mt-1">
                            ID: {folder.folderId}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-3 items-center xl:justify-end">
                        <span
                          className={`px-4 py-2 rounded-full text-sm font-black ${
                            isExpired(folder.expiresAt)
                              ? "bg-red-100 text-red-700"
                              : "bg-green-100 text-green-700"
                          }`}
                        >
                          {getDaysLeft(folder.expiresAt)}
                        </span>

                        <span className="px-4 py-2 rounded-full bg-slate-200 text-slate-700 text-sm font-black">
                          {folder.downloads} downloads
                        </span>

                        <a
                          href={`/folder/${folder.folderId}`}
                          target="_blank"
                          title="Open"
                          className="w-11 h-11 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-black hover:scale-110 active:scale-95 transition"
                        >
                          👁
                        </a>

                        <button
                          onClick={() => copyLink(folder.folderId)}
                          title="Copy Link"
                          className="w-11 h-11 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black hover:scale-110 active:scale-95 transition"
                        >
                          {copiedId === folder.folderId ? "✓" : "📋"}
                        </button>

                        <a
                          href={`/api/download-folder?id=${folder.folderId}`}
                          title="Download"
                          className="w-11 h-11 rounded-2xl bg-purple-600 text-white flex items-center justify-center font-black hover:scale-110 active:scale-95 transition"
                        >
                          ⬇
                        </a>

                        <button
                          onClick={() => deleteFolder(folder.folderId)}
                          title="Delete"
                          className="w-11 h-11 rounded-2xl bg-red-600 text-white flex items-center justify-center font-black hover:scale-110 active:scale-95 transition"
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