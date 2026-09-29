"use client";

import React, { useRef, useEffect } from "react";
import { cn } from "@/utils/cn";
import { formatCurrency } from "@/utils/formatters";

interface AmountInputProps {
  value: number; // Stored as float/number, e.g. 45.00
  onChange: (value: number) => void;
  type?: "EXPENSE" | "INCOME" | "TRANSFER";
  autoFocus?: boolean;
  className?: string;
}

export function AmountInput({
  value,
  onChange,
  type = "EXPENSE",
  autoFocus = true,
  className,
}: AmountInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  // Convert raw numeric value into cents string for input
  // e.g. 45.50 -> 4550 cents
  const cents = Math.round(value * 100);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      e.preventDefault();
      const newCents = Math.floor(cents / 10);
      onChange(newCents / 100);
      return;
    }

    if (e.key >= "0" && e.key <= "9") {
      e.preventDefault();
      const digit = parseInt(e.key, 10);
      // Limit to 999,999,999.99 (max 11 digits)
      if (cents.toString().length >= 10) return;
      const newCents = cents * 10 + digit;
      onChange(newCents / 100);
      return;
    }

    // Allow Tab, Enter, Escape, Arrow keys
    if (["Tab", "Enter", "Escape", "ArrowLeft", "ArrowRight"].includes(e.key)) {
      return;
    }

    // Ignore any other keypress
    e.preventDefault();
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/[^0-9]/g, "");
    if (pasted) {
      const num = parseInt(pasted, 10);
      if (!isNaN(num)) {
        onChange(num / 100);
      }
    }
  };

  const colorClasses = {
    EXPENSE: "text-rose-600 dark:text-rose-400 focus-within:ring-rose-500/20",
    INCOME: "text-emerald-600 dark:text-emerald-400 focus-within:ring-emerald-500/20",
    TRANSFER: "text-sky-600 dark:text-sky-400 focus-within:ring-sky-500/20",
  };

  return (
    <div
      onClick={() => inputRef.current?.focus()}
      className={cn(
        "flex flex-col items-center justify-center p-4 py-5 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800/80 cursor-text transition-all",
        className
      )}
    >
      <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">
        {type === "EXPENSE" ? "Valor da Despesa" : type === "INCOME" ? "Valor da Receita" : "Valor a Transferir"}
      </span>

      <div className="relative flex items-baseline justify-center max-w-full">
        <span
          className={cn(
            "text-3xl sm:text-4xl font-extrabold tracking-tight transition-colors select-none",
            cents === 0 ? "text-slate-400 dark:text-slate-600" : colorClasses[type]
          )}
        >
          {formatCurrency(value)}
        </span>

        {/* Hidden input catching keyboard & mobile numpad events */}
        <input
          ref={inputRef}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={cents === 0 ? "" : cents.toString()}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          onChange={() => {}} // Controlled by onKeyDown
          aria-label="Valor monetário"
          className="sr-only"
        />
      </div>

      <p className="text-[10px] text-slate-400 mt-1">Toque para digitar o valor</p>
    </div>
  );
}
