import React from "react";
import { PlaceForm } from "@/components/PlaceForm";
import { Compass, Users, MapPin, Award } from "lucide-react";

export default function Home() {
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

          {/* Quick Mock Status Badge */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 bg-slate-900/80 border border-slate-800 px-3 py-1.5 rounded-full select-none">
              <Award className="w-3.5 h-3.5 text-violet-400" />
              <span className="text-xs font-semibold text-slate-300">
                Explorer Tier
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-violet-300 select-none">
                JD
              </div>
              <div className="hidden md:flex flex-col">
                <span className="text-xs font-bold text-slate-200">John Doe</span>
                <span className="text-[9px] font-semibold text-emerald-400">Contributor</span>
              </div>
            </div>
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
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-100 tracking-tight">
            Create Contributor Entry
          </h1>
          <p className="text-sm text-slate-450 max-w-3xl leading-relaxed">
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
