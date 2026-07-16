"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { PlaceForm } from "@/components/PlaceForm";
import {
  Compass,
  MapPin,
  LogOut,
  Search,
  SlidersHorizontal,
  Trash2,
  Edit3,
  Plus,
  ChevronLeft,
  ChevronRight,
  Info,
  Calendar,
  Clock,
  Coins,
  Users,
  AlertTriangle,
  X,
  RefreshCw,
  CheckCircle2,
  Tag,
  User,
} from "lucide-react";
import { PlaceDetails } from "@/types/place";

interface SessionInfo {
  username: string;
  badge: string;
}

export default function PlacesManagement() {
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);

  // Places Data
  const [places, setPlaces] = useState<PlaceDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);

  // Search & Filter State
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterMainCategory, setFilterMainCategory] = useState("");
  const [filterUploader, setFilterUploader] = useState("");
  const [filterPricing, setFilterPricing] = useState(""); // "", "free", "paid"
  const [filterCrowdLevel, setFilterCrowdLevel] = useState("");
  const [filterClosedDay, setFilterClosedDay] = useState("");
  const [sortBy, setSortBy] = useState("newest"); // "newest", "oldest", "a-z", "z-a", "recently_edited"

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  // Selected Place for Editing
  const [selectedPlace, setSelectedPlace] = useState<PlaceDetails | null>(null);

  // Place ID for Deletion Confirmation
  const [deletingPlace, setDeletingPlace] = useState<PlaceDetails | null>(null);

  // Toast Notification
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Logout state
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

  // Fetch places
  const fetchPlaces = async () => {
    setLoading(true);
    setApiError(null);
    try {
      const res = await fetch("/api/places");
      const data = await res.json();
      if (res.ok && data.success) {
        setPlaces(data.data || []);
      } else {
        setApiError(data.error?.message || "Failed to load places.");
      }
    } catch (err) {
      setApiError("Network error. Failed to load places from storage.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session) {
      fetchPlaces();
    }
  }, [session]);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setCurrentPage(1); // Reset to page 1 on new search
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  // Handle Toast timers
  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
  };

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Handle Logout
  const handleLogout = async () => {
    setLogoutLoading(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setSession(null);
    } catch (err) {
      console.error("Logout failed:", err);
    } finally {
      setLogoutLoading(false);
    }
  };

  // Handle Deletion
  const handleDeleteConfirm = async () => {
    if (!deletingPlace) return;
    const targetId = deletingPlace.id;
    try {
      const res = await fetch(`/api/places/${targetId}`, {
        method: "DELETE",
      });
      const result = await res.json();
      if (res.ok && result.success) {
        showToast("Place deleted permanently from Google Sheets.", "success");
        // Optimistic update
        setPlaces((prev) => prev.filter((p) => p.id !== targetId));
      } else {
        showToast(result.error?.message || "Failed to delete place.", "error");
      }
    } catch (err) {
      showToast("Network error. Failed to delete place.", "error");
    } finally {
      setDeletingPlace(null);
    }
  };

  // Helper to extract specific info card values
  const getCardVal = (place: PlaceDetails, label: string) => {
    return place.infoCards.find((c) => c.label.toLowerCase() === label.toLowerCase())?.value || "";
  };

  // Unique list of categories and uploaders for filter selections
  const uniqueCategories = useMemo(() => {
    const cats = new Set<string>();
    places.forEach((p) => p.categories.forEach((c) => cats.add(c)));
    return Array.from(cats).sort();
  }, [places]);

  const uniqueMainCategories = useMemo(() => {
    const cats = new Set<string>();
    places.forEach((p) => {
      const val = getCardVal(p, "main category");
      if (val) cats.add(val);
    });
    return Array.from(cats).sort();
  }, [places]);

  const uniqueUploaders = useMemo(() => {
    const uploaders = new Set<string>();
    places.forEach((p) => {
      if (p.uploader?.username) uploaders.add(p.uploader.username);
    });
    return Array.from(uploaders).sort();
  }, [places]);

  // Filter & Sort Calculation
  const filteredPlaces = useMemo(() => {
    return places
      .filter((place) => {
        // Search query
        if (debouncedSearch.trim() !== "") {
          const q = debouncedSearch.toLowerCase().trim();
          const matchTitle = place.title.toLowerCase().includes(q);
          const matchLocation = place.location.toLowerCase().includes(q);
          const matchCategories = place.categories.some((c) => c.toLowerCase().includes(q));
          const matchMainCat = getCardVal(place, "main category").toLowerCase().includes(q);
          const matchUploader = place.uploader.username.toLowerCase().includes(q);
          const matchId = place.id.toLowerCase().includes(q);

          if (!matchTitle && !matchLocation && !matchCategories && !matchMainCat && !matchUploader && !matchId) {
            return false;
          }
        }

        // Filters
        if (filterCategory && !place.categories.some((c) => c.toLowerCase() === filterCategory.toLowerCase())) {
          return false;
        }
        if (filterMainCategory && getCardVal(place, "main category").toLowerCase() !== filterMainCategory.toLowerCase()) {
          return false;
        }
        if (filterUploader && place.uploader.username.toLowerCase() !== filterUploader.toLowerCase()) {
          return false;
        }
        if (filterPricing) {
          const isFree = place.categories.includes("Free") || getCardVal(place, "fee").toUpperCase().includes("FREE");
          if (filterPricing === "free" && !isFree) return false;
          if (filterPricing === "paid" && isFree) return false;
        }
        if (filterCrowdLevel && getCardVal(place, "crowd level").toLowerCase() !== filterCrowdLevel.toLowerCase()) {
          return false;
        }
        if (filterClosedDay) {
          const closedOn = getCardVal(place, "closed on").toLowerCase();
          if (filterClosedDay === "Never Closed") {
            if (closedOn !== "never closed") return false;
          } else {
            if (closedOn === "never closed" || !closedOn.includes(filterClosedDay.toLowerCase())) return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "a-z") {
          return a.title.localeCompare(b.title);
        }
        if (sortBy === "z-a") {
          return b.title.localeCompare(a.title);
        }
        return 0; // keep natural order for reverse modifications below
      });
  }, [places, debouncedSearch, filterCategory, filterMainCategory, filterUploader, filterPricing, filterCrowdLevel, filterClosedDay, sortBy]);

  // Adjust order for newest/natural sorting
  const sortedAndFilteredPlaces = useMemo(() => {
    if (sortBy === "newest" || sortBy === "recently_edited") {
      return [...filteredPlaces].reverse();
    }
    return filteredPlaces;
  }, [filteredPlaces, sortBy]);

  // Paginated View
  const paginatedPlaces = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedAndFilteredPlaces.slice(start, start + pageSize);
  }, [sortedAndFilteredPlaces, currentPage]);

  const totalPages = Math.ceil(sortedAndFilteredPlaces.length / pageSize);

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

  // 2. Redirect to authenticate on Home page if not logged in
  if (!session) {
    return (
      <main className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-8 max-w-sm text-center flex flex-col gap-4">
          <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto" />
          <h2 className="text-lg font-bold text-slate-200">Unauthenticated Access</h2>
          <p className="text-xs text-slate-400">
            Please log in from the main administrator home page to access the database management dashboard.
          </p>
          <Link href="/" className="px-4 py-2 bg-violet-600 text-white rounded-lg text-xs font-bold hover:bg-violet-500 transition">
            Go to Login
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen flex flex-col justify-between overflow-hidden">
      {/* Decorative Background Auras */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-900/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-violet-900/10 blur-[150px] pointer-events-none" />

      {/* Header Navigation */}
      <header className="border-b border-slate-900 bg-slate-950/60 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/20 group-hover:scale-105 transition-all">
                <Compass className="w-5 h-5 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold tracking-tight text-sm text-slate-100 uppercase">
                  DoldFind
                </span>
                <span className="text-[10px] text-slate-400 font-semibold tracking-widest uppercase">
                  Admin Portal
                </span>
              </div>
            </Link>

            {/* Main Tabs */}
            <nav className="hidden md:flex items-center gap-4 text-xs font-bold uppercase tracking-wider">
              <Link href="/" className="text-slate-400 hover:text-slate-200 transition px-3 py-1">
                Contribute Spot
              </Link>
              <Link href="/places" className="text-violet-400 border-b-2 border-violet-500 px-3 py-1">
                Manage Database
              </Link>
            </nav>
          </div>

          {/* Active Profile Info */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2.5 select-none">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-violet-500/20 to-indigo-500/20 border border-violet-850 flex items-center justify-center font-bold text-xs text-violet-300 uppercase">
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
              className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-[10px] font-bold text-slate-400 hover:text-slate-200 py-1.5 px-3 rounded-lg transition"
            >
              <LogOut className="w-3.5 h-3.5" />
              {logoutLoading ? "Signing out..." : "Log Out"}
            </button>
          </div>
        </div>
        {/* Mobile Navigation sub-bar */}
        <div className="md:hidden border-t border-slate-900 bg-slate-950/30">
          <div className="max-w-7xl mx-auto px-4 flex items-center justify-center gap-6 h-10 text-[10px] font-bold uppercase tracking-wider select-none">
            <Link href="/" className="text-slate-400 hover:text-slate-200 transition px-2 py-1.5">
              Contribute Spot
            </Link>
            <Link href="/places" className="text-violet-400 border-b-2 border-violet-500 px-2 py-1.5 transition">
              Manage Database
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-6 relative z-10">
        
        {/* Title Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-900 pb-5">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-bold text-violet-400 tracking-wider uppercase flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5" />
              Google Sheets Registry
            </span>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-100 tracking-tight">
              Places Management
            </h1>
            <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
              Read, update, and remove places directly stored on the configured Google Sheets queue. Always review modifications for data sanitization and accuracy.
            </p>
          </div>

          <Link href="/" className="w-fit flex items-center gap-1.5 bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold px-4 py-2.5 rounded-lg shadow-lg hover:scale-105 active:scale-95 transition-all">
            <Plus className="w-4 h-4" />
            Add New Place
          </Link>
        </div>

        {/* Search & Filters Box */}
        <div className="bg-slate-900/40 border border-slate-850 rounded-xl p-5 backdrop-blur-md flex flex-col gap-4">
          
          {/* Main Search Input */}
          <div className="flex items-center gap-3 bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 focus-within:border-violet-500 focus-within:ring-1 focus-within:ring-violet-500 transition">
            <Search className="w-4 h-4 text-slate-500 flex-shrink-0" />
            <input
              type="text"
              placeholder="Instant search by title, location, category, uploader name, or ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent border-none outline-none text-xs text-slate-200 w-full focus:ring-0 p-0"
            />
            {search && (
              <button onClick={() => setSearch("")} className="p-1 hover:text-slate-200 text-slate-500 transition">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Collapsible/Grid Filters */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            
            {/* Main Category */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Main Category</label>
              <select
                value={filterMainCategory}
                onChange={(e) => { setFilterMainCategory(e.target.value); setCurrentPage(1); }}
                className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-xs text-slate-300 focus:outline-none focus:border-violet-500 transition"
              >
                <option value="">All Main Categories</option>
                {uniqueMainCategories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Custom Category */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Category Tag</label>
              <select
                value={filterCategory}
                onChange={(e) => { setFilterCategory(e.target.value); setCurrentPage(1); }}
                className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-xs text-slate-300 focus:outline-none focus:border-violet-500 transition"
              >
                <option value="">All Tags</option>
                {uniqueCategories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Pricing */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Pricing Option</label>
              <select
                value={filterPricing}
                onChange={(e) => { setFilterPricing(e.target.value); setCurrentPage(1); }}
                className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-xs text-slate-300 focus:outline-none focus:border-violet-500 transition"
              >
                <option value="">All Prices</option>
                <option value="free">Free Only</option>
                <option value="paid">Paid Only</option>
              </select>
            </div>

            {/* Crowd Level */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Crowd Level</label>
              <select
                value={filterCrowdLevel}
                onChange={(e) => { setFilterCrowdLevel(e.target.value); setCurrentPage(1); }}
                className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-xs text-slate-300 focus:outline-none focus:border-violet-500 transition"
              >
                <option value="">All Crowd Levels</option>
                <option value="very low">Very Low</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="very high">Very High</option>
              </select>
            </div>

            {/* Closed Day */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Closed On</label>
              <select
                value={filterClosedDay}
                onChange={(e) => { setFilterClosedDay(e.target.value); setCurrentPage(1); }}
                className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-xs text-slate-300 focus:outline-none focus:border-violet-500 transition"
              >
                <option value="">All Days</option>
                <option value="Never Closed">Never Closed</option>
                <option value="Monday">Monday</option>
                <option value="Tuesday">Tuesday</option>
                <option value="Wednesday">Wednesday</option>
                <option value="Thursday">Thursday</option>
                <option value="Friday">Friday</option>
                <option value="Saturday">Saturday</option>
                <option value="Sunday">Sunday</option>
              </select>
            </div>

            {/* Uploader */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Uploader</label>
              <select
                value={filterUploader}
                onChange={(e) => { setFilterUploader(e.target.value); setCurrentPage(1); }}
                className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-xs text-slate-300 focus:outline-none focus:border-violet-500 transition"
              >
                <option value="">All Uploaders</option>
                {uniqueUploaders.map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>

            {/* Sorting */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-xs text-slate-300 focus:outline-none focus:border-violet-500 transition"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="a-z">A-Z (Alphabetical)</option>
                <option value="z-a">Z-A (Alphabetical)</option>
                <option value="recently_edited">Natural Row Order</option>
              </select>
            </div>

          </div>

          {/* Reset Filters Option */}
          {(filterCategory || filterMainCategory || filterUploader || filterPricing || filterCrowdLevel || filterClosedDay || search) && (
            <button
              onClick={() => {
                setSearch("");
                setFilterCategory("");
                setFilterMainCategory("");
                setFilterUploader("");
                setFilterPricing("");
                setFilterCrowdLevel("");
                setFilterClosedDay("");
                setSortBy("newest");
              }}
              className="text-[11px] font-bold text-violet-400 hover:text-violet-300 self-end flex items-center gap-1 mt-1 transition"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Reset Filters
            </button>
          )}

        </div>

        {/* Loading Skeletons */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-slate-900/20 border border-slate-850 rounded-xl p-5 flex flex-col gap-4 animate-pulse">
                <div className="h-4 bg-slate-800 rounded w-2/3" />
                <div className="flex gap-2">
                  <div className="h-5 bg-slate-800 rounded w-16" />
                  <div className="h-5 bg-slate-800 rounded w-20" />
                </div>
                <div className="space-y-2 py-2">
                  <div className="h-3 bg-slate-800 rounded w-full" />
                  <div className="h-3 bg-slate-800 rounded w-5/6" />
                </div>
                <div className="border-t border-slate-850 pt-3 mt-auto space-y-1">
                  <div className="h-3 bg-slate-800 rounded w-1/2" />
                  <div className="h-3 bg-slate-800 rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {!loading && apiError && (
          <div className="bg-red-950/20 border border-red-900/50 rounded-xl p-6 text-center flex flex-col gap-2 max-w-xl mx-auto my-10">
            <AlertTriangle className="w-10 h-10 text-red-400 mx-auto" />
            <h3 className="text-sm font-bold text-red-300">Failed to Retrieve Records</h3>
            <p className="text-xs text-red-400/80 leading-relaxed">{apiError}</p>
            <button
              onClick={fetchPlaces}
              className="mt-3 px-4 py-2 bg-red-900/40 hover:bg-red-900/60 border border-red-800 text-xs font-bold text-red-300 rounded-lg w-fit mx-auto transition"
            >
              Retry Connection
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !apiError && sortedAndFilteredPlaces.length === 0 && (
          <div className="text-center py-16 border border-dashed border-slate-850 rounded-2xl flex flex-col items-center justify-center gap-4 bg-slate-900/5 backdrop-blur-md max-w-lg mx-auto w-full my-6 select-none animate-fadeIn">
            <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-850 flex items-center justify-center">
              <Compass className="w-8 h-8 text-slate-600 animate-spin-slow" />
            </div>
            <div className="flex flex-col gap-1 max-w-xs">
              <h3 className="text-sm font-bold text-slate-300">No places have been added yet</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                We couldn&apos;t find any records matching your search criteria or the database is currently empty.
              </p>
            </div>
            <Link href="/" className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg text-xs font-bold transition">
              Add Place
            </Link>
          </div>
        )}

        {/* Places Cards Grid */}
        {!loading && !apiError && sortedAndFilteredPlaces.length > 0 && (
          <div className="flex flex-col gap-6">
            <div className="text-xs text-slate-400">
              Showing <span className="font-bold text-slate-200">{paginatedPlaces.length}</span> of <span className="font-bold text-slate-200">{sortedAndFilteredPlaces.length}</span> registered places.
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginatedPlaces.map((place) => {
                const mainCategory = getCardVal(place, "main category");
                const closedOn = getCardVal(place, "closed on");
                const timings = getCardVal(place, "best timings");
                const crowdLevel = getCardVal(place, "crowd level");
                const fee = getCardVal(place, "fee");

                return (
                  <div
                    key={place.id}
                    className="bg-slate-900/30 border border-slate-850 rounded-xl p-5 md:p-6 backdrop-blur-sm flex flex-col gap-4 hover:border-slate-750/80 hover:bg-slate-900/50 hover:shadow-2xl hover:shadow-violet-950/5 group transition-all duration-300 relative overflow-hidden"
                  >
                    {/* Header */}
                    <div className="flex flex-col gap-1.5">
                      <div className="flex justify-between items-start gap-3">
                        <h3 className="text-sm font-bold text-slate-200 group-hover:text-violet-400 transition duration-200 line-clamp-1">
                          {place.title}
                        </h3>
                        
                        {/* Inline Actions */}
                        <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <button
                            onClick={() => setSelectedPlace(place)}
                            className="p-1.5 text-slate-400 hover:text-violet-400 bg-slate-950/60 border border-slate-800/80 hover:border-violet-500/20 rounded-md transition"
                            title="Edit Place"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeletingPlace(place)}
                            className="p-1.5 text-slate-400 hover:text-red-400 bg-slate-950/60 border border-slate-800/80 hover:border-red-500/20 rounded-md transition"
                            title="Delete Place"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Chips */}
                      <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                        {mainCategory && (
                          <span className="bg-violet-950/50 border border-violet-850 text-violet-300 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full select-none">
                            {mainCategory}
                          </span>
                        )}
                        {place.categories.slice(0, 3).map((cat) => (
                          <span
                            key={cat}
                            className="bg-slate-950/80 border border-slate-850 text-slate-400 text-[9px] font-semibold px-2 py-0.5 rounded-full select-none"
                          >
                            {cat}
                          </span>
                        ))}
                        {place.categories.length > 3 && (
                          <span className="text-[9px] text-slate-500 font-semibold px-1 select-none">
                            +{place.categories.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Description Short Preview */}
                    <p className="text-xs text-slate-400/90 leading-relaxed line-clamp-2 select-text py-0.5">
                      {place.description}
                    </p>

                    {/* Info Metadata Details */}
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 border-t border-slate-850 pt-3 text-[10px] text-slate-400 select-text">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <MapPin className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                        <span className="truncate">{place.location}</span>
                      </div>
                      <div className="flex items-center gap-1.5 min-w-0">
                        <Users className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                        <span className="truncate">Crowd: {crowdLevel || "N/A"}</span>
                      </div>
                      {timings && (
                        <div className="flex items-center gap-1.5 min-w-0 col-span-2">
                          <Clock className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                          <span className="truncate">Best: {timings}</span>
                        </div>
                      )}
                      {fee && (
                        <div className="flex items-center gap-1.5 min-w-0 col-span-2">
                          <Coins className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                          <span className="truncate">{fee}</span>
                        </div>
                      )}
                    </div>

                    {/* Submitted/Footer Metadata */}
                    <div className="border-t border-slate-850 pt-2.5 mt-auto flex items-center justify-between text-[9px] text-slate-500 select-text">
                      <div className="flex items-center gap-1 select-none">
                        <User className="w-3 h-3 text-slate-600" />
                        <span>by </span>
                        <span className="font-bold text-slate-450">{place.uploader.username}</span>
                        <span className="text-[8px] bg-violet-950/20 border border-violet-900/30 text-violet-400 font-bold px-1 rounded-sm">
                          {place.uploader.badge}
                        </span>
                      </div>
                      <div className="text-slate-600 font-mono text-[8px]">
                        ID: {place.id.substring(0, 8)}...
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-slate-900 pt-6 select-none">
                <span className="text-[10px] text-slate-500">
                  Page <span className="font-bold text-slate-350">{currentPage}</span> of <span className="font-bold text-slate-350">{totalPages}</span>
                </span>
                
                <div className="flex items-center gap-2">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => { setCurrentPage((p) => Math.max(p - 1, 1)); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                    className="p-1.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 disabled:opacity-40 disabled:pointer-events-none rounded-lg text-slate-400 hover:text-slate-200 transition"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  {Array.from({ length: totalPages }).map((_, i) => {
                    const pageNum = i + 1;
                    const isSelected = pageNum === currentPage;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => { setCurrentPage(pageNum); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                        className={`w-7 h-7 text-xs font-bold rounded-lg border transition ${
                          isSelected
                            ? "bg-violet-600 border-violet-500 text-white"
                            : "bg-slate-900 hover:bg-slate-850 border-slate-800 text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => { setCurrentPage((p) => Math.min(p + 1, totalPages)); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                    className="p-1.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 disabled:opacity-40 disabled:pointer-events-none rounded-lg text-slate-400 hover:text-slate-200 transition"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

      </div>

      {/* Fullscreen Lazy-Loaded Edit Drawer Overlay */}
      {selectedPlace && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 overflow-y-auto p-4 md:p-10 flex justify-center items-start animate-fadeIn select-text">
          <div className="w-full max-w-5xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl relative animate-slideDown overflow-hidden my-4 md:my-0">
            {/* Close Button */}
            <button
              onClick={() => setSelectedPlace(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-200 bg-slate-950/40 hover:bg-slate-950/80 border border-slate-800 rounded-lg transition z-50"
              title="Close form"
            >
              <X className="w-4 h-4" />
            </button>
            
            <div className="p-6 md:p-8 border-b border-slate-850 flex flex-col gap-1 select-none">
              <h2 className="text-xl font-extrabold text-slate-100 flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-violet-500" />
                Edit Place Details
              </h2>
              <p className="text-[10px] text-slate-500">
                Place ID: <span className="font-mono text-slate-400">{selectedPlace.id}</span> | Contributed by {selectedPlace.uploader.username} ({selectedPlace.uploader.badge})
              </p>
            </div>

            <div className="p-6 md:p-8 max-h-[calc(100vh-200px)] overflow-y-auto">
              <PlaceForm
                initialPlace={selectedPlace}
                onSuccess={(updated) => {
                  setPlaces((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
                  setSelectedPlace(null);
                  showToast("Place details updated successfully.", "success");
                }}
                onCancel={() => setSelectedPlace(null)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingPlace && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn select-none">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6 flex flex-col gap-5 shadow-2xl animate-slideDown">
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-full bg-red-950/60 border border-red-900/40 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-500" />
              </div>
              <div className="flex flex-col gap-1">
                <h3 className="text-sm font-bold text-slate-200">Delete this place permanently?</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Are you sure you want to delete <span className="text-slate-200 font-bold">&quot;{deletingPlace.title}&quot;</span>? This will permanently wipe the row from your Google Sheet. This action is irreversible.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-slate-850 pt-4">
              <button
                onClick={() => setDeletingPlace(null)}
                className="px-4 py-2 border border-slate-800 hover:bg-slate-850 text-slate-400 hover:text-slate-200 rounded-lg text-xs font-semibold transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-bold shadow-lg shadow-red-500/10 transition"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification Popups */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 border rounded-xl backdrop-blur-md shadow-2xl animate-slideUp select-none max-w-sm">
          {toast.type === "success" ? (
            <div className="bg-emerald-950/60 border border-emerald-800/80 rounded-xl p-3 flex items-center gap-2.5 text-emerald-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span className="text-xs font-semibold">{toast.message}</span>
            </div>
          ) : (
            <div className="bg-red-950/60 border border-red-800/80 rounded-xl p-3 flex items-center gap-2.5 text-red-300">
              <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <span className="text-xs font-semibold">{toast.message}</span>
            </div>
          )}
        </div>
      )}

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
