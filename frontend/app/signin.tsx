"use client";

import { useState } from "react";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleLogin(e) {
    e.preventDefault();
    setError("");

    try {
      const res = await fetch("http://127.0.0.1:8000/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.detail || "Login failed");
        return;
      }

      localStorage.setItem("token", data.access_token);

      window.location.href = "/dashboard"; // redirect after login
    } catch {
      setError("Server unreachable");
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-background">
      <form
        onSubmit={handleLogin}
        className="bg-card p-8 rounded-2xl shadow-xl border border-border w-full max-w-sm"
      >
        <h1 className="text-2xl font-bold mb-6">Sign In</h1>

        {error && <p className="text-red-500 mb-3">{error}</p>}

        <input
          type="email"
          className="w-full mb-4 p-3 bg-background border border-border rounded-xl"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          className="w-full mb-6 p-3 bg-background border border-border rounded-xl"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          type="submit"
          className="w-full py-3 rounded-xl bg-accent text-accent-foreground font-semibold hover:bg-accent/90 transition"
        >
          Sign In
        </button>
      </form>
    </main>
  );
}
