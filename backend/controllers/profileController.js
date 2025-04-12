const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const { findUserById, updateUser } = require('../models/userModel');

// Récupérer le profil de l'utilisateur
const getProfile = async (req, res) => {
  try {
    // Vérifier si req.user existe
    if (!req.user) {
      console.log('❌ req.user est undefined - Problème d\'authentification');
      return res.status(401).json({ message: 'Non authentifié' });
    }
    
    const userId = req.user.id;
    console.log('🔍 Récupération du profil pour l\'utilisateur ID:', userId);
    
    // Vérifier si l'ID utilisateur est valide
    if (!userId) {
      console.log('❌ ID utilisateur invalide:', userId);
      return res.status(400).json({ message: 'ID utilisateur invalide' });
    }
    
    // Récupérer l'utilisateur avec plus de logs
    console.log('🔍 Tentative de récupération de l\'utilisateur avec ID:', userId);
    let user;
    try {
      user = await findUserById(userId);
      console.log('📊 Résultat de la requête findUserById:', user ? 'Utilisateur trouvé' : 'Utilisateur non trouvé');
    } catch (dbErr) {
      console.error('❌ Erreur de base de données lors de la récupération de l\'utilisateur:', dbErr);
      return res.status(500).json({ message: 'Erreur de base de données', error: dbErr.message });
    }
    
    if (!user) {
      console.log('❌ Utilisateur non trouvé dans la base de données');
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    // Ne pas renvoyer le mot de passe
    const { password, ...userWithoutPassword } = user;
    
    console.log('✅ Profil récupéré avec succès:', userWithoutPassword);
    res.json(userWithoutPassword);
  } catch (err) {
    console.error('❌ Erreur lors de la récupération du profil:', err);
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

// Mettre à jour la photo de profil
const updateProfilePicture = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Vérifier si un fichier a été téléchargé
    if (!req.file) {
      return res.status(400).json({ message: 'Aucune image n\'a été téléchargée' });
    }
    
    // Vérifier si l'utilisateur existe
    const user = await findUserById(userId);
    if (!user) {
      // Supprimer le fichier téléchargé si l'utilisateur n'existe pas
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    
    // Supprimer l'ancienne photo de profil si elle existe
    if (user.profile_picture) {
      const oldPicturePath = path.join(__dirname, '../uploads/profile', path.basename(user.profile_picture));
      if (fs.existsSync(oldPicturePath)) {
        fs.unlinkSync(oldPicturePath);
      }
    }
    
    // Construire l'URL de la nouvelle photo de profil
    const profilePictureUrl = `/uploads/profile/${path.basename(req.file.path)}`;
    
    // Mettre à jour l'utilisateur avec la nouvelle photo de profil
    const updateData = {
      profile_picture: profilePictureUrl
    };
    
    const updatedUser = await updateUser(userId, updateData);
    
    // Ne pas renvoyer le mot de passe
    const { password, ...userWithoutPassword } = updatedUser;
    
    res.json({
      message: 'Photo de profil mise à jour avec succès',
      user: userWithoutPassword
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Mettre à jour le profil de l'utilisateur
const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, email, currentPassword, newPassword } = req.body;
    
    // Vérifier si l'utilisateur existe
    const user = await findUserById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    // Préparer les données à mettre à jour
    const updateData = {};
    
    // Mettre à jour le nom si fourni
    if (name) updateData.name = name;
    
    // Mettre à jour l'email si fourni
    if (email) updateData.email = email;
    
    // Mettre à jour le mot de passe si fourni
    if (currentPassword && newPassword) {
      // Vérifier que le mot de passe actuel est correct
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: 'Mot de passe actuel incorrect' });
      }
      
      // Hasher le nouveau mot de passe
      updateData.password = await bcrypt.hash(newPassword, 10);
    }
    
    // Si aucune donnée à mettre à jour
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: 'Aucune donnée à mettre à jour' });
    }
    
    // Mettre à jour l'utilisateur
    const updatedUser = await updateUser(userId, updateData);
    
    // Ne pas renvoyer le mot de passe
    const { password, ...userWithoutPassword } = updatedUser;
    
    res.json({ 
      message: 'Profil mis à jour avec succès', 
      user: userWithoutPassword 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

module.exports = { getProfile, updateProfile, updateProfilePicture };
