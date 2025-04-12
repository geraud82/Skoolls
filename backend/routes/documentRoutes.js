const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken');
const uploadDocument = require('../middleware/documentUploadMiddleware');
const {
  uploadEnrollmentDocument,
  uploadChildDocument,
  getEnrollmentDocuments,
  getChildDocuments,
  downloadDocument,
  deleteDocument
} = require('../controllers/enrollmentDocumentController');

// Routes pour les documents d'inscription
router.post('/enrollment', verifyToken, uploadDocument.single('document'), uploadEnrollmentDocument);
router.get('/enrollment/:enrollment_id', verifyToken, getEnrollmentDocuments);

// Routes pour les documents d'enfant
router.post('/child', verifyToken, uploadDocument.single('document'), uploadChildDocument);
router.get('/child/:child_id', verifyToken, getChildDocuments);

// Routes communes
router.get('/download/:type/:id', verifyToken, downloadDocument);
router.delete('/:type/:id', verifyToken, deleteDocument);

module.exports = router;
