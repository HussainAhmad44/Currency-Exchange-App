const db = require('../db/database');
const { v4: uuidv4 } = require('uuid');

const FEE_RATE = 0.005; // 0.5% fee

exports.getRates = (req, res) => {
  const { base = 'USD' } = req.query;
  const rates = db.prepare(`
    SELECT target_currency as currency, rate, updated_at
    FROM exchange_rates WHERE base_currency = ?
    ORDER BY target_currency
  `).all(base.toUpperCase());
  res.json({ base: base.toUpperCase(), rates });
};

exports.getRate = (req, res) => {
  const { from, to } = req.params;
  const rate = db.prepare(`
    SELECT rate, updated_at FROM exchange_rates
    WHERE base_currency = ? AND target_currency = ?
  `).get(from.toUpperCase(), to.toUpperCase());
  if (!rate) return res.status(404).json({ error: 'Rate not found' });
  res.json({ from: from.toUpperCase(), to: to.toUpperCase(), ...rate });
};

exports.getCurrencies = (req, res) => {
  const currencies = db.prepare(`
    SELECT DISTINCT base_currency as code FROM exchange_rates ORDER BY base_currency
  `).all();
  const list = [{ code: 'USD' }, ...currencies.filter(c => c.code !== 'USD')];
  res.json(list);
};

exports.convert = (req, res) => {
  const { from, to, amount } = req.body;
  if (!from || !to || !amount || isNaN(amount) || Number(amount) <= 0)
    return res.status(400).json({ error: 'Invalid parameters' });

  if (from.toUpperCase() === to.toUpperCase()) {
    return res.json({ from, to, amount: Number(amount), converted: Number(amount), rate: 1, fee: 0 });
  }

  const rateRow = db.prepare(`
    SELECT rate FROM exchange_rates WHERE base_currency = ? AND target_currency = ?
  `).get(from.toUpperCase(), to.toUpperCase());

  if (!rateRow) return res.status(404).json({ error: 'Rate not found' });

  const fee = Number(amount) * FEE_RATE;
  const converted = (Number(amount) - fee) * rateRow.rate;

  res.json({
    from: from.toUpperCase(),
    to: to.toUpperCase(),
    amount: Number(amount),
    converted: Math.round(converted * 10000) / 10000,
    rate: rateRow.rate,
    fee: Math.round(fee * 10000) / 10000
  });
};

exports.executeExchange = (req, res) => {
  const { from, to, amount } = req.body;
  const userId = req.user.id;

  if (!from || !to || !amount || isNaN(amount) || Number(amount) <= 0)
    return res.status(400).json({ error: 'Invalid parameters' });

  const rateRow = db.prepare(`
    SELECT rate FROM exchange_rates WHERE base_currency = ? AND target_currency = ?
  `).get(from.toUpperCase(), to.toUpperCase());

  if (!rateRow) return res.status(404).json({ error: 'Rate not found' });

  const fromWallet = db.prepare('SELECT * FROM wallets WHERE user_id = ? AND currency = ?').get(userId, from.toUpperCase());
  if (!fromWallet || fromWallet.balance < Number(amount))
    return res.status(400).json({ error: 'Insufficient balance' });

  const fee = Number(amount) * FEE_RATE;
  const converted = (Number(amount) - fee) * rateRow.rate;

  let txId;
  db.exec('BEGIN');
  try {
    db.prepare('UPDATE wallets SET balance = balance - ? WHERE user_id = ? AND currency = ?')
      .run(Number(amount), userId, from.toUpperCase());

    const toWallet = db.prepare('SELECT id FROM wallets WHERE user_id = ? AND currency = ?').get(userId, to.toUpperCase());
    if (toWallet) {
      db.prepare('UPDATE wallets SET balance = balance + ? WHERE user_id = ? AND currency = ?')
        .run(converted, userId, to.toUpperCase());
    } else {
      db.prepare('INSERT INTO wallets (id, user_id, currency, balance) VALUES (?, ?, ?, ?)')
        .run(uuidv4(), userId, to.toUpperCase(), converted);
    }

    txId = uuidv4();
    db.prepare(`INSERT INTO transactions (id, user_id, from_currency, to_currency, from_amount, to_amount, rate, fee)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
      .run(txId, userId, from.toUpperCase(), to.toUpperCase(), Number(amount), converted, rateRow.rate, fee);

    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    return res.status(500).json({ error: 'Exchange failed', detail: err.message });
  }

  const updated = db.prepare('SELECT currency, balance FROM wallets WHERE user_id = ?').all(userId);
  res.json({ success: true, transactionId: txId, wallets: updated, converted, fee });
};
