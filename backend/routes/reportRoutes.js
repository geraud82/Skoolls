const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken');
const reportController = require('../controllers/reportController');

// Routes protégées par authentification
router.use(verifyToken);

// Récupérer les rapports de paiements
router.get('/payments', reportController.getPaymentsReport);

// Récupérer les rapports d'inscriptions
router.get('/enrollments', reportController.getEnrollmentsReport);

// Récupérer les rapports de classes
router.get('/classes', reportController.getClassesReport);

// Exporter les données au format CSV
router.get('/:type/export', reportController.exportReportToCsv);

module.exports = router;
