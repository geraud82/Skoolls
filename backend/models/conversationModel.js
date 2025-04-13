const db = require('../config/db');

// Créer une nouvelle conversation
const createConversation = async (parentId, schoolId) => {
  const result = await db.query(
    'INSERT INTO conversations (parent_id, school_id) VALUES ($1, $2) RETURNING *',
    [parentId, schoolId]
  );
  return result.rows[0];
};

// Trouver une conversation par ID
const findConversationById = async (id) => {
  const result = await db.query('SELECT * FROM conversations WHERE id = $1', [id]);
  return result.rows[0];
};

// Trouver une conversation entre un parent et une école
const findConversationByParticipants = async (parentId, schoolId) => {
  const result = await db.query(
    'SELECT * FROM conversations WHERE parent_id = $1 AND school_id = $2',
    [parentId, schoolId]
  );
  return result.rows[0];
};

// Obtenir toutes les conversations d'un utilisateur (parent ou école)
const getConversationsByUserId = async (userId, role) => {
  let query;
  
  if (role === 'parent') {
    query = `
      SELECT c.*, u.name as school_name, u.profile_picture as school_profile_picture,
      (SELECT COUNT(*) FROM messages m WHERE m.conversation_id = c.id AND m.is_read = false AND m.sender_id != $1) as unread_count,
      (SELECT m.content FROM messages m WHERE m.conversation_id = c.id ORDER BY m.created_at DESC LIMIT 1) as last_message,
      (SELECT m.created_at FROM messages m WHERE m.conversation_id = c.id ORDER BY m.created_at DESC LIMIT 1) as last_message_date
      FROM conversations c
      JOIN users u ON c.school_id = u.id
      WHERE c.parent_id = $1
      ORDER BY last_message_date DESC NULLS LAST
    `;
  } else if (role === 'ecole') {
    query = `
      SELECT c.*, u.name as parent_name, u.profile_picture as parent_profile_picture,
      (SELECT COUNT(*) FROM messages m WHERE m.conversation_id = c.id AND m.is_read = false AND m.sender_id != $1) as unread_count,
      (SELECT m.content FROM messages m WHERE m.conversation_id = c.id ORDER BY m.created_at DESC LIMIT 1) as last_message,
      (SELECT m.created_at FROM messages m WHERE m.conversation_id = c.id ORDER BY m.created_at DESC LIMIT 1) as last_message_date
      FROM conversations c
      JOIN users u ON c.parent_id = u.id
      WHERE c.school_id = $1
      ORDER BY last_message_date DESC NULLS LAST
    `;
  } else {
    throw new Error('Rôle non valide');
  }
  
  const result = await db.query(query, [userId]);
  return result.rows;
};

// Mettre à jour la date de dernière mise à jour d'une conversation
const updateConversationTimestamp = async (id) => {
  const result = await db.query(
    'UPDATE conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *',
    [id]
  );
  return result.rows[0];
};

module.exports = {
  createConversation,
  findConversationById,
  findConversationByParticipants,
  getConversationsByUserId,
  updateConversationTimestamp
};
