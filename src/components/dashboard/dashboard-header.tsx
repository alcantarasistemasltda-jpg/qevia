import React from "react";
import { NotificationBell } from "@/components/layout/notification-bell";

interface DashboardHeaderProps {
  userName: string;
  avatarUrl?: string;
  hasUnreadAlerts?: boolean;
  onAlertClick?: () => void;
}

export function DashboardHeader({
  userName,
}: DashboardHeaderProps) {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Bom dia";
    if (hour < 18) return "Boa tarde";
    return "Boa noite";
  };

  return (
    <div className="flex items-center justify-between pt-1 pb-3">
      <div className="space-y-0.5">
        <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-1.5">
          <span>{getGreeting()}, {userName}</span>
          <span className="text-base select-none">👋</span>
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Como está sua vida financeira hoje?
        </p>
      </div>

      <div className="flex items-center gap-2">
        <NotificationBell />

        <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-slate-900 via-slate-800 to-teal-600 text-white flex items-center justify-center text-xs font-bold shadow-xs select-none">
          {(userName[0] || "U").toUpperCase()}
        </div>
      </div>
    </div>
  );
}
