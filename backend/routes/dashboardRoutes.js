const express = require('express');
const router = express.Router();
const { parentDashboard, schoolDashboard } = require('../controllers/dashboardController');
const verifyToken = require('../middleware/verifyToken');

router.get('/parent', verifyToken, parentDashboard);
router.get('/school', verifyToken, schoolDashboard);

module.exports = router;
