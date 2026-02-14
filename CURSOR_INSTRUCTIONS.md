# Quick instructions for Cursor: Credit Card Spending Tracker

**Full spec:** See `APP_SPEC.md` in this repo. Below is a condensed checklist.

## What to build

1. **Credit card:** Limit 25,000 RON. All purchases use automatic installments by amount.
2. **Helper functions (implement exactly):**
   - `installmentNumber(amount)` → 3 if 100<amount≤300, 6 if 300<amount≤600, 9 if 600<amount≤1200, 12 if 1200<amount≤1800, 18 if 1800<amount≤2400, 24 if amount>2400, else 0.
   - `monthsPassedSince(date)` → full months between date and today (formula in APP_SPEC).
   - `lessThanZero(x)` → 0 if x≤0, else x.

3. **Storage:**
   - **db.json** — purchases: `id`, `name`, `amount`, `date`, `installments`, `monthlyPayment`. Add via API.
   - **Separate file (e.g. payments.json)** — actual payments per month (e.g. `{ "2023-04": 500 }` or array of `{ month, amount }`). Add via API.

4. **Table (one row per monthly payment):**
   - Col 1: Purchase name  
   - Col 2: Amount (RON)  
   - Col 3: Month & year of purchase  
   - Col 4: Amount paid (so far) for this purchase  
   - Col 5: Projected total payment for that row’s month (sum of all installments due that month)  
   - Col 6: Number of installments  
   - Col 7: Amount left to pay (use lessThanZero)  
   - Col 8: Months passed since purchase  
   - Col 9: Months left to pay (first payment = month after purchase)

5. **Forms:**
   - **Add purchase:** name + amount → save to db.json with today’s date (or chosen date), compute installments & monthlyPayment, add one row per installment to the table; update projected monthly payments for future months.
   - **Add actual payment:** month (YYYY-MM) + amount → save to payments file only. Use a simple allocation (e.g. oldest debt first) to fill column 4 and column 7.

6. **Rules:**
   - First payment is the month **after** the purchase month.
   - When adding a new purchase, add its monthly payment to the projected total for each month it has an installment due (so next month’s projection increases if the new purchase has an installment then).

7. **Tech:** React + Vite + TS frontend; small backend (e.g. Express) to read/write db.json and payments file. Optional: show 25,000 RON limit and total remaining debt.

For exact formulas, data shapes, and allocation details, follow **APP_SPEC.md**.
