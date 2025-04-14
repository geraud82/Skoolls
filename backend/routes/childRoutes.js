const express = require('express');
const router = express.Router();
const { createChild, listChildren, updateChild, deleteChild, getChild } = require('../controllers/childController');
const verifyToken = require('../middleware/verifyToken');

router.post('/', verifyToken, createChild);
router.get('/', verifyToken, listChildren);
router.get('/:id', verifyToken, getChild);
router.put('/:id', verifyToken, updateChild);
router.delete('/:id', verifyToken, deleteChild);

module.exports = router;
