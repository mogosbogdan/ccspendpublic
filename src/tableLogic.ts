import type { Purchase, PaymentsByMonth, TableRow } from './types';
import {
  monthsPassedSince,
  lessThanZero,
  firstPaymentMonth,
  formatMonthYear,
  round2,
  purchaseMonth,
  addMonths,
} from './helpers';

/** Allocate payments to purchases (oldest first by first payment month). Returns amount paid per purchase id (total). */
export function allocatePaymentsToPurchases(
  purchases: Purchase[],
  payments: PaymentsByMonth
): Record<string, number> {
  const byMonth = allocatePaymentsToPurchasesByMonth(purchases, payments);
  const paid: Record<string, number> = {};
  for (const p of purchases) paid[p.id] = 0;
  for (const id of Object.keys(byMonth)) {
    for (const amount of Object.values(byMonth[id])) {
      paid[id] = round2((paid[id] ?? 0) + amount);
    }
  }
  return paid;
}

/** Allocate payments to purchases per month. Returns paidByPurchaseByMonth[purchaseId][month] = amount applied that month to that purchase. */
export function allocatePaymentsToPurchasesByMonth(
  purchases: Purchase[],
  payments: PaymentsByMonth
): Record<string, Record<string, number>> {
  const paidByPurchaseByMonth: Record<string, Record<string, number>> = {};
  for (const p of purchases) paidByPurchaseByMonth[p.id] = {};

  const sortedMonths = Object.keys(payments).sort();
  const purchasesByFirst = [...purchases].sort(
    (a, b) => firstPaymentMonth(a.date).localeCompare(firstPaymentMonth(b.date)) || a.date.localeCompare(b.date)
  );

  for (const month of sortedMonths) {
    let remaining = payments[month] ?? 0;
    if (remaining <= 0) continue;

    for (const p of purchasesByFirst) {
      if (remaining <= 0) break;
      const alreadyPaid = Object.values(paidByPurchaseByMonth[p.id] ?? {}).reduce((s, a) => s + a, 0);
      const debt = round2(p.amount - alreadyPaid);
      if (debt <= 0) continue;
      const apply = round2(Math.min(remaining, debt));
      if (apply > 0) {
        paidByPurchaseByMonth[p.id][month] = round2((paidByPurchaseByMonth[p.id][month] ?? 0) + apply);
        remaining = round2(remaining - apply);
      }
    }
  }
  return paidByPurchaseByMonth;
}

/** Projected total payment for a given month (sum of monthlyPayment for all purchases that have an installment due that month). */
export function projectedForMonth(month: string, purchases: Purchase[]): number {
  let total = 0;
  for (const p of purchases) {
    if (p.installments <= 0) continue;
    const first = firstPaymentMonth(p.date);
    const [fy, fm] = first.split('-').map(Number);
    const [my, mm] = month.split('-').map(Number);
    const firstIdx = fy * 12 + fm;
    const monthIdx = my * 12 + mm;
    const lastIdx = firstIdx + p.installments - 1;
    if (monthIdx >= firstIdx && monthIdx <= lastIdx) {
      total += p.monthlyPayment;
    }
  }
  return round2(total);
}

/**
 * Build table rows: one row per installment per purchase.
 * - First row of each purchase: in the purchase month; shows name, amount, month/year, amount paid, projected, installments, amount left, months passed, months left.
 * - Following rows: one per payment month (April, May, ...); column 3 = that month; only projected and month/year shown; name, amount, installments, amount left, months passed/left shown once (on first row).
 * - Multiple purchases in the same month appear in succession (sorted by purchase date).
 */
export function buildTableRows(
  purchases: Purchase[],
  payments: PaymentsByMonth
): TableRow[] {
  const amountPaidByPurchase = allocatePaymentsToPurchases(purchases, payments);
  const paidByPurchaseByMonth = allocatePaymentsToPurchasesByMonth(purchases, payments);
  const rows: TableRow[] = [];

  for (const p of purchases) {
    const paid = amountPaidByPurchase[p.id] ?? 0;
    const amountLeft = lessThanZero(round2(p.amount - paid));
    const monthsPassed = monthsPassedSince(p.date);
    const firstPay = firstPaymentMonth(p.date);
    const firstDate = new Date(firstPay + '-01T12:00:00');
    const now = new Date();
    const monthsSinceFirst = Math.max(
      0,
      (now.getFullYear() - firstDate.getFullYear()) * 12 +
        (now.getMonth() - firstDate.getMonth())
    );
    const monthsLeft = lessThanZero(p.installments - monthsSinceFirst);

    if (p.installments <= 0) {
      const rowMonth = purchaseMonth(p.date);
      rows.push({
        purchaseId: p.id,
        purchaseName: p.name,
        amount: p.amount,
        monthYear: formatMonthYear(p.date),
        amountPaidThisMonth: paidByPurchaseByMonth[p.id]?.[rowMonth] ?? 0,
        projectedMonthlyPayment: projectedForMonth(purchaseMonth(p.date), purchases),
        installments: 0,
        amountLeft,
        monthsPassed,
        monthsLeft,
        rowMonth,
        isFirstRow: true,
        purchaseDate: p.date,
      });
      continue;
    }

    const pMonth = purchaseMonth(p.date);
    /* Row 0 = purchase month; rows 1..installments = payment months (first payment next month, last = purchase month + installments) */
    for (let i = 0; i <= p.installments; i++) {
      const rowMonth = addMonths(pMonth, i);
      const isFirstRow = i === 0;
      const amountPaidThisMonth = paidByPurchaseByMonth[p.id]?.[rowMonth] ?? 0;
      rows.push({
        purchaseId: p.id,
        purchaseName: p.name,
        amount: p.amount,
        monthYear: formatMonthYear(rowMonth + '-01'),
        amountPaidThisMonth,
        projectedMonthlyPayment: projectedForMonth(rowMonth, purchases),
        installments: p.installments,
        amountLeft,
        monthsPassed,
        monthsLeft,
        rowMonth,
        isFirstRow,
        purchaseDate: p.date,
      });
    }
  }

  rows.sort(
    (a, b) =>
      a.rowMonth.localeCompare(b.rowMonth) ||
      a.purchaseDate.localeCompare(b.purchaseDate) ||
      a.purchaseId.localeCompare(b.purchaseId)
  );
  return rows;
}

/** Total remaining debt across all purchases (for summary). */
export function totalRemainingDebt(
  purchases: Purchase[],
  payments: PaymentsByMonth
): number {
  const paid = allocatePaymentsToPurchases(purchases, payments);
  let total = 0;
  for (const p of purchases) {
    total += lessThanZero(round2(p.amount - (paid[p.id] ?? 0)));
  }
  return round2(total);
}
