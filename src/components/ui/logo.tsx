import React from "react";
import Link from "next/link";
import { cn } from "@/utils/cn";

interface LogoProps {
  showTagline?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
  href?: string;
}

export function Logo({
  showTagline = false,
  size = "md",
  className,
  href = "/",
}: LogoProps) {
  const sizeClasses = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-2xl",
  };

  const iconSizes = {
    sm: "w-7 h-7",
    md: "w-9 h-9",
    lg: "w-11 h-11",
  };

  const content = (
    <div className={cn("inline-flex items-center gap-2.5 select-none group", className)}>
      <div
        className={cn(
          iconSizes[size],
          "relative flex items-center justify-center rounded-xl bg-gradient-to-br from-slate-900 via-blue-900 to-teal-500 shadow-sm shadow-teal-500/10 text-white font-bold transition-transform group-hover:scale-[1.02]"
        )}
      >
        {/* Modern geometric monogram icon */}
        <svg
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-3/5 h-3/5"
        >
          <circle
            cx="16"
            cy="15"
            r="10"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            className="text-white/90"
          />
          <path
            d="M21 20L26 26"
            stroke="url(#qevia-grad)"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
          <circle cx="16" cy="15" r="3.5" fill="#14B8A6" />
          <defs>
            <linearGradient id="qevia-grad" x1="21" y1="20" x2="26" y2="26" gradientUnits="userSpaceOnUse">
              <stop stopColor="#38BDF8" />
              <stop offset="1" stopColor="#14B8A6" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      <div className="flex flex-col">
        <span
          className={cn(
            sizeClasses[size],
            "font-extrabold tracking-tight bg-gradient-to-r from-slate-900 via-slate-800 to-teal-700 dark:from-white dark:via-slate-100 dark:to-teal-400 bg-clip-text text-transparent"
          )}
        >
          QEVIA
        </span>
        {showTagline && (
          <span className="text-[10px] uppercase font-medium tracking-wider text-slate-500 dark:text-slate-400 -mt-1">
            Clareza Financeira
          </span>
        )}
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 rounded-lg">
        {content}
      </Link>
    );
  }

  return content;
}
