import type { SubscriptionStatus } from "@/lib/supabase/types";

export type { SubscriptionStatus };

export type PlanCode = "FREE" | "PRO_MONTHLY" | "PRO_YEARLY";

export type BillingInterval = "FREE" | "MONTHLY" | "YEARLY";

export type AsaasBillingType = "BOLETO" | "CREDIT_CARD" | "PIX" | "UNDEFINED";

export type AsaasSubscriptionCycle = "MONTHLY" | "YEARLY";

export interface PlanFeature {
  text: string;
  included: boolean;
}

export interface PlanDefinition {
  code: PlanCode;
  name: string;
  description: string;
  price: number;
  currency: string;
  interval: BillingInterval;
  trialDays: number;
  features: string[];
  active: boolean;
  asaasPlanIdEnvVar?: string;
}

export interface Subscription {
  id: string;
  userId: string;
  asaasCustomerId: string | null;
  asaasSubscriptionId: string | null;
  plan: PlanCode | string;
  status: SubscriptionStatus;
  trialStartAt: string | null;
  trialEndAt: string | null;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SubscriptionAccessInfo {
  hasAccess: boolean;
  status: SubscriptionStatus;
  isTrial: boolean;
  daysRemainingInTrial?: number;
  plan: PlanCode | string;
  currentPeriodEnd?: string | null;
}

export interface AsaasSubscriptionPayload {
  customer: string;
  billingType: AsaasBillingType;
  value: number;
  nextDueDate: string;
  cycle: AsaasSubscriptionCycle;
  description: string;
  externalReference?: string;
}

export interface AsaasSubscriptionResponse {
  id: string;
  customer: string;
  billingType: AsaasBillingType;
  value: number;
  nextDueDate: string;
  cycle: AsaasSubscriptionCycle;
  description?: string;
  status: string;
  dateCreated?: string;
}

export interface CheckoutSubscriptionDTO {
  planCode: PlanCode;
  billingType?: AsaasBillingType;
}

export interface CheckoutResult {
  success: boolean;
  subscriptionId?: string;
  asaasSubscriptionId?: string;
  status?: SubscriptionStatus;
  plan?: PlanCode;
  paymentUrl?: string | null;
  error?: string;
}

export interface AsaasSubscriptionStatusMap {
  [key: string]: SubscriptionStatus;
}

export type AsaasWebhookEventType =
  | "PAYMENT_CREATED"
  | "PAYMENT_AWAITING_RISK_ANALYSIS"
  | "PAYMENT_APPROVED_BY_RISK_ANALYSIS"
  | "PAYMENT_REPROVED_BY_RISK_ANALYSIS"
  | "PAYMENT_UPDATED"
  | "PAYMENT_CONFIRMED"
  | "PAYMENT_RECEIVED"
  | "PAYMENT_ANTICIPATED"
  | "PAYMENT_OVERDUE"
  | "PAYMENT_DELETED"
  | "PAYMENT_RESTORED"
  | "PAYMENT_REFUNDED"
  | "PAYMENT_PARTIALLY_REFUNDED"
  | "PAYMENT_REFUND_IN_PROGRESS"
  | "PAYMENT_CHARGEBACK_REQUESTED"
  | "PAYMENT_CHARGEBACK_DISPUTE"
  | "PAYMENT_AWAITING_CHARGEBACK_REVERSAL"
  | "PAYMENT_DUNNING_RECEIVED"
  | "PAYMENT_DUNNING_REQUESTED"
  | "PAYMENT_BANK_SLIP_VIEWED"
  | "PAYMENT_CHECKOUT_VIEWED"
  | "SUBSCRIPTION_CREATED"
  | "SUBSCRIPTION_UPDATED"
  | "SUBSCRIPTION_DELETED"
  | "SUBSCRIPTION_INACTIVATED"
  | "SUBSCRIPTION_SPLIT_DISABLED"
  | "SUBSCRIPTION_SPLIT_DIVERGENCE_BLOCK"
  | "SUBSCRIPTION_SPLIT_DIVERGENCE_BLOCK_FINISHED";

export interface AsaasPaymentWebhookData {
  id: string;
  customer: string;
  subscription?: string | null;
  installment?: string | null;
  paymentLink?: string | null;
  dueDate?: string;
  originalDueDate?: string;
  value?: number;
  netValue?: number;
  billingType?: string;
  status?: string;
  confirmedDate?: string;
  clientPaymentDate?: string;
  externalReference?: string | null;
  deleted?: boolean;
}

export interface AsaasSubscriptionWebhookData {
  id: string;
  customer: string;
  status?: string;
  value?: number;
  cycle?: string;
  nextDueDate?: string;
  endDate?: string;
  externalReference?: string | null;
  description?: string;
}

export interface AsaasWebhookPayload {
  id?: string;
  event: AsaasWebhookEventType | string;
  dateCreated?: string;
  payment?: AsaasPaymentWebhookData;
  subscription?: AsaasSubscriptionWebhookData;
}

export interface WebhookProcessResult {
  success: boolean;
  duplicate?: boolean;
  eventId?: string;
  eventType?: string;
  userId?: string;
  subscriptionId?: string;
  newStatus?: SubscriptionStatus;
  message?: string;
  error?: string;
}

export interface BillingInvoice {
  id: string;
  status: string;
  value: number;
  dueDate: string;
  paymentDate: string | null;
  billingType: string;
  invoiceUrl: string | null;
  bankSlipUrl: string | null;
  transactionReceiptUrl: string | null;
}

export interface CancelSubscriptionResult {
  success: boolean;
  alreadyCancelled?: boolean;
  status?: SubscriptionStatus;
  cancelledAt?: string | null;
  accessUntil?: string | null;
  message?: string;
  error?: string;
}

export interface AsaasPaymentItem {
  id: string;
  customer?: string;
  subscription?: string | null;
  value: number;
  netValue?: number;
  dueDate: string;
  originalDueDate?: string;
  status: string;
  billingType: string;
  confirmedDate?: string | null;
  paymentDate?: string | null;
  clientPaymentDate?: string | null;
  invoiceUrl?: string | null;
  bankSlipUrl?: string | null;
  transactionReceiptUrl?: string | null;
  invoiceNumber?: string | null;
  deleted?: boolean;
}

export interface ReactivateSubscriptionResult {
  success: boolean;
  alreadyActive?: boolean;
  expired?: boolean;
  status?: SubscriptionStatus;
  currentPeriodEnd?: string | null;
  message?: string;
  error?: string;
}

export interface ChangePlanDTO {
  planCode: PlanCode;
}

export interface ChangePlanResult {
  success: boolean;
  alreadyCurrent?: boolean;
  previousPlan?: PlanCode | string;
  newPlan?: PlanCode;
  effectiveDate?: string | null;
  message?: string;
  error?: string;
}

export interface AsaasUpdateSubscriptionPayload {
  value?: number;
  nextDueDate?: string;
  cycle?: AsaasSubscriptionCycle;
  description?: string;
  billingType?: AsaasBillingType;
  updatePendingPayments?: boolean;
  status?: string;
}



