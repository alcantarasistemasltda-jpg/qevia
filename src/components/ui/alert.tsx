import React from "react";
import { cn } from "@/utils/cn";
import {
  AlertCircle,
  CheckCircle2,
  Info,
  AlertTriangle,
  X,
} from "lucide-react";

export interface AlertProps {
  variant?: "info" | "success" | "warning" | "danger";
  title?: string;
  children: React.ReactNode;
  onClose?: () => void;
  className?: string;
}

export function Alert({
  variant = "info",
  title,
  children,
  onClose,
  className,
}: AlertProps) {
  const icons = {
    info: <Info className="w-5 h-5 text-sky-600 dark:text-sky-400 shrink-0" />,
    success: (
      <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
    ),
    warning: (
      <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
    ),
    danger: (
      <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
    ),
  };

  const variantStyles = {
    info: "bg-sky-50 border-sky-200 text-sky-900 dark:bg-sky-950/40 dark:border-sky-800 dark:text-sky-200",
    success:
      "bg-emerald-50 border-emerald-200 text-emerald-900 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-200",
    warning:
      "bg-amber-50 border-amber-200 text-amber-900 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-200",
    danger:
      "bg-rose-50 border-rose-200 text-rose-900 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-200",
  };

  return (
    <div
      role="alert"
      className={cn(
        "relative flex items-start gap-3 p-4 rounded-xl border text-sm transition-all",
        variantStyles[variant],
        className
      )}
    >
      {icons[variant]}
      <div className="flex-1 min-w-0">
        {title && <h5 className="font-semibold mb-0.5 leading-tight">{title}</h5>}
        <div className="text-xs opacity-90 leading-relaxed">{children}</div>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          type="button"
          aria-label="Fechar alerta"
          className="shrink-0 -mr-1 -mt-1 p-1 rounded-lg opacity-70 hover:opacity-100 transition-opacity focus:outline-none"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
