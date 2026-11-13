"use client";

import React, { forwardRef, InputHTMLAttributes } from "react";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = "", error, leftIcon, rightIcon, disabled, ...props }, ref) => {
    return (
      <div className="w-full">
        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3 flex items-center pointer-events-none text-zinc-400">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            disabled={disabled}
            className={`w-full rounded-xl border bg-white text-zinc-900 placeholder:text-zinc-400 text-sm h-10 transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-zinc-900 disabled:opacity-50 disabled:bg-zinc-50 ${
              leftIcon ? "pl-9" : "pl-3.5"
            } ${rightIcon ? "pr-9" : "pr-3.5"} ${
              error ? "border-red-500 focus:ring-red-500 focus:border-red-500" : "border-zinc-200"
            } ${className}`}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3 flex items-center text-zinc-400">
              {rightIcon}
            </div>
          )}
        </div>
        {error && <p className="mt-1.5 text-xs text-red-600 font-medium">{error}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";

