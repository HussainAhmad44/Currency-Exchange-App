const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const w = require('../controllers/walletController');

router.get('/', auth, w.getWallets);
router.post('/', auth, w.addWallet);
router.post('/deposit', auth, w.deposit);
router.get('/transactions', auth, w.getTransactions);
router.get('/watchlist', auth, w.getWatchlist);
router.post('/watchlist', auth, w.addToWatchlist);
router.delete('/watchlist/:id', auth, w.removeFromWatchlist);

module.exports = router;
