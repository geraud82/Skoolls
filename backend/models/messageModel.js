const db = require('../config/db');

// Créer un nouveau message
const createMessage = async (conversationId, senderId, content) => {
  const result = await db.query(
    'INSERT INTO messages (conversation_id, sender_id, content) VALUES ($1, $2, $3) RETURNING *',
    [conversationId, senderId, content]
  );
  return result.rows[0];
};

// Obtenir les messages d'une conversation
const getMessagesByConversationId = async (conversationId, limit = 50, offset = 0) => {
  const result = await db.query(
    `SELECT m.*, u.name as sender_name, u.profile_picture as sender_profile_picture, u.role as sender_role
     FROM messages m
     JOIN users u ON m.sender_id = u.id
     WHERE m.conversation_id = $1
     ORDER BY m.created_at DESC
     LIMIT $2 OFFSET $3`,
    [conversationId, limit, offset]
  );
  return result.rows;
};

// Marquer les messages comme lus
const markMessagesAsRead = async (conversationId, userId) => {
  const result = await db.query(
    `UPDATE messages 
     SET is_read = true 
     WHERE conversation_id = $1 AND sender_id != $2 AND is_read = false
     RETURNING *`,
    [conversationId, userId]
  );
  return result.rows;
};

// Compter les messages non lus pour un utilisateur
const countUnreadMessages = async (userId) => {
  const result = await db.query(
    `SELECT COUNT(*) 
     FROM messages m
     JOIN conversations c ON m.conversation_id = c.id
     WHERE m.is_read = false AND m.sender_id != $1 
     AND (c.parent_id = $1 OR c.school_id = $1)`,
    [userId]
  );
  return parseInt(result.rows[0].count);
};

module.exports = {
  createMessage,
  getMessagesByConversationId,
  markMessagesAsRead,
  countUnreadMessages
};
