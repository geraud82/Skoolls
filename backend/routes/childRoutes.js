const express = require('express');
const router = express.Router();
const { createChild, listChildren, updateChild, deleteChild } = require('../controllers/childController');
const verifyToken = require('../middleware/verifyToken');

router.post('/', verifyToken, createChild);
router.get('/', verifyToken, listChildren);
router.put('/:id', verifyToken, updateChild);
router.delete('/:id', verifyToken, deleteChild);

module.exports = router;
