import type { Purchase, PaymentsByMonth } from './types';

const base = '/api';

export async function fetchPurchases(): Promise<Purchase[]> {
  const res = await fetch(`${base}/purchases`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function addPurchase(params: {
  name: string;
  amount: number;
  date?: string;
}): Promise<Purchase> {
  const res = await fetch(`${base}/purchases`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'Failed to add purchase');
  }
  return res.json();
}

export async function fetchPayments(): Promise<PaymentsByMonth> {
  const res = await fetch(`${base}/payments`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function addPayment(month: string, amount: number): Promise<PaymentsByMonth> {
  const res = await fetch(`${base}/payments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ month, amount }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'Failed to add payment');
  }
  return res.json();
}
