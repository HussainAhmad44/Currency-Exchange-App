require('dotenv').config();
const db = require('./database');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');

const CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'INR', 'PKR', 'AED', 'SAR', 'MXN', 'BRL', 'KRW'];

const BASE_RATES_TO_USD = {
  USD: 1, EUR: 0.9215, GBP: 0.7892, JPY: 149.85, CAD: 1.3621,
  AUD: 1.5312, CHF: 0.8965, CNY: 7.2341, INR: 83.12, PKR: 278.5,
  AED: 3.6725, SAR: 3.7500, MXN: 17.15, BRL: 4.97, KRW: 1325.0
};

console.log('Seeding exchange rates...');
const insertRate = db.prepare(`
  INSERT OR REPLACE INTO exchange_rates (id, base_currency, target_currency, rate, updated_at)
  VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
`);

db.exec('BEGIN');
try {
  for (const base of CURRENCIES) {
    for (const target of CURRENCIES) {
      if (base !== target) {
        const rate = BASE_RATES_TO_USD[target] / BASE_RATES_TO_USD[base];
        insertRate.run(uuidv4(), base, target, rate);
      }
    }
  }
  db.exec('COMMIT');
} catch (err) {
  db.exec('ROLLBACK');
  console.error('Failed to seed rates:', err);
  process.exit(1);
}

console.log('Seeding demo user...');
const hashedPassword = bcrypt.hashSync('demo1234', 10);
const userId = uuidv4();

try {
  db.prepare(`INSERT OR IGNORE INTO users (id, name, email, password) VALUES (?, ?, ?, ?)`)
    .run(userId, 'Demo User', 'demo@example.com', hashedPassword);

  const user = db.prepare('SELECT id FROM users WHERE email = ?').get('demo@example.com');
  if (user) {
    const walletCurrencies = [
      { currency: 'USD', balance: 10000 },
      { currency: 'EUR', balance: 5000 },
      { currency: 'GBP', balance: 3000 },
      { currency: 'PKR', balance: 500000 },
    ];
    const insertWallet = db.prepare(`INSERT OR IGNORE INTO wallets (id, user_id, currency, balance) VALUES (?, ?, ?, ?)`);
    for (const w of walletCurrencies) {
      insertWallet.run(uuidv4(), user.id, w.currency, w.balance);
    }
  }
} catch (e) {
  console.log('Demo user already exists, skipping...');
}

console.log('✅ Seed complete!');
console.log('Demo credentials: demo@example.com / demo1234');
