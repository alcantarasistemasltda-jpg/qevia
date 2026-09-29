"use client";

import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

export function CommitmentDetailSkeleton() {
  return (
    <div className="max-w-2xl mx-auto space-y-5 pb-16 animate-pulse">
      {/* Detail Page Header Skeleton */}
      <div className="space-y-4">
        <Skeleton className="h-7 w-40 rounded-xl" />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Skeleton className="w-11 h-11 rounded-2xl shrink-0" />
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <Skeleton className="h-6 w-44 rounded-lg" />
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
              <Skeleton className="h-4 w-36 rounded-md" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-20 rounded-2xl" />
            <Skeleton className="h-9 w-20 rounded-2xl" />
          </div>
        </div>
      </div>

      {/* Main Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-md space-y-6">
        {/* Top Badges */}
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-28 rounded-full" />
          <Skeleton className="h-6 w-24 rounded-full" />
        </div>

        {/* Amount & Title */}
        <div className="text-center space-y-2 py-3 border-y border-slate-100 dark:border-slate-800">
          <Skeleton className="h-4 w-36 mx-auto rounded-md" />
          <Skeleton className="h-10 w-48 mx-auto rounded-xl" />
        </div>

        {/* Metadata Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950">
          <div className="space-y-1.5">
            <Skeleton className="h-3.5 w-20 rounded-md" />
            <Skeleton className="h-4 w-28 rounded-md" />
          </div>
          <div className="space-y-1.5">
            <Skeleton className="h-3.5 w-20 rounded-md" />
            <Skeleton className="h-4 w-32 rounded-md" />
          </div>
          <div className="space-y-1.5">
            <Skeleton className="h-3.5 w-28 rounded-md" />
            <Skeleton className="h-4 w-36 rounded-md" />
          </div>
          <div className="space-y-1.5">
            <Skeleton className="h-3.5 w-20 rounded-md" />
            <Skeleton className="h-4 w-24 rounded-md" />
          </div>
        </div>

        {/* Action button */}
        <Skeleton className="h-12 w-full rounded-2xl" />
      </div>
    </div>
  );
}
