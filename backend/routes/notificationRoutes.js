const express = require('express');
const router = express.Router();
const {
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification
} = require('../controllers/notificationController');
const verifyToken = require('../middleware/verifyToken');

// Récupérer toutes les notifications d'un utilisateur
router.get('/', verifyToken, getUserNotifications);

// Marquer une notification comme lue
router.patch('/:id/read', verifyToken, markAsRead);

// Marquer toutes les notifications comme lues
router.patch('/read-all', verifyToken, markAllAsRead);

// Supprimer une notification
router.delete('/:id', verifyToken, deleteNotification);

module.exports = router;
