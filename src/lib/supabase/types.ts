export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type AccountType =
  | "CHECKING"
  | "SAVINGS"
  | "CASH"
  | "DIGITAL"
  | "INVESTMENT"
  | "OTHER";

export type CategoryType = "INCOME" | "EXPENSE";

export type TransactionType = "INCOME" | "EXPENSE" | "TRANSFER" | "INVOICE_PAYMENT";
export type TransactionStatus = "PENDING" | "CONFIRMED" | "CANCELLED";

export type CreditCardStatus = "ACTIVE" | "BLOCKED" | "CANCELLED" | "ARCHIVED";
export type InvoiceStatus = "OPEN" | "CLOSED" | "PAID" | "PARTIALLY_PAID" | "OVERDUE";

export type RecurrenceFrequency = "WEEKLY" | "MONTHLY" | "QUARTERLY" | "YEARLY";
export type RecurrenceStatus = "ACTIVE" | "PAUSED" | "CANCELLED" | "COMPLETED";

export type InstallmentStatus = "ACTIVE" | "COMPLETED" | "CANCELLED";
export type InstallmentItemStatus = "PENDING" | "CONFIRMED" | "CANCELLED";

export type TransferStatus = "PENDING" | "CONFIRMED" | "CANCELLED";

export type CommitmentType = "PAYABLE" | "RECEIVABLE";
export type CommitmentStatus = "PENDING" | "PAID" | "OVERDUE" | "CANCELLED";

export type AlertType =
  | "BILL_DUE"
  | "BUDGET_LIMIT"
  | "LOW_BALANCE"
  | "CARD_LIMIT"
  | "OVERDUE"
  | "UNUSUAL_SPENDING"
  | "FORECAST";

export type AlertSeverity = "INFO" | "WARNING" | "CRITICAL";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          currency: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          currency?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          currency?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey";
            columns: ["id"];
            isOneToOne: true;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      accounts: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          type: AccountType;
          institution: string | null;
          initial_balance: number;
          color: string | null;
          icon: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          type: AccountType;
          institution?: string | null;
          initial_balance?: number;
          color?: string | null;
          icon?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          type?: AccountType;
          institution?: string | null;
          initial_balance?: number;
          color?: string | null;
          icon?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "accounts_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      categories: {
        Row: {
          id: string;
          user_id: string;
          parent_id: string | null;
          name: string;
          type: CategoryType;
          color: string | null;
          icon: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          parent_id?: string | null;
          name: string;
          type: CategoryType;
          color?: string | null;
          icon?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          parent_id?: string | null;
          name?: string;
          type?: CategoryType;
          color?: string | null;
          icon?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "categories_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "categories_parent_id_fkey";
            columns: ["parent_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
        ];
      };
      credit_cards: {
        Row: {
          id: string;
          user_id: string;
          account_id: string | null;
          name: string;
          institution: string | null;
          last_four_digits: string | null;
          credit_limit: number;
          closing_day: number;
          due_day: number;
          color: string | null;
          status: CreditCardStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          account_id?: string | null;
          name: string;
          institution?: string | null;
          last_four_digits?: string | null;
          credit_limit: number;
          closing_day: number;
          due_day: number;
          color?: string | null;
          status?: CreditCardStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          account_id?: string | null;
          name?: string;
          institution?: string | null;
          last_four_digits?: string | null;
          credit_limit?: number;
          closing_day?: number;
          due_day?: number;
          color?: string | null;
          status?: CreditCardStatus;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "credit_cards_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "credit_cards_account_id_fkey";
            columns: ["account_id"];
            isOneToOne: false;
            referencedRelation: "accounts";
            referencedColumns: ["id"];
          },
        ];
      };
      credit_card_invoices: {
        Row: {
          id: string;
          user_id: string;
          credit_card_id: string;
          reference_month: string;
          closing_date: string;
          due_date: string;
          total_amount: number;
          paid_amount: number;
          status: InvoiceStatus;
          paid_at: string | null;
          payment_transaction_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          credit_card_id: string;
          reference_month: string;
          closing_date: string;
          due_date: string;
          total_amount?: number;
          paid_amount?: number;
          status?: InvoiceStatus;
          paid_at?: string | null;
          payment_transaction_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          credit_card_id?: string;
          reference_month?: string;
          closing_date?: string;
          due_date?: string;
          total_amount?: number;
          paid_amount?: number;
          status?: InvoiceStatus;
          paid_at?: string | null;
          payment_transaction_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "credit_card_invoices_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "credit_card_invoices_credit_card_id_fkey";
            columns: ["credit_card_id"];
            isOneToOne: false;
            referencedRelation: "credit_cards";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "fk_invoices_payment_transaction";
            columns: ["payment_transaction_id"];
            isOneToOne: false;
            referencedRelation: "transactions";
            referencedColumns: ["id"];
          },
        ];
      };
      recurrences: {
        Row: {
          id: string;
          user_id: string;
          category_id: string | null;
          account_id: string | null;
          credit_card_id: string | null;
          description: string;
          amount: number;
          type: CategoryType;
          frequency: RecurrenceFrequency;
          interval: number;
          start_date: string;
          end_date: string | null;
          next_occurrence: string;
          status: RecurrenceStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          category_id?: string | null;
          account_id?: string | null;
          credit_card_id?: string | null;
          description: string;
          amount: number;
          type: CategoryType;
          frequency: RecurrenceFrequency;
          interval?: number;
          start_date: string;
          end_date?: string | null;
          next_occurrence: string;
          status?: RecurrenceStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          category_id?: string | null;
          account_id?: string | null;
          credit_card_id?: string | null;
          description?: string;
          amount?: number;
          type?: CategoryType;
          frequency?: RecurrenceFrequency;
          interval?: number;
          start_date?: string;
          end_date?: string | null;
          next_occurrence?: string;
          status?: RecurrenceStatus;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "recurrences_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "recurrences_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "recurrences_account_id_fkey";
            columns: ["account_id"];
            isOneToOne: false;
            referencedRelation: "accounts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "recurrences_credit_card_id_fkey";
            columns: ["credit_card_id"];
            isOneToOne: false;
            referencedRelation: "credit_cards";
            referencedColumns: ["id"];
          },
        ];
      };
      installments: {
        Row: {
          id: string;
          user_id: string;
          category_id: string | null;
          account_id: string | null;
          credit_card_id: string | null;
          description: string;
          total_amount: number;
          total_installments: number;
          start_date: string;
          status: InstallmentStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          category_id?: string | null;
          account_id?: string | null;
          credit_card_id?: string | null;
          description: string;
          total_amount: number;
          total_installments: number;
          start_date: string;
          status?: InstallmentStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          category_id?: string | null;
          account_id?: string | null;
          credit_card_id?: string | null;
          description?: string;
          total_amount?: number;
          total_installments?: number;
          start_date?: string;
          status?: InstallmentStatus;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "installments_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "installments_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "installments_account_id_fkey";
            columns: ["account_id"];
            isOneToOne: false;
            referencedRelation: "accounts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "installments_credit_card_id_fkey";
            columns: ["credit_card_id"];
            isOneToOne: false;
            referencedRelation: "credit_cards";
            referencedColumns: ["id"];
          },
        ];
      };
      installment_items: {
        Row: {
          id: string;
          user_id: string;
          installment_id: string;
          installment_number: number;
          amount: number;
          due_date: string;
          status: InstallmentItemStatus;
          invoice_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          installment_id: string;
          installment_number: number;
          amount: number;
          due_date: string;
          status?: InstallmentItemStatus;
          invoice_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          installment_id?: string;
          installment_number?: number;
          amount?: number;
          due_date?: string;
          status?: InstallmentItemStatus;
          invoice_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "installment_items_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "installment_items_installment_id_fkey";
            columns: ["installment_id"];
            isOneToOne: false;
            referencedRelation: "installments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "installment_items_invoice_id_fkey";
            columns: ["invoice_id"];
            isOneToOne: false;
            referencedRelation: "credit_card_invoices";
            referencedColumns: ["id"];
          },
        ];
      };
      transfers: {
        Row: {
          id: string;
          user_id: string;
          source_account_id: string;
          destination_account_id: string;
          amount: number;
          date: string;
          description: string | null;
          status: TransferStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          source_account_id: string;
          destination_account_id: string;
          amount: number;
          date: string;
          description?: string | null;
          status?: TransferStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          source_account_id?: string;
          destination_account_id?: string;
          amount?: number;
          date?: string;
          description?: string | null;
          status?: TransferStatus;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "transfers_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "transfers_source_account_id_fkey";
            columns: ["source_account_id"];
            isOneToOne: false;
            referencedRelation: "accounts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "transfers_destination_account_id_fkey";
            columns: ["destination_account_id"];
            isOneToOne: false;
            referencedRelation: "accounts";
            referencedColumns: ["id"];
          },
        ];
      };
      transactions: {
        Row: {
          id: string;
          user_id: string;
          account_id: string | null;
          category_id: string | null;
          credit_card_id: string | null;
          invoice_id: string | null;
          transfer_id: string | null;
          installment_id: string | null;
          installment_item_id: string | null;
          recurrence_id: string | null;
          description: string;
          amount: number;
          date: string;
          type: TransactionType;
          status: TransactionStatus;
          payment_method: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          account_id?: string | null;
          category_id?: string | null;
          credit_card_id?: string | null;
          invoice_id?: string | null;
          transfer_id?: string | null;
          installment_id?: string | null;
          installment_item_id?: string | null;
          recurrence_id?: string | null;
          description: string;
          amount: number;
          date: string;
          type: TransactionType;
          status?: TransactionStatus;
          payment_method?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          account_id?: string | null;
          category_id?: string | null;
          credit_card_id?: string | null;
          invoice_id?: string | null;
          transfer_id?: string | null;
          installment_id?: string | null;
          installment_item_id?: string | null;
          recurrence_id?: string | null;
          description?: string;
          amount?: number;
          date?: string;
          type?: TransactionType;
          status?: TransactionStatus;
          payment_method?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "transactions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "transactions_account_id_fkey";
            columns: ["account_id"];
            isOneToOne: false;
            referencedRelation: "accounts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "transactions_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "transactions_credit_card_id_fkey";
            columns: ["credit_card_id"];
            isOneToOne: false;
            referencedRelation: "credit_cards";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "transactions_invoice_id_fkey";
            columns: ["invoice_id"];
            isOneToOne: false;
            referencedRelation: "credit_card_invoices";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "transactions_transfer_id_fkey";
            columns: ["transfer_id"];
            isOneToOne: false;
            referencedRelation: "transfers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "transactions_installment_id_fkey";
            columns: ["installment_id"];
            isOneToOne: false;
            referencedRelation: "installments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "transactions_installment_item_id_fkey";
            columns: ["installment_item_id"];
            isOneToOne: false;
            referencedRelation: "installment_items";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "transactions_recurrence_id_fkey";
            columns: ["recurrence_id"];
            isOneToOne: false;
            referencedRelation: "recurrences";
            referencedColumns: ["id"];
          },
        ];
      };
      financial_commitments: {
        Row: {
          id: string;
          user_id: string;
          category_id: string | null;
          account_id: string | null;
          credit_card_id: string | null;
          transaction_id: string | null;
          recurrence_id: string | null;
          installment_item_id: string | null;
          title: string;
          amount: number;
          due_date: string;
          type: CommitmentType;
          status: CommitmentStatus;
          paid_at: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          category_id?: string | null;
          account_id?: string | null;
          credit_card_id?: string | null;
          transaction_id?: string | null;
          recurrence_id?: string | null;
          installment_item_id?: string | null;
          title: string;
          amount: number;
          due_date: string;
          type: CommitmentType;
          status?: CommitmentStatus;
          paid_at?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          category_id?: string | null;
          account_id?: string | null;
          credit_card_id?: string | null;
          transaction_id?: string | null;
          recurrence_id?: string | null;
          installment_item_id?: string | null;
          title?: string;
          amount?: number;
          due_date?: string;
          type?: CommitmentType;
          status?: CommitmentStatus;
          paid_at?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "financial_commitments_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "financial_commitments_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "financial_commitments_account_id_fkey";
            columns: ["account_id"];
            isOneToOne: false;
            referencedRelation: "accounts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "financial_commitments_credit_card_id_fkey";
            columns: ["credit_card_id"];
            isOneToOne: false;
            referencedRelation: "credit_cards";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "financial_commitments_transaction_id_fkey";
            columns: ["transaction_id"];
            isOneToOne: false;
            referencedRelation: "transactions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "financial_commitments_recurrence_id_fkey";
            columns: ["recurrence_id"];
            isOneToOne: false;
            referencedRelation: "recurrences";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "financial_commitments_installment_item_id_fkey";
            columns: ["installment_item_id"];
            isOneToOne: false;
            referencedRelation: "installment_items";
            referencedColumns: ["id"];
          },
        ];
      };
      budgets: {
        Row: {
          id: string;
          user_id: string;
          category_id: string;
          amount: number;
          period_start: string;
          period_end: string;
          alert_threshold_percentage: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          category_id: string;
          amount: number;
          period_start: string;
          period_end: string;
          alert_threshold_percentage?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          category_id?: string;
          amount?: number;
          period_start?: string;
          period_end?: string;
          alert_threshold_percentage?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "budgets_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "budgets_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
        ];
      };
      alerts: {
        Row: {
          id: string;
          user_id: string;
          type: AlertType;
          severity: AlertSeverity;
          title: string;
          message: string;
          metadata: Json | null;
          is_read: boolean;
          read_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: AlertType;
          severity?: AlertSeverity;
          title: string;
          message: string;
          metadata?: Json | null;
          is_read?: boolean;
          read_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: AlertType;
          severity?: AlertSeverity;
          title?: string;
          message?: string;
          metadata?: Json | null;
          is_read?: boolean;
          read_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "alerts_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      get_account_realized_balance: {
        Args: { p_account_id: string };
        Returns: number;
      };
      get_user_net_worth: {
        Args: { p_user_id: string };
        Returns: number;
      };
      get_credit_card_used_limit: {
        Args: { p_card_id: string };
        Returns: number;
      };
    };
    Enums: {
      account_type: AccountType;
      category_type: CategoryType;
      transaction_type: TransactionType;
      transaction_status: TransactionStatus;
      credit_card_status: CreditCardStatus;
      invoice_status: InvoiceStatus;
      recurrence_frequency: RecurrenceFrequency;
      recurrence_status: RecurrenceStatus;
      installment_status: InstallmentStatus;
      installment_item_status: InstallmentItemStatus;
      transfer_status: TransferStatus;
      commitment_type: CommitmentType;
      commitment_status: CommitmentStatus;
      alert_type: AlertType;
      alert_severity: AlertSeverity;
    };
    CompositeTypes: Record<string, never>;
  };
}
