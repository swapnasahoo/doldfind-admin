"use client";

import React, { useState, useEffect } from "react";
import { PlaceForm } from "@/components/PlaceForm";
import { Compass, MapPin, LogOut } from "lucide-react";

interface SessionInfo {
  username: string;
  badge: string;
}

export default function Home() {
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);

  // Login inputs
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);

  // Fetch session status on mount
  useEffect(() => {
    async function checkSession() {
      try {
        const res = await fetch("/api/auth/session");
        if (res.ok) {
          const result = await res.json();
          if (result.success && result.data) {
            setSession(result.data);
          }
        }
      } catch (err) {
        console.error("Session verification failed:", err);
      } finally {
        setCheckingSession(false);
      }
    }

    checkSession();
  }, []);

  // Handle Login submission
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setLoginLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        // Fetch active session status after login success
        const sessRes = await fetch("/api/auth/session");
        if (sessRes.ok) {
          const sessData = await sessRes.json();
          setSession(sessData.data);
        }
      } else {
        setLoginError(data.error?.message || "Invalid username or password.");
      }
    } catch (err) {
      setLoginError("Failed to connect to authentication server. Try again.");
    } finally {
      setLoginLoading(false);
    }
  };

  // Handle Logout submission
  const handleLogout = async () => {
    setLogoutLoading(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setSession(null);
      setUsername("");
      setPassword("");
    } catch (err) {
      console.error("Logout failed:", err);
    } finally {
      setLogoutLoading(false);
    }
  };

  // 1. Initial Checking Session Loading View
  if (checkingSession) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center relative">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-900/10 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-violet-900/10 blur-[150px] pointer-events-none" />

        <div className="flex flex-col items-center gap-4 select-none">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/25 animate-pulse">
            <Compass className="w-6 h-6 text-white animate-spin-slow" />
          </div>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest animate-pulse">
            Checking Session...
          </span>
        </div>
      </div>
    );
  }

  // 2. Unauthenticated Login Screen View
  if (!session) {
    return (
      <main className="relative min-h-screen flex items-center justify-center overflow-hidden bg-slate-950 px-4">
        {/* Decorative Background Auras */}
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-900/10 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-violet-900/10 blur-[150px] pointer-events-none" />

        <div className="w-full max-w-md bg-slate-900/40 border border-slate-850/80 rounded-2xl p-8 backdrop-blur-xl shadow-2xl flex flex-col gap-6 relative z-10 animate-slideDown">
          {/* Header */}
          <div className="flex flex-col items-center gap-2 select-none">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
              <Compass className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col items-center">
              <span className="font-extrabold tracking-tight text-base text-slate-100 uppercase">
                DoldFind
              </span>
              <span className="text-[10px] text-slate-400 font-bold tracking-widest uppercase">
                Founder Authentication
              </span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            {loginError && (
              <div className="bg-red-950/30 border border-red-900/50 rounded-lg p-3 text-xs font-semibold text-red-400 animate-fadeIn">
                {loginError}
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 select-none">
                Username
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all duration-200"
                placeholder="Enter your username"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 select-none">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all duration-200"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loginLoading}
              className="mt-2 w-full py-2.5 text-xs font-bold text-white rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 active:scale-[0.98] transition-all duration-200 shadow-md shadow-violet-500/10 flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
            >
              {loginLoading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Authenticating...
                </>
              ) : (
                "Log In"
              )}
            </button>
          </form>
        </div>
      </main>
    );
  }

  // 3. Authenticated Contributor Dashboard View
  return (
    <main className="relative min-h-screen flex flex-col justify-between overflow-hidden">
      {/* Decorative Background Auras */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-900/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-violet-900/10 blur-[150px] pointer-events-none" />
      <div className="absolute top-[40%] right-[20%] w-[30%] h-[30%] rounded-full bg-sky-900/5 blur-[100px] pointer-events-none" />

      {/* Header Navigation */}
      <header className="border-b border-slate-900 bg-slate-950/60 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
              <Compass className="w-5 h-5 text-white animate-spin-slow" />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold tracking-tight text-sm text-slate-100 uppercase">
                DoldFind
              </span>
              <span className="text-[10px] text-slate-400 font-semibold tracking-widest uppercase">
                Admin Portal
              </span>
            </div>
          </div>

          {/* Active Founder Profile & Logout */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2.5 select-none">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-violet-500/20 to-indigo-500/20 border border-violet-850 flex items-center justify-center font-bold text-xs text-violet-300 uppercase shadow-[0_0_8px_rgba(124,58,237,0.1)]">
                {session.username.substring(0, 2)}
              </div>
              <div className="hidden sm:flex flex-col">
                <span className="text-xs font-bold text-slate-200">{session.username}</span>
                <span className="text-[9px] font-bold text-violet-400 tracking-wider uppercase">
                  {session.badge}
                </span>
              </div>
            </div>

            <button
              onClick={handleLogout}
              disabled={logoutLoading}
              className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-[10px] font-bold text-slate-400 hover:text-slate-200 py-1.5 px-3 rounded-lg transition-all duration-200 disabled:opacity-50"
            >
              <LogOut className="w-3.5 h-3.5" />
              {logoutLoading ? "Signing out..." : "Log Out"}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-8 relative z-10">
        {/* Banner Section */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-xs font-bold text-violet-400 tracking-wider uppercase select-none">
            <MapPin className="w-3.5 h-3.5" />
            Spot Discovery
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-100 tracking-tight animate-slideDown">
            Create Contributor Entry
          </h1>
          <p className="text-sm text-slate-400 max-w-3xl leading-relaxed">
            Contribute new scenic spots, hikes, viewpoints, or historical markers. Fill out descriptions, coordinates, categories, and custom information cards. Submissions are verified before being published.
          </p>
        </div>

        {/* Form Orchestrator */}
        <PlaceForm />
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/40 py-6 mt-12 relative z-10 select-none">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-550">
          <p>&copy; {new Date().getFullYear()} DoldFind. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <a href="#" className="hover:text-slate-350 transition-colors">Documentation</a>
            <a href="#" className="hover:text-slate-350 transition-colors">Guidelines</a>
            <a href="#" className="hover:text-slate-350 transition-colors">Terms of Service</a>
          </div>
        </div>
      </footer>
    </main>
  );
}
