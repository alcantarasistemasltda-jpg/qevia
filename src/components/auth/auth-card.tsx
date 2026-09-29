import React from "react";
import { Logo } from "@/components/ui/logo";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/utils/cn";

interface AuthCardProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

export function AuthCard({
  title,
  subtitle,
  children,
  footer,
  className,
}: AuthCardProps) {
  return (
    <div className="w-full max-w-md mx-auto px-4 py-8 sm:py-12">
      <div className="flex flex-col items-center text-center mb-6">
        <Logo size="lg" showTagline />
      </div>

      <Card variant="elevated" className={cn("border-slate-200/80 dark:border-slate-800/80 backdrop-blur-sm", className)}>
        <CardContent className="p-6 sm:p-8 space-y-6">
          <div className="text-center space-y-1">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              {title}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              {subtitle}
            </p>
          </div>

          {children}

          {footer && (
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 text-center">
              {footer}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
