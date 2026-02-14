export interface Purchase {
  id: string;
  name: string;
  amount: number;
  date: string;
  installments: number;
  monthlyPayment: number;
}

/** payments[month] = amount paid in that month (RON) */
export type PaymentsByMonth = Record<string, number>;

export interface TableRow {
  purchaseId: string;
  /** Shown only on first row (purchase month) */
  purchaseName: string;
  /** Shown only on first row */
  amount: number;
  /** Month and year this row represents: purchase month for row 0, then April, May, ... */
  monthYear: string;
  /** Amount paid in this row's month toward this purchase (from add payment for that month) */
  amountPaidThisMonth: number;
  projectedMonthlyPayment: number;
  /** Shown only on first row */
  installments: number;
  /** Shown only on first row */
  amountLeft: number;
  /** Shown only on first row */
  monthsPassed: number;
  /** Shown only on first row */
  monthsLeft: number;
  /** YYYY-MM for this row's month (for sorting) */
  rowMonth: string;
  /** True only for the row in the purchase month (show name, amount, installments, amount left, months passed/left) */
  isFirstRow: boolean;
  /** Purchase date (for sorting multiple purchases in same month) */
  purchaseDate: string;
}
