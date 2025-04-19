const express = require('express');
const router = express.Router();
const {
  createSchoolUser,
  getSchoolUsers,
  getSchoolUserById,
  updateSchoolUser,
  deleteSchoolUser
} = require('../controllers/schoolUserController');
const verifyToken = require('../middleware/verifyToken');
const schoolMiddleware = require('../middleware/schoolMiddleware');

// Toutes les routes nécessitent un token valide et des droits d'école
router.use(verifyToken, schoolMiddleware);

// Routes pour la gestion des utilisateurs d'école
router.post('/', createSchoolUser);
router.get('/', getSchoolUsers);
router.get('/:userId', getSchoolUserById);
router.put('/:userId', updateSchoolUser);
router.delete('/:userId', deleteSchoolUser);

module.exports = router;
