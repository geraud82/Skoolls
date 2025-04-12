const express = require('express');
const router = express.Router();
const { listSchools } = require('../controllers/schoolController');
const verifyToken = require('../middleware/verifyToken');

router.get('/', verifyToken, listSchools);

module.exports = router;
