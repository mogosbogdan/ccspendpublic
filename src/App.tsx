import { useState, useEffect, useCallback } from 'react';
import { fetchPurchases, addPurchase, fetchPayments, addPayment } from './api';
import type { Purchase, PaymentsByMonth } from './types';
import { buildTableRows, totalRemainingDebt } from './tableLogic';
import { lessThanZero } from './helpers';
import './App.css';

const CREDIT_LIMIT = 25_000;

function App() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [payments, setPayments] = useState<PaymentsByMonth>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [purchaseName, setPurchaseName] = useState('');
  const [purchaseAmount, setPurchaseAmount] = useState('');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [paymentMonth, setPaymentMonth] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');

  const load = useCallback(async () => {
    setError(null);
    try {
      const [p, pm] = await Promise.all([fetchPurchases(), fetchPayments()]);
      setPurchases(p);
      setPayments(pm);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleAddPurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = purchaseName.trim();
    const amount = parseFloat(purchaseAmount);
    if (!name || !Number.isFinite(amount) || amount <= 0) {
      setError('Enter a name and a positive amount.');
      return;
    }
    setError(null);
    try {
      const date = purchaseDate.trim() || undefined;
      const added = await addPurchase({ name, amount, date });
      setPurchases((prev) => [...prev, added]);
      setPurchaseName('');
      setPurchaseAmount('');
      setPurchaseDate('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to add purchase');
    }
  };

  const defaultPaymentDate = (() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
  })();

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    const raw = (paymentMonth || defaultPaymentDate).trim();
    const month = raw.slice(0, 7);
    const amount = parseFloat(paymentAmount);
    if (!/^\d{4}-\d{2}/.test(month)) {
      setError('Please select a date.');
      return;
    }
    if (!Number.isFinite(amount) || amount < 0) {
      setError('Enter a non-negative amount.');
      return;
    }
    setError(null);
    try {
      const updated = await addPayment(month, amount);
      setPayments(updated);
      setPaymentMonth('');
      setPaymentAmount('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to add payment');
    }
  };

  const rows = buildTableRows(purchases, payments);
  const totalRemaining = totalRemainingDebt(purchases, payments);
  const available = lessThanZero(CREDIT_LIMIT - totalRemaining);

  if (loading) {
    return (
      <div className="app">
        <p>Loading…</p>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="header">
        <h1>Credit Card Spending Tracker</h1>
        <div className="summary">
          <span>Limit: <strong>{CREDIT_LIMIT.toLocaleString('ro-RO')} RON</strong></span>
          <span>Remaining debt: <strong>{totalRemaining.toLocaleString('ro-RO')} RON</strong></span>
          <span>Available: <strong>{available.toLocaleString('ro-RO')} RON</strong></span>
        </div>
      </header>

      {error && (
        <div className="error" role="alert">
          {error}
        </div>
      )}

      <section className="forms">
        <form onSubmit={handleAddPurchase} className="form card">
          <h2>Add purchase</h2>
          <label>
            Name
            <input
              type="text"
              value={purchaseName}
              onChange={(e) => setPurchaseName(e.target.value)}
              placeholder="e.g. Laptop"
            />
          </label>
          <label>
            Amount (RON)
            <input
              type="number"
              step="0.01"
              min="0"
              value={purchaseAmount}
              onChange={(e) => setPurchaseAmount(e.target.value)}
              placeholder="e.g. 1500"
            />
          </label>
          <label>
            Date (optional, YYYY-MM-DD)
            <input
              type="date"
              value={purchaseDate}
              onChange={(e) => setPurchaseDate(e.target.value)}
            />
          </label>
          <button type="submit">Add purchase</button>
        </form>

        <form onSubmit={handleAddPayment} className="form card">
          <h2>Add actual payment</h2>
          <label>
            Month
            <input
              type="date"
              value={paymentMonth || defaultPaymentDate}
              onChange={(e) => setPaymentMonth(e.target.value)}
            />
          </label>
          <label>
            Amount paid (RON)
            <input
              type="number"
              step="0.01"
              min="0"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
              placeholder="e.g. 500"
            />
          </label>
          <button type="submit">Add payment</button>
        </form>
      </section>

      <section className="table-section">
        <h2>Installments table</h2>
        <div className="table-wrap">
          <table className="main-table">
            <thead>
              <tr>
                <th>Purchase name</th>
                <th>Amount (RON)</th>
                <th>Month and year</th>
                <th>Amount paid (RON)</th>
                <th>Projected monthly (RON)</th>
                <th>Installments</th>
                <th>Amount left (RON)</th>
                <th>Months passed</th>
                <th>Months left</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={9}>No purchases yet. Add a purchase above.</td>
                </tr>
              ) : (
                rows.map((row, i) => {
                  const isFirstRowInMonth = i === 0 || rows[i - 1].rowMonth !== row.rowMonth;
                  return (
                    <tr key={`${row.purchaseId}-${row.rowMonth}-${i}`}>
                      <td>{row.isFirstRow ? row.purchaseName : ''}</td>
                      <td className="num">{row.isFirstRow ? row.amount.toLocaleString('ro-RO') : ''}</td>
                      <td>{isFirstRowInMonth ? row.monthYear : ''}</td>
                      <td className="num">{(() => {
                        const totalPaidThisMonth = payments[row.rowMonth] ?? 0;
                        return isFirstRowInMonth && totalPaidThisMonth > 0 ? totalPaidThisMonth.toLocaleString('ro-RO') : '';
                      })()}</td>
                      <td className="num">{isFirstRowInMonth ? row.projectedMonthlyPayment.toLocaleString('ro-RO') : ''}</td>
                      <td className="num">{row.isFirstRow ? row.installments : ''}</td>
                      <td className="num">{row.isFirstRow ? row.amountLeft.toLocaleString('ro-RO') : ''}</td>
                      <td className="num">{row.isFirstRow ? row.monthsPassed : ''}</td>
                      <td className="num">{row.isFirstRow ? row.monthsLeft : ''}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export default App;
