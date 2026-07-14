import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = "", label, error, helperText, type = "text", id, ...props }, ref) => {
    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={id}
            className="text-xs font-semibold uppercase tracking-wider text-slate-400 select-none"
          >
            {label}
          </label>
        )}
        <div className="relative">
          <input
            ref={ref}
            type={type}
            id={id}
            className={`w-full bg-slate-900/60 border ${
              error ? "border-red-500/80 focus:border-red-500 focus:ring-red-500/20" : "border-slate-800 focus:border-violet-500 focus:ring-violet-500/20"
            } rounded-lg px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 transition-all duration-200 outline-none focus:ring-4`}
            {...props}
          />
        </div>
        {error ? (
          <span className="text-xs font-medium text-red-400 select-none animate-fadeIn">
            {error}
          </span>
        ) : helperText ? (
          <span className="text-xs text-slate-500 select-none">{helperText}</span>
        ) : null}
      </div>
    );
  }
);

Input.displayName = "Input";
