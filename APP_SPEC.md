# Credit Card Spending Tracker — App Specification

Use this document as the single source of truth when building the app from scratch. The app replicates and improves upon a Google Sheets workflow for tracking credit card spending with automatic installment plans.

---

## 1. Overview

- **Credit card limit:** 25,000 RON
- **Currency:** RON (Romanian Leu)
- **Rule:** Every purchase is automatically split into installments based on its amount (see Section 2).
- **First payment month:** The month *after* the purchase (e.g. purchase in March 2023 → first payment in April 2023).

---

## 2. Business Logic (Helper Functions)

Implement these exactly. They drive installment count and derived columns.

### 2.1 Installment count by amount

```js
function installmentNumber(amount) {
  if (amount > 100 && amount <= 300) return 3;
  if (amount > 300 && amount <= 600) return 6;
  if (amount > 600 && amount <= 1200) return 9;
  if (amount > 1200 && amount <= 1800) return 12;
  if (amount > 1800 && amount <= 2400) return 18;
  if (amount > 2400) return 24;
  return 0;
}
```

- Amounts ≤ 100 RON → 0 installments (no installment plan).
- Use the same boundaries and return values in the app (TypeScript/JavaScript).

### 2.2 Months passed since a date

```js
function monthsPassedSince(date) {
  var currentDate = new Date();
  var pastDate = new Date(date);
  var months = (currentDate.getFullYear() - pastDate.getFullYear()) * 12;
  months -= pastDate.getMonth();
  months += currentDate.getMonth();
  return months <= 0 ? 0 : months;
}
```

- `date` is the purchase date. Use the same formula in the app.

### 2.3 Clamp to non‑negative

```js
function lessThanZero(param) {
  return param <= 0 ? 0 : param;
}
```

- Use wherever a value must not be shown as negative (e.g. remaining amount, months left).

---

## 3. Data Storage

- **Purchases:** persisted in **`db.json`** (or equivalent path you choose).
- **Actual payments (what the user paid in a given month):** persisted in a **separate file** (e.g. **`payments.json`**), not in `db.json`.

Both files should be read/written by the backend. Define a simple API (e.g. REST) so the frontend can:
- List and add purchases.
- List and add/update actual payments per month.

---

## 4. Purchase Data Model (`db.json`)

Each purchase record should include at least:

| Field            | Type     | Description |
|------------------|----------|-------------|
| `id`             | string   | Unique ID (e.g. UUID). |
| `name`           | string   | Name/description of the purchase. |
| `amount`         | number   | Total amount in RON. |
| `date`           | string   | Date of purchase (ISO date or YYYY-MM-DD). |
| `installments`   | number   | Result of `installmentNumber(amount)`. |
| `monthlyPayment` | number   | `amount / installments` (only when installments > 0). |

- **Computed (not stored):** “months passed”, “months left”, “amount left to pay” — derive these in the app using `monthsPassedSince(purchase.date)` and installment logic.

---

## 5. Actual Payments Data Model (`payments.json`)

Represents “what I actually paid in a given month”.

- **Key:** month identifier (e.g. `"YYYY-MM"` such as `"2023-04"`).
- **Value:** amount paid in that month (number, RON).

Structure can be:

- An array of `{ month: "YYYY-MM", amount: number }`, or  
- An object `{ "2023-04": 500, "2023-05": 600 }`.

Choose one and use it consistently for read/write.

---

## 6. Main Table (Columns)

The main view is a table. Columns match your Google Sheets layout. First row can be a header row (no data).

| # | Column name (suggested)     | Source / formula |
|---|-----------------------------|-------------------|
| 1 | Purchase name               | `purchase.name` |
| 2 | Amount                      | `purchase.amount` (RON) |
| 3 | Month and year              | Purchase date formatted (e.g. “March 2023”) |
| 4 | Amount paid (so far)        | From payment history: sum of actual payments applied to this purchase (see Section 7). |
| 5 | Projected monthly payment   | For each *month* (not per purchase): sum of all `monthlyPayment` of purchases that have an installment due that month. |
| 6 | Number of installments     | `purchase.installments` |
| 7 | Amount left to pay         | `lessThanZero(purchase.amount - amountPaidForThisPurchase)`. |
| 8 | Months passed since        | `monthsPassedSince(purchase.date)` |
| 9 | Months left to pay         | `lessThanZero(installments - monthsPassedSinceFirstPayment)`. First payment is the month after purchase. |

- **Row semantics:** One row per purchase (or, if you prefer “one row per monthly payment” for a purchase, then the table has multiple rows per purchase — see Section 8). The spec above is “one row per purchase”; Section 8 clarifies the alternative.

---

## 7. Projected Monthly Payment (Column 5)

- For a given **month** (e.g. April 2023), the **projected monthly payment** is the sum of:
  - For each purchase: if that month is within the installment window (from first payment month to last payment month), add that purchase’s `monthlyPayment`.
- **First payment month** for a purchase = month after purchase date.  
  **Last payment month** = first payment month + (installments - 1).
- When the user **adds a new purchase**, recalculate so that the month that follows the purchase date gets the new `monthlyPayment` added to whatever was already projected for that month. So “when I add a new purchase, the projected amount for the following month is updated to include the new installment.”

---

## 8. Rows: One per Purchase vs One per Monthly Payment

- **Option A — One row per purchase:**  
  Table has one row per purchase. Columns 4–9 are computed for that purchase. Column 5 (projected monthly payment) is a bit ambiguous per row; you can show either the *monthly* projection for the month that row’s next payment is due, or leave column 5 to be a “month-based” view (e.g. in a separate section or summary).

- **Option B — One row per monthly payment:**  
  When you add a purchase, create one row for each installment (e.g. 24 rows for a 24‑installment purchase). Each row has: purchase name, amount, purchase month/year, amount paid (for that installment or running), projected total for that month, number of installments, amount left for that purchase, months passed, months left. This matches “a new row for each monthly payment in the table.”

**Instruction:** Prefer **Option B** — when the user adds a purchase, create **one row per monthly payment** (one row per installment) in the table. So a 24‑installment purchase generates 24 rows, each tied to a specific month. That way “projected monthly payment” per row can be the total projected for that row’s month.

---

## 9. Allocating “Amount paid” to Purchases (Column 4)

- User records “what I paid in month X” in the second file (`payments.json`).
- You need a rule to allocate that payment to purchases. Simple approach: assume payments are applied in chronological order of **first payment due** (oldest purchase first), or by purchase date. For each month, apply the paid amount to the oldest purchase that still has remaining debt until that amount is used, then move to the next purchase.  
- **Simpler alternative:** Don’t allocate per purchase; show “amount paid” only per month in a separate summary, and in the table show “amount paid” per purchase as the sum of payments that were *allocated* to that purchase using the rule above. If you want to keep the table like the sheet, implement the allocation so column 4 per row is well-defined.

---

## 10. UI Requirements

### 10.1 Add purchase

- **Inputs:**  
  - Purchase name (text).  
  - Amount (number, RON).
- **Behavior:**  
  - On submit, save to `db.json` with current date as purchase date (or allow picking date; if not specified, use “today”).  
  - Compute and store `installments` and `monthlyPayment`.  
  - Table updates: add as many rows as there are installments (one per monthly payment), and projected monthly payments for future months update to include the new installments.

### 10.2 Add actual payment

- **Inputs:**  
  - Month (e.g. month + year selector or “YYYY-MM”).  
  - Amount paid (number, RON).
- **Behavior:**  
  - Save/update this in the **payments file** (e.g. `payments.json`), not in `db.json`.  
  - Recompute “amount paid” per purchase (column 4) and “amount left” (column 7) using the allocation rule.

### 10.3 Table

- Show all columns from Section 6.
- First row can be a header.  
- Rows: one per monthly payment (Option B in Section 8).  
- Sort/filter as needed (e.g. by month, by purchase).

### 10.4 Optional

- Show credit card limit (25,000 RON) and current total used or remaining (sum of “amount left to pay” across purchases).

---

## 11. Technical Suggestions

- **Stack:** Use the existing React + Vite + TypeScript setup. Add a small backend (e.g. Express) that:
  - Serves the frontend (or run frontend via Vite and backend on another port).
  - Exposes API routes to read/write `db.json` and the payments file.
- **IDs:** Generate a unique `id` for each purchase (e.g. UUID or nanoid).
- **Dates:** Store dates as ISO (YYYY-MM-DD) and use the same for “month” (YYYY-MM) for payments.
- **Rounding:** For `monthlyPayment` and displayed amounts, decide rounding (e.g. 2 decimals) and use consistently.

---

## 12. Summary Checklist for Cursor

- [ ] Implement `installmentNumber`, `monthsPassedSince`, `lessThanZero` and use them everywhere relevant.
- [ ] Persist purchases in `db.json` (with id, name, amount, date, installments, monthlyPayment).
- [ ] Persist actual payments in a separate file (e.g. `payments.json`) keyed by month.
- [ ] Backend API to read/write both files.
- [ ] Add-purchase form: name + amount (and optionally date); save to db; create one row per installment in the table.
- [ ] Add-payment form: month + amount; save to payments file.
- [ ] Main table: columns 1–9, one row per monthly payment; column 5 = projected total for that month; column 4/7 use allocation of actual payments.
- [ ] When a new purchase is added, update projected monthly payments for future months (add new installments to existing projections).
- [ ] First payment month = month after purchase date; last = first + (installments - 1).
- [ ] Optional: show limit (25,000 RON) and total remaining debt.

Use this spec as the single reference when implementing or refactoring the app.
