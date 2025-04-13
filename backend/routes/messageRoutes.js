const express = require('express');
const router = express.Router();
const {
  getUserConversations,
  getOrCreateConversation,
  getConversationMessages,
  sendMessage,
  getUnreadCount
} = require('../controllers/messageController');
const verifyToken = require('../middleware/verifyToken');

// Toutes les routes de messages nécessitent une authentification
router.use(verifyToken);

// Obtenir toutes les conversations de l'utilisateur
router.get('/conversations', getUserConversations);

// Obtenir ou créer une conversation avec un autre utilisateur
router.get('/conversations/user/:otherUserId', getOrCreateConversation);

// Obtenir les messages d'une conversation
router.get('/conversations/:conversationId/messages', getConversationMessages);

// Envoyer un message dans une conversation
router.post('/conversations/:conversationId/messages', sendMessage);

// Obtenir le nombre de messages non lus
router.get('/unread-count', getUnreadCount);

module.exports = router;
