import React, { HTMLAttributes } from "react";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "secondary" | "outline" | "subtle";
  size?: "sm" | "md";
}

export function Badge({
  className = "",
  variant = "default",
  size = "md",
  children,
  ...props
}: BadgeProps) {
  const baseStyles =
    "inline-flex items-center font-medium rounded-full transition-colors";

  const variantStyles = {
    default: "bg-zinc-900 text-white",
    secondary: "bg-zinc-100 text-zinc-800",
    outline: "bg-transparent border border-zinc-200 text-zinc-700",
    subtle: "bg-zinc-100/80 text-zinc-600 border border-zinc-200/60",
  };

  const sizeStyles = {
    sm: "px-2 py-0.5 text-[11px]",
    md: "px-2.5 py-1 text-xs",
  };

  return (
    <span
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}

