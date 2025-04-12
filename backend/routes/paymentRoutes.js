const express = require('express');
const router = express.Router();
const { 
  payTuition, 
  listPayments, 
  listSchoolPayments,
  handlePaydunyaCallback,
  checkPaydunyaStatus,
  handleStripeWebhook,
  handleFlutterwaveWebhook,
  checkStripeStatus,
  checkFlutterwaveStatus
} = require('../controllers/paymentController');
const verifyToken = require('../middleware/verifyToken');

// Routes pour les parents
router.post('/', verifyToken, payTuition);
router.get('/', verifyToken, listPayments);

// Routes pour les écoles
router.get('/school', verifyToken, listSchoolPayments);

// Routes pour PayDunya
router.post('/paydunya/callback', handlePaydunyaCallback);
router.get('/paydunya/status/:token', verifyToken, checkPaydunyaStatus);

// Routes pour Stripe
router.post('/stripe/webhook', handleStripeWebhook);
router.get('/stripe/status/:session_id', verifyToken, checkStripeStatus);

// Routes pour Flutterwave
router.post('/flutterwave/webhook', handleFlutterwaveWebhook);
router.get('/flutterwave/status/:transaction_id', verifyToken, checkFlutterwaveStatus);

module.exports = router;
