"use client";

import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

export function InvoiceDetailSkeleton() {
  return (
    <div className="space-y-6 pb-24 animate-pulse">
      {/* Detail Page Header Skeleton */}
      <div className="space-y-4">
        <Skeleton className="h-7 w-36 rounded-xl" />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Skeleton className="w-11 h-11 rounded-2xl shrink-0" />
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <Skeleton className="h-6 w-44 rounded-lg" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
              <Skeleton className="h-4 w-32 rounded-md" />
            </div>
          </div>
        </div>
      </div>

      {/* Hero Invoice Card Skeleton */}
      <div className="p-5 sm:p-6 rounded-3xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-28 rounded-md" />
              <Skeleton className="h-4 w-16 rounded-md" />
            </div>
            <Skeleton className="h-9 sm:h-10 w-44 rounded-xl" />
            <Skeleton className="h-3.5 w-48 rounded-md" />
          </div>
          <Skeleton className="h-10 w-32 rounded-2xl shrink-0" />
        </div>

        {/* Dates metadata */}
        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
          <div className="space-y-1">
            <Skeleton className="h-3 w-16 rounded-md" />
            <Skeleton className="h-4 w-24 rounded-md" />
          </div>
          <div className="space-y-1">
            <Skeleton className="h-3 w-16 rounded-md" />
            <Skeleton className="h-4 w-24 rounded-md" />
          </div>
        </div>
      </div>

      {/* Invoice Items List Skeleton */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-44 rounded-lg" />
          <Skeleton className="h-4 w-16 rounded-md" />
        </div>

        <div className="space-y-2">
          <Skeleton className="h-16 w-full rounded-2xl" />
          <Skeleton className="h-16 w-full rounded-2xl" />
          <Skeleton className="h-16 w-full rounded-2xl" />
          <Skeleton className="h-16 w-full rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
