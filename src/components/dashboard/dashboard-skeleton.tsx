import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

export function DashboardSkeleton() {
  return (
    <div className="space-y-5 animate-pulse">
      {/* Header skeleton */}
      <div className="flex items-center justify-between pt-1 pb-2">
        <div className="space-y-1.5">
          <Skeleton className="h-6 w-40 rounded-xl" />
          <Skeleton className="h-3.5 w-48 rounded-lg" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="w-9 h-9 rounded-2xl" />
          <Skeleton className="w-9 h-9 rounded-2xl" />
        </div>
      </div>

      {/* Balance Card Skeleton */}
      <Skeleton className="h-44 w-full rounded-3xl" />

      {/* Month Summary Skeleton */}
      <Skeleton className="h-24 w-full rounded-3xl" />

      {/* Accounts List Skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-28 rounded-lg" />
        <div className="flex gap-2.5 overflow-hidden">
          <Skeleton className="h-24 w-44 shrink-0 rounded-2xl" />
          <Skeleton className="h-24 w-44 shrink-0 rounded-2xl" />
          <Skeleton className="h-24 w-44 shrink-0 rounded-2xl" />
        </div>
      </div>

      {/* Recent Transactions Skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-36 rounded-lg" />
        <Skeleton className="h-48 w-full rounded-3xl" />
      </div>
    </div>
  );
}
