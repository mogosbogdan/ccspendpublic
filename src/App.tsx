import { useState, useEffect, useCallback, type FormEvent } from 'react';
import { fetchPurchases, addPurchase, fetchPayments, addPayment } from './api';
import type { Purchase, PaymentsByMonth } from './types';
import { buildTableRows, totalRemainingDebt } from './tableLogic';
import {
  lessThanZero,
  defaultPaymentDateValue,
  getErrorMessage,
} from './helpers';
import { ErrorBanner } from './components/ErrorBanner';
import { SummaryHeader } from './components/SummaryHeader';
import { PurchaseForm } from './components/PurchaseForm';
import { PaymentForm } from './components/PaymentForm';
import { InstallmentsTable } from './components/InstallmentsTable';
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
      setError(getErrorMessage(e, 'Failed to load data'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handlePurchaseNameChange = (value: string) => {
    setPurchaseName(value);
  };

  const handlePurchaseAmountChange = (value: string) => {
    setPurchaseAmount(value);
  };

  const handlePurchaseDateChange = (value: string) => {
    setPurchaseDate(value);
  };

  const handlePaymentMonthChange = (value: string) => {
    setPaymentMonth(value);
  };

  const handlePaymentAmountChange = (value: string) => {
    setPaymentAmount(value);
  };

  const handleAddPurchase = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
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
      setError(getErrorMessage(e, 'Failed to add purchase'));
    }
  };

  const defaultPaymentDate = defaultPaymentDateValue();

  const handleAddPayment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
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
      setError(getErrorMessage(e, 'Failed to add payment'));
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
      <SummaryHeader
        creditLimit={CREDIT_LIMIT}
        totalRemaining={totalRemaining}
        available={available}
      />

      <ErrorBanner message={error} />

      <section className="forms">
        <PurchaseForm
          purchaseName={purchaseName}
          purchaseAmount={purchaseAmount}
          purchaseDate={purchaseDate}
          onPurchaseNameChange={handlePurchaseNameChange}
          onPurchaseAmountChange={handlePurchaseAmountChange}
          onPurchaseDateChange={handlePurchaseDateChange}
          onSubmit={handleAddPurchase}
        />
        <PaymentForm
          paymentMonth={paymentMonth}
          paymentAmount={paymentAmount}
          defaultPaymentDate={defaultPaymentDate}
          onPaymentMonthChange={handlePaymentMonthChange}
          onPaymentAmountChange={handlePaymentAmountChange}
          onSubmit={handleAddPayment}
        />
      </section>

      <InstallmentsTable rows={rows} payments={payments} />
    </div>
  );
}

export default App;
