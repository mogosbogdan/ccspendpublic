import type { FormEvent } from 'react';
import { FormField } from './FormField';

interface PurchaseFormProps {
  purchaseName: string;
  purchaseAmount: string;
  purchaseDate: string;
  onPurchaseNameChange: (value: string) => void;
  onPurchaseAmountChange: (value: string) => void;
  onPurchaseDateChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}

export function PurchaseForm({
  purchaseName,
  purchaseAmount,
  purchaseDate,
  onPurchaseNameChange,
  onPurchaseAmountChange,
  onPurchaseDateChange,
  onSubmit,
}: PurchaseFormProps) {
  return (
    <form onSubmit={onSubmit} className="form card">
      <h2>Add purchase</h2>
      <FormField
        label="Name"
        type="text"
        value={purchaseName}
        onChange={onPurchaseNameChange}
        placeholder="e.g. Laptop"
      />
      <FormField
        label="Amount (RON)"
        type="number"
        step="0.01"
        min="0"
        value={purchaseAmount}
        onChange={onPurchaseAmountChange}
        placeholder="e.g. 1500"
      />
      <FormField
        label="Date (optional, YYYY-MM-DD)"
        type="date"
        value={purchaseDate}
        onChange={onPurchaseDateChange}
      />
      <button type="submit">Add purchase</button>
    </form>
  );
}
