"use client";

import React from "react";
import { Header } from "./header";
import { MobileNav } from "./mobile-nav";
import { DesktopSidebar } from "./desktop-sidebar";

interface AppShellProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  hideSidebar?: boolean;
}

export function AppShell({
  children,
  title,
  subtitle,
  hideSidebar = false,
}: AppShellProps) {
  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* Desktop Sidebar */}
      {!hideSidebar && <DesktopSidebar />}

      {/* Main Column */}
      <div className="flex flex-col flex-1 min-w-0">
        <Header title={title} subtitle={subtitle} />

        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-8 max-w-7xl w-full mx-auto">
          {children}
        </main>

        {/* Mobile Bottom Navigation */}
        {!hideSidebar && <MobileNav />}
      </div>
    </div>
  );
}
