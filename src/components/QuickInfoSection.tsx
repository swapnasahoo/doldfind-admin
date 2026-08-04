"use client";

import React, { useState, useEffect, useRef } from "react";
import { Control, UseFormRegister, FieldErrors, Controller } from "react-hook-form";
import {
  Clock,
  Calendar,
  Users2,
  Layers,
  AlertCircle,
  Check,
  Search,
  ChevronDown,
  MapPin,
  Building2,
  Landmark,
  Compass,
} from "lucide-react";

import { Input } from "./ui/Input";
import { Textarea } from "./ui/Textarea";
import { PlaceFormValues, PlaceType } from "@/types/place";
import { mergeTimeSlots, getContinuousDurations } from "@/utils/parser";

interface QuickInfoSectionProps {
  control: Control<PlaceFormValues>;
  register: UseFormRegister<PlaceFormValues>;
  errors: FieldErrors<PlaceFormValues>;
}

// Preset Main Categories
const CATEGORY_PRESETS = [
  "Temple",
  "Waterfall",
  "Viewpoint",
  "Beach",
  "Historical Site",
  "Cafe",
  "Park",
  "Forest",
  "Hiking Trail",
  "Lake & River",
  "Ancient Ruins",
  "Cave",
  "Garden",
  "Monument",
  "Museum",
  "Market",
  "Street Food",
];

const PLACE_TYPES: PlaceType[] = ["Spot", "Cafe", "Market"];

// Time slots definitions
const TIME_SLOTS = [
  "12 AM - 1 AM",
  "1 AM - 2 AM",
  "2 AM - 3 AM",
  "3 AM - 4 AM",
  "4 AM - 5 AM",
  "5 AM - 6 AM",
  "6 AM - 7 AM",
  "7 AM - 8 AM",
  "8 AM - 9 AM",
  "9 AM - 10 AM",
  "10 AM - 11 AM",
  "11 AM - 12 PM",
  "12 PM - 1 PM",
  "1 PM - 2 PM",
  "2 PM - 3 PM",
  "3 PM - 4 PM",
  "4 PM - 5 PM",
  "5 PM - 6 PM",
  "6 PM - 7 PM",
  "7 PM - 8 PM",
  "8 PM - 9 PM",
  "9 PM - 10 PM",
  "10 PM - 11 PM",
  "11 PM - 12 AM",
];

// Closed Days
const WEEK_DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

// Crowd Levels
const CROWD_LEVELS = ["Low", "Medium", "High"];

export const QuickInfoSection: React.FC<QuickInfoSectionProps> = ({
  control,
  register,
  errors,
}) => {
  // Category Select states
  const [catSearch, setCatSearch] = useState("");
  const [isCatDropdownOpen, setIsCatDropdownOpen] = useState(false);
  const catDropdownRef = useRef<HTMLDivElement>(null);

  // Close category dropdown on click outside
  useEffect(() => {
    const clickOutside = (e: MouseEvent) => {
      if (
        catDropdownRef.current &&
        !catDropdownRef.current.contains(e.target as Node)
      ) {
        setIsCatDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", clickOutside);
    return () => document.removeEventListener("mousedown", clickOutside);
  }, []);

  const filteredCategories = CATEGORY_PRESETS.filter((cat) =>
    cat.toLowerCase().includes(catSearch.toLowerCase())
  );

  return (
    <div className="w-full bg-slate-900/40 border border-slate-800 rounded-xl p-5 md:p-6 backdrop-blur-md flex flex-col gap-6">
      {/* Section Title */}
      <div className="flex flex-col gap-1 border-b border-slate-850 pb-3">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-350 flex items-center gap-2">
          <Layers className="w-4 h-4 text-violet-500" />
          Standard Information Cards & Attributes
        </h3>
        <p className="text-xs text-slate-500">
          Provide standardized place details. All required parameters adhere strictly to the DoldFind place schema.
        </p>
      </div>

      {/* Grid Layout */}
      <div className="flex flex-col gap-6">
        
        {/* Place Type & Main Category Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Place Type Selector */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 select-none flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-violet-400" />
              Place Type (Required)
            </label>
            <Controller
              control={control}
              name="placeType"
              render={({ field }) => (
                <div className="flex flex-col gap-2">
                  <div className="flex border border-slate-800 rounded-lg p-0.5 bg-slate-950/40">
                    {PLACE_TYPES.map((type) => {
                      const isSelected = field.value === type;
                      return (
                        <button
                          key={type}
                          type="button"
                          onClick={() => field.onChange(type)}
                          className={`flex-1 text-center py-2.5 px-3 text-xs font-bold rounded-md transition-all duration-200 ${
                            isSelected
                              ? "bg-violet-600 text-white shadow-[0_0_12px_rgba(124,58,237,0.3)]"
                              : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/30"
                          }`}
                        >
                          {type}
                        </button>
                      );
                    })}
                  </div>
                  {errors.placeType && (
                    <span className="text-xs font-medium text-red-400 animate-fadeIn">
                      {errors.placeType.message}
                    </span>
                  )}
                </div>
              )}
            />
          </div>

          {/* Main Category Dropdown */}
          <div ref={catDropdownRef} className="relative flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 select-none flex items-center gap-1.5">
              Main Category
            </label>
            <Controller
              control={control}
              name="mainCategory"
              render={({ field }) => (
                <>
                  <button
                    type="button"
                    onClick={() => setIsCatDropdownOpen(!isCatDropdownOpen)}
                    className={`w-full bg-slate-900/60 border ${
                      errors.mainCategory
                        ? "border-red-500/80 focus:ring-red-500/20"
                        : "border-slate-800 focus:border-violet-500 focus:ring-violet-500/20"
                    } rounded-lg px-4 py-2.5 text-sm text-slate-100 flex items-center justify-between transition-all duration-200 outline-none focus:ring-4 text-left`}
                  >
                    <span className={field.value ? "text-slate-100" : "text-slate-500"}>
                      {field.value || "Select a main category..."}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${isCatDropdownOpen ? "transform rotate-180" : ""}`} />
                  </button>

                  {isCatDropdownOpen && (
                    <div className="absolute top-[calc(100%+4px)] left-0 w-full bg-slate-900/95 backdrop-blur-xl border border-slate-800 rounded-lg shadow-2xl z-50 max-h-56 overflow-y-auto p-1.5 animate-slideDown scrollbar-thin">
                      <div className="flex items-center gap-1.5 bg-slate-950/60 border border-slate-800 px-2.5 py-1.5 rounded-md mb-1.5">
                        <Search className="w-4 h-4 text-slate-500" />
                        <input
                          type="text"
                          placeholder="Search categories..."
                          value={catSearch}
                          onChange={(e) => setCatSearch(e.target.value)}
                          className="bg-transparent border-none outline-none text-xs text-slate-200 w-full focus:ring-0 p-0"
                        />
                      </div>

                      {filteredCategories.length > 0 ? (
                        filteredCategories.map((cat) => (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => {
                              field.onChange(cat);
                              setIsCatDropdownOpen(false);
                              setCatSearch("");
                            }}
                            className="w-full flex items-center justify-between text-left px-3 py-2 text-xs text-slate-350 hover:text-white hover:bg-slate-800/60 rounded-md transition-all group"
                          >
                            <span>{cat}</span>
                            {field.value === cat && (
                              <Check className="w-3.5 h-3.5 text-violet-500" />
                            )}
                          </button>
                        ))
                      ) : (
                        <div className="px-3 py-4 text-center text-xs text-slate-500 select-none">
                          No presets found.
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            />
            {errors.mainCategory && (
              <span className="text-xs font-medium text-red-400 animate-fadeIn">
                {errors.mainCategory.message}
              </span>
            )}
          </div>
        </div>

        {/* Location Breakdown: City, Area, State */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input
            label="City"
            placeholder="e.g. Bhubaneswar, Los Angeles"
            error={errors.city?.message}
            {...register("city")}
          />
          <Input
            label="Area"
            placeholder="e.g. Saheed Nagar, Downtown"
            error={errors.area?.message}
            {...register("area")}
          />
          <Input
            label="State"
            placeholder="e.g. Odisha, California"
            error={errors.state?.message}
            {...register("state")}
          />
        </div>

        {/* Best Timings Selector (Chips Grid) */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 select-none flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-violet-400" />
            Best Timings
          </label>
          <Controller
            control={control}
            name="bestTimings"
            render={({ field }) => {
              const selected: number[] = field.value || [];

              const handleToggleSlot = (idx: number) => {
                let updated: number[];
                if (selected.includes(idx)) {
                  updated = selected.filter((s) => s !== idx);
                } else {
                  updated = [...selected, idx];
                }
                field.onChange(updated);
              };

              const merged = mergeTimeSlots(selected);
              const continuousBlocks = getContinuousDurations(selected);
              const hasOver4Hours = continuousBlocks.some((b) => b > 4);

              return (
                <div className="flex flex-col gap-3">
                  {/* Grid of 24 Hour Slots */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2">
                    {TIME_SLOTS.map((slot, idx) => {
                      const isSelected = selected.includes(idx);
                      return (
                        <button
                          key={slot}
                          type="button"
                          onClick={() => handleToggleSlot(idx)}
                          className={`text-center py-2 px-1 text-[11px] font-semibold rounded-lg border transition-all duration-200 ${
                            isSelected
                              ? "bg-violet-950/50 border-violet-750 text-violet-300 shadow-[0_0_10px_rgba(124,58,237,0.15)]"
                              : "bg-slate-900/40 border-slate-800/80 text-slate-400 hover:border-slate-700/60 hover:text-slate-200"
                          }`}
                        >
                          {slot}
                        </button>
                      );
                    })}
                  </div>

                  {/* Helper / Merged preview */}
                  {selected.length > 0 && (
                    <div className="bg-slate-950/40 border border-slate-850 rounded-lg p-3 flex flex-col gap-1.5 animate-fadeIn">
                      <div className="text-xs text-slate-400 leading-relaxed">
                        <span className="font-bold text-slate-300">Selected Slots:</span> {selected.length} hour{selected.length > 1 ? "s" : ""} selected.
                      </div>
                      <div className="text-xs text-violet-400 leading-relaxed font-semibold">
                        <span className="text-slate-400 font-normal">Stored format:</span> &quot;{merged}&quot;
                      </div>

                      {/* Over 4 Hours Warning */}
                      {hasOver4Hours && (
                        <div className="flex items-center gap-1.5 text-amber-500 mt-1 animate-fadeIn">
                          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                          <span className="text-[10px] font-semibold uppercase tracking-wider">
                            Recommended maximum continuous best timing is 4 hours.
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {errors.bestTimings && (
                    <span className="text-xs font-medium text-red-400 animate-fadeIn">
                      {errors.bestTimings.message}
                    </span>
                  )}
                </div>
              );
            }}
          />
        </div>

        {/* Closed On Selector */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 select-none flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-violet-400" />
            Closed On
          </label>
          <Controller
            control={control}
            name="closedDays"
            render={({ field }) => {
              const selected: string[] = field.value || [];
              const isNeverClosed = selected.includes("Never Closed");

              const handleToggleDay = (day: string) => {
                let updated: string[];
                if (day === "Never Closed") {
                  updated = ["Never Closed"];
                } else {
                  const baseList = selected.filter((d) => d !== "Never Closed");
                  if (baseList.includes(day)) {
                    updated = baseList.filter((d) => d !== day);
                  } else {
                    updated = [...baseList, day];
                  }
                }
                field.onChange(updated);
              };

              return (
                <div className="flex flex-col gap-3">
                  <div className="flex flex-wrap gap-2">
                    {WEEK_DAYS.map((day) => {
                      const isSelected = selected.includes(day) && !isNeverClosed;
                      return (
                        <button
                          key={day}
                          type="button"
                          onClick={() => handleToggleDay(day)}
                          className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all duration-200 ${
                            isSelected
                              ? "bg-violet-950/50 border-violet-750 text-violet-300 shadow-[0_0_10px_rgba(124,58,237,0.15)]"
                              : "bg-slate-900/40 border-slate-800/80 text-slate-400 hover:border-slate-700/60 hover:text-slate-200"
                          }`}
                        >
                          {day}
                        </button>
                      );
                    })}

                    <button
                      type="button"
                      onClick={() => handleToggleDay("Never Closed")}
                      className={`px-4 py-1.5 text-xs font-bold rounded-lg border transition-all duration-200 ${
                        isNeverClosed
                          ? "bg-emerald-950/50 border-emerald-800 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.15)]"
                          : "bg-slate-900/40 border-slate-800/80 text-slate-400 hover:border-slate-700/60 hover:text-slate-200"
                      }`}
                    >
                      Never Closed
                    </button>
                  </div>

                  {errors.closedDays && (
                    <span className="text-xs font-medium text-red-400 animate-fadeIn">
                      {errors.closedDays.message}
                    </span>
                  )}
                </div>
              );
            }}
          />
        </div>

        {/* Nearest Metro & Crowd Level */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="flex flex-col gap-1.5">
            <Input
              label="Nearest Metro"
              placeholder="e.g. Master Canteen, Central Station"
              error={errors.nearestMetro?.message}
              {...register("nearestMetro")}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 select-none flex items-center gap-1.5">
              <Users2 className="w-3.5 h-3.5 text-violet-400" />
              Crowd Level
            </label>
            <Controller
              control={control}
              name="crowdLevel"
              render={({ field }) => (
                <div className="flex flex-col gap-2">
                  <div className="flex flex-wrap border border-slate-800 rounded-lg p-0.5 bg-slate-950/40">
                    {CROWD_LEVELS.map((level) => {
                      const isSelected = field.value === level;
                      return (
                        <button
                          key={level}
                          type="button"
                          onClick={() => field.onChange(level)}
                          className={`flex-1 text-center py-2 px-1 text-[11px] font-semibold rounded-md transition-all duration-200 whitespace-nowrap ${
                            isSelected
                              ? "bg-violet-600 text-white shadow-[0_0_12px_rgba(124,58,237,0.3)] font-bold"
                              : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/30"
                          }`}
                        >
                          {level}
                        </button>
                      );
                    })}
                  </div>
                  {errors.crowdLevel && (
                    <span className="text-xs font-medium text-red-400 animate-fadeIn">
                      {errors.crowdLevel.message}
                    </span>
                  )}
                </div>
              )}
            />
          </div>
        </div>

        {/* Safety Note Textarea */}
        <div className="flex flex-col gap-1.5">
          <Textarea
            label="Safety Note"
            placeholder="List any hazards, warning notes, or season advisories..."
            error={errors.safetyNote?.message}
            {...register("safetyNote")}
            rows={4}
          />
        </div>

        {/* Entry Fee & Ticket Required */}
        <div className="flex flex-col gap-4 border-t border-slate-850 pt-4 mt-2">
          <div className="flex flex-col gap-0.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-350">
              Entry Fee & Ticketing
            </h4>
            <p className="text-[10px] text-slate-500">
              Specify entry cost details or select ticket options.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="flex flex-col gap-1.5">
              <Input
                label="Entry Fee (Optional)"
                placeholder="e.g. ₹50, ₹100 per person, Free for Students"
                error={errors.entryFee?.message}
                {...register("entryFee")}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 select-none">
                Ticket Required
              </label>
              <Controller
                control={control}
                name="ticketRequired"
                render={({ field }) => (
                  <div className="flex flex-col gap-2">
                    <div className="flex border border-slate-800 rounded-lg p-0.5 bg-slate-950/40 w-fit min-w-[160px]">
                      {(["Yes", "No"] as const).map((opt) => {
                        const isSelected = field.value === opt;
                        return (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => field.onChange(opt)}
                            className={`flex-1 text-center py-2 px-6 text-xs font-semibold rounded-md transition-all duration-200 ${
                              isSelected
                                ? "bg-violet-600 text-white shadow-[0_0_12px_rgba(124,58,237,0.3)] font-bold"
                                : "text-slate-400 hover:text-slate-200 hover:bg-slate-905/30"
                            }`}
                          >
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                    {errors.ticketRequired && (
                      <span className="text-xs font-medium text-red-400 animate-fadeIn">
                        {errors.ticketRequired.message}
                      </span>
                    )}
                  </div>
                )}
              />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
