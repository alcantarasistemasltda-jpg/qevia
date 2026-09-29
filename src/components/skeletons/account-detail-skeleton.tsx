"use client";

import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

export function AccountDetailSkeleton() {
  return (
    <div className="space-y-6 pb-24 animate-pulse">
      {/* Detail Page Header Skeleton */}
      <div className="space-y-4">
        <Skeleton className="h-7 w-32 rounded-xl" />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Skeleton className="w-11 h-11 rounded-2xl shrink-0" />
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <Skeleton className="h-6 w-40 rounded-lg" />
                <Skeleton className="h-5 w-14 rounded-full" />
              </div>
              <Skeleton className="h-4 w-28 rounded-md" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-20 rounded-2xl" />
            <Skeleton className="h-9 w-24 rounded-2xl" />
          </div>
        </div>
      </div>

      {/* Hero Balance Card Skeleton */}
      <div className="p-5 sm:p-6 rounded-3xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Skeleton className="w-6 h-6 rounded-lg" />
              <Skeleton className="h-4 w-36 rounded-md" />
            </div>
            <Skeleton className="h-9 sm:h-10 w-48 rounded-xl" />
            <Skeleton className="h-3.5 w-40 rounded-md" />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Skeleton className="h-9 w-28 rounded-2xl" />
            <Skeleton className="h-9 w-28 rounded-2xl" />
            <Skeleton className="h-9 w-24 rounded-2xl" />
          </div>
        </div>
      </div>

      {/* Period Selector Tabs Skeleton */}
      <div className="flex items-center gap-2 overflow-hidden">
        <Skeleton className="h-8 w-24 rounded-full shrink-0" />
        <Skeleton className="h-8 w-24 rounded-full shrink-0" />
        <Skeleton className="h-8 w-28 rounded-full shrink-0" />
        <Skeleton className="h-8 w-20 rounded-full shrink-0" />
      </div>

      {/* 3 Metric Cards Skeleton (Entradas, Saídas, Resultado) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <Skeleton className="h-24 rounded-2xl" />
        <Skeleton className="h-24 rounded-2xl" />
        <Skeleton className="h-24 rounded-2xl" />
      </div>

      {/* Transaction List Skeleton */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-36 rounded-lg" />
          <Skeleton className="h-4 w-20 rounded-md" />
        </div>

        <div className="space-y-3">
          <Skeleton className="h-4 w-20 rounded-md" />
          <div className="space-y-2">
            <Skeleton className="h-16 w-full rounded-2xl" />
            <Skeleton className="h-16 w-full rounded-2xl" />
            <Skeleton className="h-16 w-full rounded-2xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
