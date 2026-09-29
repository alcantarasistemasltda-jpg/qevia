"use client";

import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { X } from "lucide-react";

interface TransactionDetailModalSkeletonProps {
  onClose?: () => void;
}

export function TransactionDetailModalSkeleton({
  onClose,
}: TransactionDetailModalSkeletonProps) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end md:justify-center md:items-center bg-slate-950/60 backdrop-blur-xs animate-in fade-in-50 duration-150">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative z-10 w-full md:max-w-md bg-white dark:bg-slate-950 border-t md:border border-slate-200 dark:border-slate-800 rounded-t-3xl md:rounded-3xl shadow-2xl flex flex-col max-h-[90dvh] md:max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-2 shrink-0 border-b border-slate-100 dark:border-slate-800">
          <Skeleton className="h-4 w-36 rounded-md" />

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
          {/* Main Amount Hero Skeleton */}
          <div className="flex flex-col items-center justify-center p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 space-y-2">
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-20 rounded-full" />
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>
            <Skeleton className="h-9 w-40 rounded-xl" />
            <Skeleton className="h-4 w-48 rounded-md" />
          </div>

          {/* Details List Skeleton */}
          <div className="space-y-3 divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
            <div className="flex items-center justify-between pt-2">
              <Skeleton className="h-4 w-20 rounded-md" />
              <Skeleton className="h-4 w-28 rounded-md" />
            </div>
            <div className="flex items-center justify-between pt-3">
              <Skeleton className="h-4 w-24 rounded-md" />
              <Skeleton className="h-4 w-32 rounded-md" />
            </div>
            <div className="flex items-center justify-between pt-3">
              <Skeleton className="h-4 w-16 rounded-md" />
              <Skeleton className="h-4 w-24 rounded-md" />
            </div>
            <div className="flex items-center justify-between pt-3">
              <Skeleton className="h-4 w-20 rounded-md" />
              <Skeleton className="h-4 w-24 rounded-md" />
            </div>
            <div className="flex items-center justify-between pt-3">
              <Skeleton className="h-4 w-28 rounded-md" />
              <Skeleton className="h-4 w-20 rounded-md" />
            </div>
          </div>
        </div>

        {/* Footer Skeleton */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 flex items-center justify-between gap-2">
          <Skeleton className="h-10 w-24 rounded-xl" />
          <Skeleton className="h-10 w-24 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
