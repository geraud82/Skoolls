const { 
  createConversation, 
  findConversationById, 
  findConversationByParticipants, 
  getConversationsByUserId,
  updateConversationTimestamp
} = require('../models/conversationModel');

const {
  createMessage,
  getMessagesByConversationId,
  markMessagesAsRead,
  countUnreadMessages
} = require('../models/messageModel');

const { findUserById } = require('../models/userModel');

// Obtenir toutes les conversations d'un utilisateur
const getUserConversations = async (req, res) => {
  try {
    const userId = req.user.id;
    const role = req.user.role;
    
    if (!['parent', 'ecole'].includes(role)) {
      return res.status(403).json({ message: 'Accès non autorisé' });
    }
    
    const conversations = await getConversationsByUserId(userId, role);
    
    res.json(conversations);
  } catch (err) {
    console.error('Erreur lors de la récupération des conversations:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Obtenir ou créer une conversation avec un autre utilisateur
const getOrCreateConversation = async (req, res) => {
  try {
    const userId = req.user.id;
    const role = req.user.role;
    const { otherUserId } = req.params;
    
    // Vérifier que l'autre utilisateur existe
    const otherUser = await findUserById(otherUserId);
    if (!otherUser) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    
    // Vérifier que les rôles sont compatibles (parent-école ou école-parent)
    if (
      (role === 'parent' && otherUser.role !== 'ecole') ||
      (role === 'ecole' && otherUser.role !== 'parent')
    ) {
      return res.status(403).json({ 
        message: 'Vous ne pouvez discuter qu\'avec une école (en tant que parent) ou un parent (en tant qu\'école)' 
      });
    }
    
    let conversation;
    
    // Déterminer qui est le parent et qui est l'école
    const parentId = role === 'parent' ? userId : otherUserId;
    const schoolId = role === 'ecole' ? userId : otherUserId;
    
    // Chercher une conversation existante
    conversation = await findConversationByParticipants(parentId, schoolId);
    
    // Si aucune conversation n'existe, en créer une nouvelle
    if (!conversation) {
      conversation = await createConversation(parentId, schoolId);
    }
    
    res.json(conversation);
  } catch (err) {
    console.error('Erreur lors de la récupération/création de la conversation:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Obtenir les messages d'une conversation
const getConversationMessages = async (req, res) => {
  try {
    const userId = req.user.id;
    const { conversationId } = req.params;
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;
    
    // Vérifier que la conversation existe
    const conversation = await findConversationById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation non trouvée' });
    }
    
    // Vérifier que l'utilisateur est un participant de la conversation
    if (conversation.parent_id !== userId && conversation.school_id !== userId) {
      return res.status(403).json({ message: 'Vous n\'êtes pas autorisé à accéder à cette conversation' });
    }
    
    // Récupérer les messages
    const messages = await getMessagesByConversationId(conversationId, limit, offset);
    
    // Marquer les messages comme lus
    await markMessagesAsRead(conversationId, userId);
    
    res.json(messages);
  } catch (err) {
    console.error('Erreur lors de la récupération des messages:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Envoyer un message
const sendMessage = async (req, res) => {
  try {
    const userId = req.user.id;
    const { conversationId } = req.params;
    const { content } = req.body;
    
    if (!content || content.trim() === '') {
      return res.status(400).json({ message: 'Le contenu du message ne peut pas être vide' });
    }
    
    // Vérifier que la conversation existe
    const conversation = await findConversationById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation non trouvée' });
    }
    
    // Vérifier que l'utilisateur est un participant de la conversation
    if (conversation.parent_id !== userId && conversation.school_id !== userId) {
      return res.status(403).json({ message: 'Vous n\'êtes pas autorisé à envoyer un message dans cette conversation' });
    }
    
    // Créer le message
    const message = await createMessage(conversationId, userId, content);
    
    // Mettre à jour la date de dernière mise à jour de la conversation
    await updateConversationTimestamp(conversationId);
    
    // Récupérer les informations supplémentaires sur l'expéditeur
    const sender = await findUserById(userId);
    message.sender_name = sender.name;
    message.sender_profile_picture = sender.profile_picture;
    message.sender_role = sender.role;
    
    res.status(201).json(message);
  } catch (err) {
    console.error('Erreur lors de l\'envoi du message:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Obtenir le nombre de messages non lus
const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const count = await countUnreadMessages(userId);
    
    res.json({ count });
  } catch (err) {
    console.error('Erreur lors du comptage des messages non lus:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

module.exports = {
  getUserConversations,
  getOrCreateConversation,
  getConversationMessages,
  sendMessage,
  getUnreadCount
};
