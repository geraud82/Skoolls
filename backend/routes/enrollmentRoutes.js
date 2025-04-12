const express = require('express');
const router = express.Router();
const {
  createEnrollment,
  getParentEnrollments,
  getSchoolEnrollments,
  updateEnrollmentStatus
} = require('../controllers/enrollmentController');
const verifyToken = require('../middleware/verifyToken');

// Routes pour les parents
router.post('/', verifyToken, createEnrollment);
router.get('/', verifyToken, getParentEnrollments);

// Routes pour les écoles
router.get('/school', verifyToken, getSchoolEnrollments);
router.patch('/:id/status', verifyToken, updateEnrollmentStatus);

module.exports = router;
