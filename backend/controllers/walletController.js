const db = require('../db/database');
const { v4: uuidv4 } = require('uuid');

exports.getWallets = (req, res) => {
  const wallets = db.prepare('SELECT currency, balance FROM wallets WHERE user_id = ? ORDER BY balance DESC').all(req.user.id);
  res.json(wallets);
};

exports.addWallet = (req, res) => {
  const { currency } = req.body;
  if (!currency) return res.status(400).json({ error: 'Currency required' });

  const existing = db.prepare('SELECT id FROM wallets WHERE user_id = ? AND currency = ?').get(req.user.id, currency.toUpperCase());
  if (existing) return res.status(409).json({ error: 'Wallet already exists' });

  const rate = db.prepare('SELECT rate FROM exchange_rates WHERE base_currency = ? LIMIT 1').get(currency.toUpperCase());
  if (!rate) return res.status(400).json({ error: 'Invalid currency' });

  db.prepare('INSERT INTO wallets (id, user_id, currency, balance) VALUES (?, ?, ?, 0)')
    .run(uuidv4(), req.user.id, currency.toUpperCase());
  res.status(201).json({ currency: currency.toUpperCase(), balance: 0 });
};

exports.getTransactions = (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const offset = (Number(page) - 1) * Number(limit);

  const total = db.prepare('SELECT COUNT(*) as count FROM transactions WHERE user_id = ?').get(req.user.id);
  const transactions = db.prepare(`
    SELECT * FROM transactions WHERE user_id = ?
    ORDER BY created_at DESC LIMIT ? OFFSET ?
  `).all(req.user.id, Number(limit), offset);

  res.json({ transactions, total: total.count, page: Number(page), limit: Number(limit) });
};

exports.deposit = (req, res) => {
  const { currency, amount } = req.body;
  if (!currency || !amount || isNaN(amount) || Number(amount) <= 0)
    return res.status(400).json({ error: 'Invalid parameters' });

  const wallet = db.prepare('SELECT id FROM wallets WHERE user_id = ? AND currency = ?').get(req.user.id, currency.toUpperCase());
  if (!wallet) return res.status(404).json({ error: 'Wallet not found' });

  db.prepare('UPDATE wallets SET balance = balance + ? WHERE user_id = ? AND currency = ?')
    .run(Number(amount), req.user.id, currency.toUpperCase());

  const updated = db.prepare('SELECT currency, balance FROM wallets WHERE user_id = ?').all(req.user.id);
  res.json({ success: true, wallets: updated });
};

exports.getWatchlist = (req, res) => {
  const list = db.prepare(`
    SELECT w.id, w.base_currency, w.target_currency, e.rate, e.updated_at
    FROM watchlist w
    JOIN exchange_rates e ON e.base_currency = w.base_currency AND e.target_currency = w.target_currency
    WHERE w.user_id = ?
  `).all(req.user.id);
  res.json(list);
};

exports.addToWatchlist = (req, res) => {
  const { base, target } = req.body;
  if (!base || !target) return res.status(400).json({ error: 'base and target required' });

  try {
    db.prepare('INSERT INTO watchlist (id, user_id, base_currency, target_currency) VALUES (?, ?, ?, ?)')
      .run(uuidv4(), req.user.id, base.toUpperCase(), target.toUpperCase());
    res.status(201).json({ success: true });
  } catch {
    res.status(409).json({ error: 'Already in watchlist' });
  }
};

exports.removeFromWatchlist = (req, res) => {
  db.prepare('DELETE FROM watchlist WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
  res.json({ success: true });
};
