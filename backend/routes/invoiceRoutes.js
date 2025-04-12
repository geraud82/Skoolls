const express = require('express');
const router = express.Router();
const { getInvoices } = require('../controllers/invoiceController');
const verifyToken = require('../middleware/verifyToken');

router.get('/', verifyToken, getInvoices);

module.exports = router;
