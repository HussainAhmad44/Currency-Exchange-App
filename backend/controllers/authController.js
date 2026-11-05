const db = require('../db/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

const JWT_SECRET = process.env.JWT_SECRET || 'secret';
const DEFAULT_CURRENCIES = ['USD', 'EUR', 'GBP'];

exports.register = (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password)
    return res.status(400).json({ error: 'All fields required' });

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) return res.status(409).json({ error: 'Email already registered' });

  const hashed = bcrypt.hashSync(password, 10);
  const userId = uuidv4();

  db.prepare('INSERT INTO users (id, name, email, password) VALUES (?, ?, ?, ?)').run(userId, name, email, hashed);

  // Create default wallets
  const insertWallet = db.prepare('INSERT OR IGNORE INTO wallets (id, user_id, currency, balance) VALUES (?, ?, ?, ?)');
  for (const cur of DEFAULT_CURRENCIES) {
    insertWallet.run(uuidv4(), userId, cur, 0);
  }
  // Give 1000 USD welcome bonus
  db.prepare('UPDATE wallets SET balance = 1000 WHERE user_id = ? AND currency = ?').run(userId, 'USD');

  const token = jwt.sign({ id: userId, email, name }, JWT_SECRET, { expiresIn: '7d' });
  res.status(201).json({ token, user: { id: userId, name, email } });
};

exports.login = (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: 'Email and password required' });

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user || !bcrypt.compareSync(password, user.password))
    return res.status(401).json({ error: 'Invalid credentials' });

  const token = jwt.sign({ id: user.id, email: user.email, name: user.name }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
};

exports.me = (req, res) => {
  const user = db.prepare('SELECT id, name, email, created_at FROM users WHERE id = ?').get(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
};
