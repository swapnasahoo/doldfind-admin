"use client";

import React, { useState, useEffect, useRef } from "react";
import { Search, X, Check, Plus } from "lucide-react";

interface MultiSelectProps {
  label?: string;
  placeholder?: string;
  selected: string[];
  onChange: (selected: string[]) => void;
  error?: string;
  presetOptions?: string[];
}

const DEFAULT_CATEGORIES = [
  "Nature",
  "Waterfall",
  "Hiking",
  "Camping",
  "Viewpoint",
  "Beach",
  "Historical",
  "Hidden Gem",
  "Cafe",
  "Restaurant",
  "Adventure",
  "Park",
  "Caves",
  "Lakes & Rivers",
  "Free",
  "Paid",
];

export const MultiSelect: React.FC<MultiSelectProps> = ({
  label,
  placeholder = "Search or add categories...",
  selected = [],
  onChange,
  error,
  presetOptions = DEFAULT_CATEGORIES,
}) => {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter options based on query
  const filteredOptions = presetOptions.filter(
    (option) =>
      option.toLowerCase().includes(query.toLowerCase()) &&
      !selected.some((sel) => sel.toLowerCase() === option.toLowerCase())
  );

  // Check if query itself is a potential new option
  const showAddCustom =
    query.trim().length > 0 &&
    !presetOptions.some(
      (opt) => opt.toLowerCase() === query.trim().toLowerCase()
    ) &&
    !selected.some((sel) => sel.toLowerCase() === query.trim().toLowerCase());

  const handleSelectOption = (option: string) => {
    let updated = [...selected];
    if (option === "Free") {
      updated = updated.filter((item) => item !== "Paid");
    } else if (option === "Paid") {
      updated = updated.filter((item) => item !== "Free");
    }
    updated.push(option);
    onChange(updated);
    setQuery("");
    inputRef.current?.focus();
  };

  const handleRemoveOption = (option: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = selected.filter((item) => item !== option);
    onChange(updated);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && query.trim()) {
      e.preventDefault();
      const trimmedQuery = query.trim();
      // Check if already selected
      if (!selected.some((sel) => sel.toLowerCase() === trimmedQuery.toLowerCase())) {
        // Find match in presets case-insensitively, or use custom
        const match = presetOptions.find(
          (opt) => opt.toLowerCase() === trimmedQuery.toLowerCase()
        );
        handleSelectOption(match || trimmedQuery);
      } else {
        setQuery("");
      }
    } else if (e.key === "Backspace" && !query && selected.length > 0) {
      // Remove last tag if input is empty
      const updated = [...selected];
      updated.pop();
      onChange(updated);
    }
  };

  return (
    <div ref={containerRef} className="w-full flex flex-col gap-1.5 relative">
      {label && (
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 select-none">
          {label}
        </span>
      )}

      {/* Input / Tag Container */}
      <div
        onClick={() => {
          setIsOpen(true);
          inputRef.current?.focus();
        }}
        className={`w-full bg-slate-900/60 border min-h-[46px] flex flex-wrap gap-2 items-center px-3 py-2 rounded-lg cursor-text transition-all duration-200 ${
          error
            ? "border-red-500/80 focus-within:border-red-500 focus-within:ring-4 focus-within:ring-red-500/20"
            : "border-slate-800 focus-within:border-violet-500 focus-within:ring-4 focus-within:ring-violet-500/20"
        }`}
      >
        {selected.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 bg-violet-950/60 text-violet-300 border border-violet-800/60 pl-2.5 pr-1.5 py-0.5 rounded-full text-xs font-medium animate-fadeIn select-none"
          >
            {tag}
            <button
              type="button"
              onClick={(e) => handleRemoveOption(tag, e)}
              className="text-violet-400 hover:text-violet-200 p-0.5 rounded-full hover:bg-violet-900/60 transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}

        <div className="flex-1 min-w-[120px] flex items-center gap-1.5">
          <Search className="w-4 h-4 text-slate-500 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(true);
            }}
            onKeyDown={handleKeyDown}
            placeholder={selected.length === 0 ? placeholder : ""}
            className="w-full bg-transparent border-none outline-none text-sm text-slate-100 placeholder-slate-500 p-0 focus:ring-0 focus:outline-none"
          />
        </div>
      </div>

      {error && (
        <span className="text-xs font-medium text-red-400 select-none animate-fadeIn">
          {error}
        </span>
      )}

      {/* Dropdown Options */}
      {isOpen && (
        <div className="absolute top-[calc(100%+4px)] left-0 w-full bg-slate-900/95 backdrop-blur-xl border border-slate-800 rounded-lg shadow-2xl z-50 max-h-60 overflow-y-auto overflow-x-hidden p-1 animate-slideDown scrollbar-thin">
          {/* Custom Tag Option */}
          {showAddCustom && (
            <button
              type="button"
              onClick={() => handleSelectOption(query.trim())}
              className="w-full flex items-center justify-between text-left px-3 py-2.5 text-xs text-emerald-400 hover:bg-slate-800/80 rounded-md font-semibold transition-colors group"
            >
              <span className="flex items-center gap-2">
                <Plus className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                Add custom category: &quot;{query.trim()}&quot;
              </span>
            </button>
          )}

          {/* Preset list */}
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => handleSelectOption(option)}
                className="w-full flex items-center justify-between text-left px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-800/60 rounded-md transition-all group"
              >
                <span>{option}</span>
                <Check className="w-4 h-4 text-violet-500 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            ))
          ) : !showAddCustom ? (
            <div className="px-3 py-4 text-center text-xs text-slate-500 select-none">
              No categories found. Type to add a custom one.
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};
