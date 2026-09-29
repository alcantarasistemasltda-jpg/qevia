"use client";

import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

export function BudgetDetailSkeleton() {
  return (
    <div className="space-y-6 pb-20 md:pb-8 animate-pulse">
      {/* Detail Page Header Skeleton */}
      <div className="space-y-4">
        <Skeleton className="h-7 w-44 rounded-xl" />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Skeleton className="w-11 h-11 rounded-2xl shrink-0" />
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <Skeleton className="h-6 w-40 rounded-lg" />
                <Skeleton className="h-5 w-24 rounded-full" />
              </div>
              <Skeleton className="h-4 w-36 rounded-md" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-24 rounded-2xl" />
            <Skeleton className="h-9 w-20 rounded-2xl" />
            <Skeleton className="h-9 w-20 rounded-2xl" />
          </div>
        </div>
      </div>

      {/* Main Budget Detail Hero Skeleton */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Skeleton className="w-14 h-14 rounded-2xl shrink-0" />
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Skeleton className="h-6 w-36 rounded-lg" />
                <Skeleton className="h-5 w-24 rounded-full" />
              </div>
              <Skeleton className="h-4 w-40 rounded-md" />
            </div>
          </div>

          <div className="space-y-1.5 sm:text-right">
            <Skeleton className="h-3 w-20 rounded-md sm:ml-auto" />
            <Skeleton className="h-8 w-32 rounded-xl sm:ml-auto" />
          </div>
        </div>

        {/* Progress bar */}
        <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="flex justify-between">
            <Skeleton className="h-4 w-28 rounded-md" />
            <Skeleton className="h-4 w-28 rounded-md" />
          </div>
          <Skeleton className="h-3 w-full rounded-full" />
        </div>
      </div>

      {/* Transactions in Budget Section Skeleton */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-44 rounded-lg" />
          <Skeleton className="h-4 w-20 rounded-md" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-16 w-full rounded-2xl" />
          <Skeleton className="h-16 w-full rounded-2xl" />
          <Skeleton className="h-16 w-full rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
