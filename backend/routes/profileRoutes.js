const express = require('express');
const router = express.Router();
const { getProfile, updateProfile, updateProfilePicture } = require('../controllers/profileController');
const verifyToken = require('../middleware/verifyToken');
const upload = require('../middleware/uploadMiddleware');

// Toutes les routes de profil nécessitent une authentification
router.use(verifyToken);

// Récupérer le profil de l'utilisateur connecté
router.get('/', getProfile);

// Mettre à jour le profil de l'utilisateur connecté
router.put('/', updateProfile);

// Mettre à jour la photo de profil de l'utilisateur connecté
router.post('/photo', upload.single('profilePicture'), updateProfilePicture);

module.exports = router;
