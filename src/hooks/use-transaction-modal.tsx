"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { NewTransactionModal } from "@/components/transactions/new-transaction-modal";
import type { TransactionFlowType } from "@/components/transactions/type-selector";

interface OpenTransactionOptions {
  defaultType?: TransactionFlowType;
  defaultAccountId?: string;
  defaultCreditCardId?: string;
  onSuccess?: () => void;
}

interface TransactionModalContextType {
  openNewTransaction: (options?: OpenTransactionOptions) => void;
  closeNewTransaction: () => void;
  isOpen: boolean;
}

const TransactionModalContext = createContext<TransactionModalContextType | undefined>(undefined);

export function TransactionModalProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [defaultType, setDefaultType] = useState<TransactionFlowType>("EXPENSE");
  const [defaultAccountId, setDefaultAccountId] = useState<string | undefined>(undefined);
  const [defaultCreditCardId, setDefaultCreditCardId] = useState<string | undefined>(undefined);
  const [onSuccessCallback, setOnSuccessCallback] = useState<(() => void) | undefined>(undefined);

  const openNewTransaction = useCallback((options?: OpenTransactionOptions) => {
    setDefaultType(options?.defaultType || "EXPENSE");
    setDefaultAccountId(options?.defaultAccountId);
    setDefaultCreditCardId(options?.defaultCreditCardId);
    setOnSuccessCallback(() => options?.onSuccess);
    setIsOpen(true);
  }, []);

  const closeNewTransaction = useCallback(() => {
    setIsOpen(false);
  }, []);

  const handleSuccess = useCallback(() => {
    if (onSuccessCallback) {
      onSuccessCallback();
    }
  }, [onSuccessCallback]);

  return (
    <TransactionModalContext.Provider
      value={{ openNewTransaction, closeNewTransaction, isOpen }}
    >
      {children}
      <NewTransactionModal
        isOpen={isOpen}
        onClose={closeNewTransaction}
        defaultType={defaultType}
        defaultAccountId={defaultAccountId}
        defaultCreditCardId={defaultCreditCardId}
        onSuccess={handleSuccess}
      />
    </TransactionModalContext.Provider>
  );
}

export function useTransactionModal() {
  const context = useContext(TransactionModalContext);
  if (!context) {
    throw new Error("useTransactionModal deve ser usado dentro de um TransactionModalProvider");
  }
  return context;
}
