# FXSwap — Currency Exchange App

A full-stack currency exchange web application built with React + Node.js + SQLite.

## 🚀 Features

- **User Auth** — Register/Login with JWT sessions
- **Multi-Currency Wallets** — Hold balances in 15+ currencies
- **Live Exchange** — Convert currencies with real-time rates
- **Transaction History** — Full paginated history with fees
- **Live Rates Dashboard** — 15 currency pairs auto-refreshing every 30s
- **Watchlist** — Bookmark favorite currency pairs
- **Portfolio Chart** — Visual breakdown of your holdings
- **Mobile Responsive** — Works on all screen sizes

---

## 📦 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, React Router v6, React Query, Recharts, Framer Motion |
| Backend | Node.js, Express.js |
| Database | SQLite (via better-sqlite3) |
| Auth | JWT (jsonwebtoken) + bcryptjs |

---

## ⚙️ Setup Instructions

### 1. Install Backend Dependencies

```bash
cd backend
npm install
```

### 2. Seed the Database

```bash
npm run seed
```

This creates:
- Exchange rates for 15 currency pairs
- A demo user: `demo@example.com` / `demo1234`

### 3. Start the Backend

```bash
npm run dev      # Development (with nodemon auto-reload)
# OR
npm start        # Production
```

Backend runs at: `http://localhost:5000`

---

### 4. Install Frontend Dependencies

```bash
cd ../frontend
npm install
```

### 5. Start the Frontend

```bash
npm start
```

Frontend runs at: `http://localhost:3000`

> The frontend proxies API calls to `http://localhost:5000` automatically.

---

## 🔑 Demo Credentials

```
Email:    demo@example.com
Password: demo1234
```

New accounts get a **$1,000 USD welcome bonus** automatically.

---

## 📁 Project Structure

```
currency-exchange/
├── backend/
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── exchangeController.js
│   │   └── walletController.js
│   ├── db/
│   │   ├── database.js        # SQLite schema & connection
│   │   └── seed.js            # Initial data seeder
│   ├── middleware/
│   │   └── auth.js            # JWT verification middleware
│   ├── routes/
│   │   ├── auth.js
│   │   ├── exchange.js
│   │   └── wallet.js
│   ├── .env
│   ├── package.json
│   └── server.js
│
└── frontend/
    ├── public/
    │   └── index.html
    ├── src/
    │   ├── components/
    │   │   └── Layout.jsx      # Sidebar + mobile topbar
    │   ├── context/
    │   │   └── AuthContext.jsx # Auth state management
    │   ├── pages/
    │   │   ├── Dashboard.jsx   # Portfolio overview
    │   │   ├── Exchange.jsx    # Currency converter
    │   │   ├── Wallet.jsx      # Wallet management
    │   │   ├── Transactions.jsx # History
    │   │   ├── Rates.jsx       # Live rates
    │   │   ├── Login.jsx
    │   │   └── Register.jsx
    │   ├── utils/
    │   │   └── api.js          # Axios instance
    │   ├── App.jsx
    │   ├── index.js
    │   └── index.css
    └── package.json
```

---

## 🛢️ Database Schema

```sql
users          — id, name, email, password, created_at
wallets        — id, user_id, currency, balance
exchange_rates — id, base_currency, target_currency, rate, updated_at
transactions   — id, user_id, from_currency, to_currency, from_amount, to_amount, rate, fee, status, created_at
watchlist      — id, user_id, base_currency, target_currency, created_at
```

---

## 🌐 API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Register new user |
| POST | /api/auth/login | Login |
| GET | /api/auth/me | Get current user |

### Exchange
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/exchange/currencies | List all currencies |
| GET | /api/exchange/rates?base=USD | Get all rates for a base |
| GET | /api/exchange/rate/:from/:to | Get specific rate |
| POST | /api/exchange/convert | Preview conversion |
| POST | /api/exchange/execute | Execute exchange (auth required) |

### Wallet
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/wallet | Get user's wallets |
| POST | /api/wallet | Add new wallet |
| POST | /api/wallet/deposit | Deposit funds |
| GET | /api/wallet/transactions | Transaction history |
| GET | /api/wallet/watchlist | Get watchlist |
| POST | /api/wallet/watchlist | Add to watchlist |
| DELETE | /api/wallet/watchlist/:id | Remove from watchlist |

---

## 🔄 Optional: Real Exchange Rates API

To use real exchange rates, add your API key to `backend/.env`:

```
EXCHANGE_API_KEY=your_key_here
```

Get a free key from:
- https://exchangeratesapi.io/
- https://openexchangerates.org/

> Without a key, the app uses simulated rates that fluctuate ±1% every hour via cron job.
