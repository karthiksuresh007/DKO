"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInOfficer, signOutSession } from "@/lib/auth";

export default function DashboardLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin() {
    setLoading(true);
    setError(null);

    try {
      const user = await signInOfficer(email, password);
      if (user.role !== "officer" && user.role !== "admin") {
        await signOutSession();
        throw new Error("This account is not allowed to access the officer dashboard.");
      }

      router.push("/dashboard");
    } catch (loginError) {
      console.error(loginError);
      setError(
        loginError instanceof Error
          ? loginError.message
          : "Failed to sign in with email and password."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-5 py-8">
      <div className="rounded-[28px] bg-white/90 p-6 shadow-lg shadow-slate-900/10">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-700">
          Officer Login
        </p>
        <h1 className="mt-3 text-3xl font-bold text-slate-900">Sign in with email</h1>
        <p className="mt-3 text-sm leading-6 text-slate-700">
          Officers authenticate with Firebase Email/Password. The verified token is synced with the backend to load the role-aware user profile.
        </p>

        <div className="mt-6 space-y-4">
          <label className="block text-sm font-medium text-slate-700">
            Email
            <input
              className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none ring-brand-300 transition focus:ring"
              onChange={(event) => setEmail(event.target.value)}
              placeholder="officer@dko.com"
              type="email"
              value={email}
            />
          </label>

          <label className="block text-sm font-medium text-slate-700">
            Password
            <input
              className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none ring-brand-300 transition focus:ring"
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter password"
              type="password"
              value={password}
            />
          </label>

          <button
            className="w-full rounded-full bg-brand-600 px-5 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:bg-brand-300"
            disabled={loading || !email || !password}
            onClick={handleLogin}
            type="button"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </div>

        {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}

        <div className="mt-6 text-sm text-slate-600">
          Farmer? <a className="font-semibold text-brand-700" href="/farmer/login">Use phone OTP</a>
        </div>
      </div>
    </main>
  );
}
