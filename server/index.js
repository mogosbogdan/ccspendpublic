import express from 'express';
import cors from 'cors';
import { readFile, writeFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { randomUUID } from 'crypto';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CONFIG = {
  port: 3001,
  dataDir: join(__dirname, 'data'),
  dbPath: join(__dirname, 'data', 'db.json'),
  paymentsPath: join(__dirname, 'data', 'payments.json'),
};
const app = express();
app.use(cors());
app.use(express.json());

function round2(value) {
  return Math.round(value * 100) / 100;
}

function installmentNumber(amount) {
  if (amount > 100 && amount <= 300) return 3;
  if (amount > 300 && amount <= 600) return 6;
  if (amount > 600 && amount <= 1200) return 9;
  if (amount > 1200 && amount <= 1800) return 12;
  if (amount > 1800 && amount <= 2400) return 18;
  if (amount > 2400) return 24;
  return 0;
}

async function ensureDataDir() {
  await mkdir(CONFIG.dataDir, { recursive: true });
}

async function readPurchases() {
  await ensureDataDir();
  try {
    const raw = await readFile(CONFIG.dbPath, 'utf-8');
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : (data.purchases ?? []);
  } catch {
    return [];
  }
}

async function writePurchases(purchases) {
  await ensureDataDir();
  await writeFile(CONFIG.dbPath, JSON.stringify(purchases, null, 2), 'utf-8');
}

async function readPayments() {
  await ensureDataDir();
  try {
    const raw = await readFile(CONFIG.paymentsPath, 'utf-8');
    const data = JSON.parse(raw);
    return data && typeof data === 'object' ? data : {};
  } catch {
    return {};
  }
}

async function writePayments(payments) {
  await ensureDataDir();
  await writeFile(CONFIG.paymentsPath, JSON.stringify(payments, null, 2), 'utf-8');
}

function sendServerError(res, error) {
  res.status(500).json({ error: String(error.message) });
}

app.get('/api/purchases', async (_req, res) => {
  try {
    const purchases = await readPurchases();
    res.json(purchases);
  } catch (e) {
    sendServerError(res, e);
  }
});

app.post('/api/purchases', async (req, res) => {
  try {
    const { name, amount, date } = req.body;
    const purchaseDate = date ? new Date(date).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10);
    const numAmount = Number(amount);
    if (!name || numAmount <= 0) {
      return res.status(400).json({ error: 'name and positive amount required' });
    }
    const installments = installmentNumber(numAmount);
    const monthlyPayment = installments > 0 ? round2(numAmount / installments) : 0;
    const purchase = {
      id: randomUUID(),
      name: String(name).trim(),
      amount: numAmount,
      date: purchaseDate,
      installments,
      monthlyPayment,
    };
    const purchases = await readPurchases();
    purchases.push(purchase);
    await writePurchases(purchases);
    res.status(201).json(purchase);
  } catch (e) {
    sendServerError(res, e);
  }
});

app.get('/api/payments', async (_req, res) => {
  try {
    const payments = await readPayments();
    res.json(payments);
  } catch (e) {
    sendServerError(res, e);
  }
});

app.post('/api/payments', async (req, res) => {
  try {
    const { month, amount } = req.body;
    const numAmount = Number(amount);
    if (!month || typeof month !== 'string' || numAmount < 0) {
      return res.status(400).json({ error: 'month (YYYY-MM) and non-negative amount required' });
    }
    const payments = await readPayments();
    const existing = Number(payments[month]) || 0;
    payments[month] = round2(existing + numAmount);
    await writePayments(payments);
    res.json(payments);
  } catch (e) {
    sendServerError(res, e);
  }
});

app.put('/api/payments/:month', async (req, res) => {
  try {
    const { month } = req.params;
    const amount = Number(req.body?.amount);
    if (!month || (amount !== 0 && !Number.isFinite(amount))) {
      return res.status(400).json({ error: 'month and amount required' });
    }
    const payments = await readPayments();
    payments[month] = round2(Math.max(0, amount));
    await writePayments(payments);
    res.json(payments);
  } catch (e) {
    sendServerError(res, e);
  }
});

app.listen(CONFIG.port, () => {
  console.log(`Server running at http://localhost:${CONFIG.port}`);
});
