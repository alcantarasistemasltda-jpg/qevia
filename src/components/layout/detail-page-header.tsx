"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Edit2, Trash2, Power } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useHideValues } from "@/hooks/use-hide-values";
import { formatCurrency } from "@/utils/formatters";
import { cn } from "@/utils/cn";

export interface DetailPageHeaderProps {
  /** Target route for the back button */
  backHref?: string;
  /** Custom click handler for back button */
  onBack?: () => void;
  /** Text label next to back arrow (default: "Voltar") */
  backLabel?: string;
  /** Main title of the entity */
  title: string;
  /** Optional subtitle or metadata */
  subtitle?: React.ReactNode;
  /** Optional status badge */
  badge?: React.ReactNode;
  /** Optional entity icon component or element */
  icon?: React.ReactNode;
  /** Optional highlight monetary or numeric value */
  value?: number | string | null;
  /** Label for the highlight value */
  valueLabel?: string;
  /** Custom text color class for the value */
  valueColor?: string;
  /** Whether the value should follow the privacy toggle (default: true) */
  hideValueSupport?: boolean;
  /** Direct edit callback (renders Edit button) */
  onEdit?: () => void;
  /** Direct delete callback (renders Delete button) */
  onDelete?: () => void;
  /** Direct status toggle callback (renders Activate/Deactivate button) */
  onToggleStatus?: () => void;
  /** Status flag for toggle button text */
  isActive?: boolean;
  /** Custom action elements */
  actions?: React.ReactNode;
  /** Additional container classes */
  className?: string;
}

export function DetailPageHeader({
  backHref,
  onBack,
  backLabel = "Voltar",
  title,
  subtitle,
  badge,
  icon,
  value,
  valueLabel,
  valueColor,
  hideValueSupport = true,
  onEdit,
  onDelete,
  onToggleStatus,
  isActive = true,
  actions,
  className,
}: DetailPageHeaderProps) {
  const router = useRouter();
  const { isHidden } = useHideValues();

  const handleBackClick = () => {
    if (onBack) {
      onBack();
    } else if (backHref) {
      router.push(backHref);
    } else {
      router.back();
    }
  };

  const renderValue = () => {
    if (value === undefined || value === null) return null;
    if (hideValueSupport && isHidden) return "R$ ••••••";
    if (typeof value === "number") return formatCurrency(value);
    return value;
  };

  return (
    <div className={cn("space-y-3 sm:space-y-4", className)}>
      {/* Top Navigation Row: Back Button & Actions */}
      <div className="flex items-center justify-between gap-2 min-w-0">
        {backHref ? (
          <Link
            href={backHref}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 transition-colors min-h-[44px] py-2 pr-2 shrink-0 select-none"
          >
            <ArrowLeft className="w-4 h-4 shrink-0" />
            <span className="truncate">{backLabel}</span>
          </Link>
        ) : (
          <button
            type="button"
            onClick={handleBackClick}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 transition-colors min-h-[44px] py-2 pr-2 shrink-0 select-none"
          >
            <ArrowLeft className="w-4 h-4 shrink-0" />
            <span className="truncate">{backLabel}</span>
          </button>
        )}

        {/* Action Buttons Toolbar */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 flex-wrap justify-end">
          {onEdit && (
            <Button
              variant="outline"
              size="sm"
              onClick={onEdit}
              leftIcon={<Edit2 className="w-3.5 h-3.5" />}
              className="text-xs font-bold rounded-xl h-9 min-h-[36px] sm:min-h-[40px] px-2.5 sm:px-3"
            >
              <span className="hidden xs:inline sm:inline">Editar</span>
            </Button>
          )}

          {onToggleStatus && (
            <Button
              variant="outline"
              size="sm"
              onClick={onToggleStatus}
              leftIcon={<Power className="w-3.5 h-3.5" />}
              className="text-xs font-bold text-slate-600 dark:text-slate-400 rounded-xl h-9 min-h-[36px] sm:min-h-[40px] px-2.5 sm:px-3"
            >
              <span className="hidden xs:inline sm:inline">
                {isActive ? "Desativar" : "Reativar"}
              </span>
            </Button>
          )}

          {onDelete && (
            <Button
              variant="outline"
              size="sm"
              onClick={onDelete}
              leftIcon={<Trash2 className="w-3.5 h-3.5 text-rose-500" />}
              className="text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl h-9 min-h-[36px] sm:min-h-[40px] px-2.5 sm:px-3"
            >
              <span className="hidden xs:inline sm:inline">Excluir</span>
            </Button>
          )}

          {actions}
        </div>
      </div>

      {/* Main Header Content Block */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        {/* Left Info: Icon, Title, Badge, Subtitle */}
        <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
          {icon && (
            <div className="shrink-0 mt-0.5 sm:mt-0">
              {icon}
            </div>
          )}

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap min-w-0">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight truncate">
                {title}
              </h1>
              {badge && <div className="shrink-0">{badge}</div>}
            </div>

            {subtitle && (
              <div className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                {subtitle}
              </div>
            )}
          </div>
        </div>

        {/* Right Info: Optional Highlight Value */}
        {value !== undefined && value !== null && (
          <div className="text-left sm:text-right shrink-0 pt-1 sm:pt-0">
            {valueLabel && (
              <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-slate-400 block truncate">
                {valueLabel}
              </span>
            )}
            <p
              className={cn(
                "text-2xl sm:text-3xl font-extrabold tracking-tight truncate",
                valueColor || "text-slate-900 dark:text-white"
              )}
            >
              {renderValue()}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
