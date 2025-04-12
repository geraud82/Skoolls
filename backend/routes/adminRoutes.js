const express = require('express');
const router = express.Router();
const {
  adminDashboard,
  getAllUsers,
  getAllSchools,
  getAllParents,
  getAllPayments,
  getAllEnrollments,
  toggleUserStatus
} = require('../controllers/adminController');
const verifyToken = require('../middleware/verifyToken');
const adminMiddleware = require('../middleware/adminMiddleware');

// Toutes les routes admin nécessitent un token valide et des droits d'administrateur
router.use(verifyToken, adminMiddleware);

// Routes du tableau de bord admin
router.get('/dashboard', adminDashboard);
router.get('/users', getAllUsers);
router.get('/schools', getAllSchools);
router.get('/parents', getAllParents);
router.get('/payments', getAllPayments);
router.get('/enrollments', getAllEnrollments);
router.post('/users/toggle-status', toggleUserStatus);

module.exports = router;
