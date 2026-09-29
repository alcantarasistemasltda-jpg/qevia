import type {
  AccountType,
  CategoryType,
  TransactionType,
  TransactionStatus,
  CreditCardStatus,
  InvoiceStatus,
  RecurrenceFrequency,
  RecurrenceStatus,
  InstallmentStatus,
  InstallmentItemStatus,
  TransferStatus,
  CommitmentType,
  CommitmentStatus,
  AlertType,
  AlertSeverity,
  Database,
} from "@/lib/supabase/types";

// Re-export core enums
export type {
  AccountType,
  CategoryType,
  TransactionType,
  TransactionStatus,
  CreditCardStatus,
  InvoiceStatus,
  RecurrenceFrequency,
  RecurrenceStatus,
  InstallmentStatus,
  InstallmentItemStatus,
  TransferStatus,
  CommitmentType,
  CommitmentStatus,
  AlertType,
  AlertSeverity,
};

// Database Row Types
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Account = Database["public"]["Tables"]["accounts"]["Row"];
export type Category = Database["public"]["Tables"]["categories"]["Row"];
export type CreditCard = Database["public"]["Tables"]["credit_cards"]["Row"];
export type CreditCardInvoice = Database["public"]["Tables"]["credit_card_invoices"]["Row"];
export type Recurrence = Database["public"]["Tables"]["recurrences"]["Row"];
export type Installment = Database["public"]["Tables"]["installments"]["Row"];
export type InstallmentItem = Database["public"]["Tables"]["installment_items"]["Row"];
export type Transfer = Database["public"]["Tables"]["transfers"]["Row"];
export type Transaction = Database["public"]["Tables"]["transactions"]["Row"];
export type FinancialCommitment = Database["public"]["Tables"]["financial_commitments"]["Row"];
export type Budget = Database["public"]["Tables"]["budgets"]["Row"];
export type Alert = Database["public"]["Tables"]["alerts"]["Row"];

// DTOs for Insertions
export type CreateAccountDTO = Database["public"]["Tables"]["accounts"]["Insert"];
export type UpdateAccountDTO = Database["public"]["Tables"]["accounts"]["Update"];

export type CreateCategoryDTO = Database["public"]["Tables"]["categories"]["Insert"];
export type UpdateCategoryDTO = Database["public"]["Tables"]["categories"]["Update"];

export type CreateCreditCardDTO = Database["public"]["Tables"]["credit_cards"]["Insert"];
export type UpdateCreditCardDTO = Database["public"]["Tables"]["credit_cards"]["Update"];

export type CreateInvoiceDTO = Database["public"]["Tables"]["credit_card_invoices"]["Insert"];
export type UpdateInvoiceDTO = Database["public"]["Tables"]["credit_card_invoices"]["Update"];

export type CreateRecurrenceDTO = Database["public"]["Tables"]["recurrences"]["Insert"];
export type UpdateRecurrenceDTO = Database["public"]["Tables"]["recurrences"]["Update"];

export type CreateInstallmentDTO = Database["public"]["Tables"]["installments"]["Insert"] & {
  items?: Array<Omit<Database["public"]["Tables"]["installment_items"]["Insert"], "installment_id" | "user_id">>;
};

export type CreateTransferDTO = Database["public"]["Tables"]["transfers"]["Insert"];
export type UpdateTransferDTO = Database["public"]["Tables"]["transfers"]["Update"];

export type CreateTransactionDTO = Database["public"]["Tables"]["transactions"]["Insert"];
export type UpdateTransactionDTO = Database["public"]["Tables"]["transactions"]["Update"];

export type CreateCommitmentDTO = Database["public"]["Tables"]["financial_commitments"]["Insert"];
export type UpdateCommitmentDTO = Database["public"]["Tables"]["financial_commitments"]["Update"];

export type CreateBudgetDTO = Database["public"]["Tables"]["budgets"]["Insert"];
export type UpdateBudgetDTO = Database["public"]["Tables"]["budgets"]["Update"];

export type CreateAlertDTO = Database["public"]["Tables"]["alerts"]["Insert"];
export type UpdateAlertDTO = Database["public"]["Tables"]["alerts"]["Update"];

// Query Filters
export interface TransactionFilters {
  accountId?: string;
  categoryId?: string;
  creditCardId?: string;
  invoiceId?: string;
  startDate?: string;
  endDate?: string;
  type?: TransactionType;
  status?: TransactionStatus;
  limit?: number;
  offset?: number;
}

export interface CommitmentFilters {
  startDate?: string;
  endDate?: string;
  type?: CommitmentType;
  status?: CommitmentStatus;
}
