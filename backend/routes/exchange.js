const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const ex = require('../controllers/exchangeController');

router.get('/currencies', ex.getCurrencies);
router.get('/rates', ex.getRates);
router.get('/rate/:from/:to', ex.getRate);
router.post('/convert', ex.convert);
router.post('/execute', authMiddleware, ex.executeExchange);

module.exports = router;
