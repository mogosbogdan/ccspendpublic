export function installmentNumber(amount: number): number {
  if (amount > 100 && amount <= 300) return 3;
  if (amount > 300 && amount <= 600) return 6;
  if (amount > 600 && amount <= 1200) return 9;
  if (amount > 1200 && amount <= 1800) return 12;
  if (amount > 1800 && amount <= 2400) return 18;
  if (amount > 2400) return 24;
  return 0;
}

export const LOCALE_RO = 'ro-RO';
export const TABLE_COLUMN_COUNT = 9;

export function monthsPassedSince(date: string | Date): number {
  const currentDate = new Date();
  const pastDate = new Date(date);
  const months =
    (currentDate.getFullYear() - pastDate.getFullYear()) * 12 -
    pastDate.getMonth() +
    currentDate.getMonth();
  return months <= 0 ? 0 : months;
}

export function lessThanZero(param: number): number {
  return param <= 0 ? 0 : param;
}

/** Treat tiny remainders from old rounding as paid off. Below this, amount left is shown as 0. */
const PAID_OFF_EPSILON = 0.05;

/** Amount left to display: rounds to 0 when below PAID_OFF_EPSILON (e.g. 0.03 from old 2-decimal rounding). */
export function amountLeftForDisplay(amountLeft: number): number {
  if (amountLeft <= 0) return 0;
  return amountLeft < PAID_OFF_EPSILON ? 0 : amountLeft;
}

/** First payment month = month after purchase. Returns YYYY-MM */
export function firstPaymentMonth(purchaseDate: string): string {
  const d = new Date(purchaseDate + 'T12:00:00');
  d.setMonth(d.getMonth() + 1);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

/** Format date string (YYYY-MM-DD) to "Month YYYY" */
export function formatMonthYear(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  return `${months[d.getMonth()]} ${d.getFullYear()}`;
}

/** Get YYYY-MM for a date */
export function toMonthKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

/** Convert YYYY-MM to sortable month index. */
export function monthToIndex(monthKey: string): number {
  const [year, month] = monthKey.split('-').map(Number);
  return year * 12 + month;
}

/** Format amount in RON using Romanian locale. */
export function formatRon(amount: number): string {
  return amount.toLocaleString(LOCALE_RO);
}

/** Default payment date input value: first day of current month (YYYY-MM-01). */
export function defaultPaymentDateValue(): string {
  return `${toMonthKey(new Date())}-01`;
}

/** Shared unknown-error to message mapping. */
export function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

/** Purchase month as YYYY-MM from date string (YYYY-MM-DD) */
export function purchaseMonth(dateStr: string): string {
  return dateStr.slice(0, 7);
}

/** Add n months to YYYY-MM, return YYYY-MM */
export function addMonths(monthKey: string, n: number): string {
  const [y, m] = monthKey.split('-').map(Number);
  const d = new Date(y, m - 1 + n, 1);
  const yy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${yy}-${mm}`;
}

/** Round to 2 decimals */
export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
