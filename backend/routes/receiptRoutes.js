const express = require('express');
const router = express.Router();
const { 
  getReceipts, 
  getSchoolReceipts, 
  downloadReceipt 
} = require('../controllers/receiptController');
const verifyToken = require('../middleware/verifyToken');

// Routes pour les parents
router.get('/', verifyToken, getReceipts);

// Routes pour les écoles
router.get('/school', verifyToken, getSchoolReceipts);

// Route pour télécharger un reçu
router.get('/:id/download', verifyToken, downloadReceipt);

module.exports = router;
