"use client";

import React, { useEffect, useState } from "react";
import { X, Copy, Check } from "lucide-react";
import { Button } from "./Button";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  jsonContent: object | null;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  jsonContent,
}) => {
  const [copied, setCopied] = useState(false);

  // Prevent scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const jsonString = jsonContent ? JSON.stringify(jsonContent, null, 2) : "";

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(jsonString);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy JSON: ", err);
    }
  };

  // Simple function to highlight JSON keys/values using basic HTML spans
  const renderHighlightedJson = (json: string) => {
    if (!json) return null;
    
    // Simple regex highlighter
    return json.split("\n").map((line, idx) => {
      // Find keys in quotes e.g. "title":
      const keyRegex = /^(\s*)"([^"]+)":/;
      const keyMatch = line.match(keyRegex);
      
      if (keyMatch) {
        const indent = keyMatch[1];
        const key = keyMatch[2];
        const rest = line.substring(keyMatch[0].length);
        
        return (
          <div key={idx} className="font-mono text-xs md:text-sm leading-relaxed">
            <span className="text-slate-500">{indent}</span>
            <span className="text-violet-400">&quot;{key}&quot;</span>
            <span className="text-slate-300">:</span>
            {renderJsonValue(rest)}
          </div>
        );
      }
      
      return (
        <div key={idx} className="font-mono text-xs md:text-sm leading-relaxed text-slate-300">
          {line}
        </div>
      );
    });
  };

  const renderJsonValue = (valueStr: string) => {
    const trimmed = valueStr.trim();
    if (trimmed.startsWith('"')) {
      // String value
      return <span className="text-emerald-400"> {trimmed}</span>;
    } else if (trimmed === "true" || trimmed === "false") {
      // Boolean
      return <span className="text-amber-500"> {trimmed}</span>;
    } else if (!isNaN(Number(trimmed.replace(/,$/, "")))) {
      // Number
      return <span className="text-sky-400"> {trimmed}</span>;
    } else if (trimmed === "null") {
      // Null
      return <span className="text-slate-400"> {trimmed}</span>;
    }
    // Array/Object opening, or comma/bracket
    return <span className="text-slate-300"> {valueStr}</span>;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-md transition-opacity duration-300 animate-fadeIn"
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-3xl bg-slate-900/90 border border-slate-800 rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden animate-zoomIn z-10 backdrop-blur-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80">
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            {title}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content (Scrollable JSON view) */}
        <div className="flex-1 overflow-auto p-6 bg-slate-950/40 relative">
          <div className="absolute top-4 right-4 flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleCopy}
              className="flex items-center gap-1.5 backdrop-blur-md bg-slate-800/80 border-slate-700/60 hover:bg-slate-700/80"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-300" />
                  <span>Copy JSON</span>
                </>
              )}
            </Button>
          </div>

          <pre className="overflow-x-auto select-text pt-6 pb-2 pr-12 scrollbar-thin">
            <code>{renderHighlightedJson(jsonString)}</code>
          </pre>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800/80 flex justify-end gap-3 bg-slate-900/40">
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
          <Button variant="primary" onClick={handleCopy} className="flex items-center gap-2">
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            Copy &amp; Continue
          </Button>
        </div>
      </div>
    </div>
  );
};
