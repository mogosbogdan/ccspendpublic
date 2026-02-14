import type { Purchase, PaymentsByMonth } from './types';

const base = '/api';

async function getErrorFromResponse(
  res: Response,
  fallback: string
): Promise<never> {
  const parsed = await res
    .json()
    .catch((): { error?: string } => ({ error: res.statusText }));
  throw new Error(parsed.error || fallback);
}

async function parseJsonOrThrow<T>(
  res: Response,
  fallback: string
): Promise<T> {
  if (!res.ok) {
    return getErrorFromResponse(res, fallback);
  }
  return res.json() as Promise<T>;
}

export async function fetchPurchases(): Promise<Purchase[]> {
  const res = await fetch(`${base}/purchases`);
  return parseJsonOrThrow<Purchase[]>(res, 'Failed to fetch purchases');
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
  return parseJsonOrThrow<Purchase>(res, 'Failed to add purchase');
}

export async function fetchPayments(): Promise<PaymentsByMonth> {
  const res = await fetch(`${base}/payments`);
  return parseJsonOrThrow<PaymentsByMonth>(res, 'Failed to fetch payments');
}

export async function addPayment(month: string, amount: number): Promise<PaymentsByMonth> {
  const res = await fetch(`${base}/payments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ month, amount }),
  });
  return parseJsonOrThrow<PaymentsByMonth>(res, 'Failed to add payment');
}
