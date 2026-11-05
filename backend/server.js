require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cron = require('node-cron');
const db = require('./db/database');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/exchange', require('./routes/exchange'));
app.use('/api/wallet', require('./routes/wallet'));

app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date() }));

// Simulate rate fluctuations every hour
cron.schedule('0 * * * *', () => {
  console.log('Updating exchange rates...');
  const rates = db.prepare('SELECT id, rate FROM exchange_rates').all();
  const update = db.prepare('UPDATE exchange_rates SET rate = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
  const updateAll = db.transaction(() => {
    for (const r of rates) {
      const fluctuation = 1 + (Math.random() * 0.02 - 0.01); // ±1%
      update.run(r.rate * fluctuation, r.id);
    }
  });
  updateAll();
  console.log('Exchange rates updated.');
});

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`📦 Database: ${process.env.DB_PATH || './db/currency_exchange.db'}`);
});
