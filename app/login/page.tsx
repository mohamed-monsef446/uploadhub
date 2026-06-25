"use client";

import { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    setMessage("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await res.json();

      if (data.success) {
        localStorage.setItem("uploadhub_user", JSON.stringify(data.user));
        setMessage("Login successful");

        setTimeout(() => {
          window.location.href = "/";
        }, 1000);
      } else {
        setMessage(data.message || "Login failed");
      }
    } catch {
      setMessage("Server error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-100 flex items-center justify-center p-6">
      <div className="bg-white w-full max-w-md p-8 rounded-2xl shadow-xl">
        <h1 className="text-3xl font-bold mb-2 text-center">
          Login
        </h1>

        <p className="text-gray-500 text-center mb-6">
          Login to keep your links active for 30 days
        </p>

        <label className="block mb-2 font-semibold">Email</label>
        <input
          type="email"
          className="w-full border p-3 rounded-lg mb-4"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
        />

        <label className="block mb-2 font-semibold">Password</label>
        <input
          type="password"
          className="w-full border p-3 rounded-lg mb-6"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
        />

        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full bg-gray-800 hover:bg-black text-white py-3 rounded-xl font-semibold shadow-lg transition-all active:scale-95 disabled:bg-gray-400"
        >
          {loading ? "Logging in..." : "Login"}
        </button>

        {message && (
          <p className="mt-4 text-center text-sm font-semibold text-blue-600">
            {message}
          </p>
        )}

        <a
          href="/register"
          className="block mt-6 text-center text-sm text-green-600 font-semibold hover:underline"
        >
          Create new account
        </a>

        <a
          href="/"
          className="block mt-3 text-center text-sm text-gray-500 hover:underline"
        >
          Back to Upload Hub
        </a>
      </div>
    </main>
  );
}