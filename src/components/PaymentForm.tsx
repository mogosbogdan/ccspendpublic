import type { FormEvent } from 'react';
import { FormField } from './FormField';

interface PaymentFormProps {
  paymentMonth: string;
  paymentAmount: string;
  defaultPaymentDate: string;
  onPaymentMonthChange: (value: string) => void;
  onPaymentAmountChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}

export function PaymentForm({
  paymentMonth,
  paymentAmount,
  defaultPaymentDate,
  onPaymentMonthChange,
  onPaymentAmountChange,
  onSubmit,
}: PaymentFormProps) {
  const paymentDateValue = paymentMonth || defaultPaymentDate;

  return (
    <form onSubmit={onSubmit} className="form card">
      <h2>Add actual payment</h2>
      <FormField
        label="Month"
        type="date"
        value={paymentDateValue}
        onChange={onPaymentMonthChange}
      />
      <FormField
        label="Amount paid (RON)"
        type="number"
        step="0.01"
        min="0"
        value={paymentAmount}
        onChange={onPaymentAmountChange}
        placeholder="e.g. 500"
      />
      <button type="submit">Add payment</button>
    </form>
  );
}
