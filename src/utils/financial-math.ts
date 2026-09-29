/**
 * Financial calculation engine ensuring exact cent distribution,
 * deterministic rounding, and preventing floating-point drift.
 */

export interface SplitItem {
  installmentNumber: number;
  amount: number;
  dueDate: string;
}

/**
 * Rounds a monetary number strictly to 2 decimal places using epsilon correction.
 */
export function roundCurrency(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/**
 * Splits an amount into N installments distributing residual pennies to the first installment.
 * Example: 1000.00 / 3 installments:
 * - Installment 1: 333.34
 * - Installment 2: 333.33
 * - Installment 3: 333.33
 * Total sum = 1000.00 exactly.
 */
export function calculateInstallmentSplit(
  totalAmount: number,
  totalInstallments: number,
  startDate: Date | string
): SplitItem[] {
  if (totalInstallments <= 0) {
    throw new Error("O número de parcelas deve ser maior que zero.");
  }
  if (totalAmount <= 0) {
    throw new Error("O valor total deve ser maior que zero.");
  }

  const roundedTotal = roundCurrency(totalAmount);
  const baseAmount = Math.floor((roundedTotal / totalInstallments) * 100) / 100;
  const remainder = roundCurrency(roundedTotal - baseAmount * totalInstallments);

  const start = typeof startDate === "string" ? new Date(startDate) : new Date(startDate);
  const items: SplitItem[] = [];

  for (let i = 1; i <= totalInstallments; i++) {
    // Add residual cents to the first installment
    const installmentAmount = i === 1 ? roundCurrency(baseAmount + remainder) : baseAmount;

    // Calculate due date (adding i - 1 months)
    const dueDate = new Date(start);
    dueDate.setMonth(dueDate.getMonth() + (i - 1));

    items.push({
      installmentNumber: i,
      amount: installmentAmount,
      dueDate: dueDate.toISOString().split("T")[0],
    });
  }

  return items;
}

/**
 * Validates that an array of installment items sums up exactly to the total amount.
 */
export function validateInstallmentSum(totalAmount: number, items: { amount: number }[]): boolean {
  const sum = items.reduce((acc, curr) => roundCurrency(acc + curr.amount), 0);
  return Math.abs(roundCurrency(totalAmount) - roundCurrency(sum)) < 0.001;
}

/**
 * Pure calculation of account realized balance.
 */
export function calculateAccountBalance(params: {
  initialBalance: number;
  confirmedIncomes: number;
  confirmedExpenses: number;
  confirmedInvoicePayments: number;
  confirmedTransfersIn: number;
  confirmedTransfersOut: number;
}): number {
  const {
    initialBalance,
    confirmedIncomes,
    confirmedExpenses,
    confirmedInvoicePayments,
    confirmedTransfersIn,
    confirmedTransfersOut,
  } = params;

  return roundCurrency(
    initialBalance +
      confirmedIncomes -
      confirmedExpenses -
      confirmedInvoicePayments +
      confirmedTransfersIn -
      confirmedTransfersOut
  );
}
