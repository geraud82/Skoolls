const express = require('express');
const router = express.Router();
const { addClass, listClasses, getClass, listAllClasses, deleteClass, updateClass, getClassesBySchoolId } = require('../controllers/classController');
const verifyToken = require('../middleware/verifyToken');

router.post('/', verifyToken, addClass);
router.get('/', verifyToken, listClasses);
router.get('/all', verifyToken, listAllClasses); // Route pour lister toutes les classes
router.get('/by-school/:schoolId', verifyToken, getClassesBySchoolId); // Route pour obtenir les classes d'une école spécifique
router.get('/:id', verifyToken, getClass); // Route pour obtenir une classe par son ID
router.delete('/:id', verifyToken, deleteClass); // Route protégée pour supprimer une classe
router.put('/:id', verifyToken, updateClass); // Route protégée pour mettre à jour une classe

module.exports = router;
