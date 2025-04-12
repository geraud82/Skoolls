const db = require('../config/db');

/**
 * Récupère tous les reçus pour un parent spécifique
 * @param {number} userId - ID de l'utilisateur (parent)
 * @returns {Promise<Array>} - Liste des reçus
 */
const getReceiptsByParent = async (userId) => {
  const query = `
    SELECT p.id, p.transaction_id AS receipt_number, p.amount, p.created_at, p.method AS payment_method,
           c.first_name || ' ' || c.last_name AS child_name,
           cl.name AS class_name,
           s.name AS school_name
    FROM payments p
    JOIN enrollments e ON p.enrollment_id = e.id
    JOIN children c ON e.child_id = c.id
    JOIN classes cl ON e.class_id = cl.id
    JOIN users s ON cl.school_id = s.id
    WHERE c.user_id = $1 AND p.payment_status = 'completed'
    ORDER BY p.created_at DESC
  `;
  
  const result = await db.query(query, [userId]);
  return result.rows;
};

/**
 * Récupère tous les reçus pour une école spécifique
 * @param {number} schoolId - ID de l'école
 * @returns {Promise<Array>} - Liste des reçus
 */
const getReceiptsBySchool = async (schoolId) => {
  const query = `
    SELECT p.id, p.transaction_id AS receipt_number, p.amount, p.created_at, p.method AS payment_method,
           c.first_name || ' ' || c.last_name AS child_name,
           cl.name AS class_name,
           u.first_name || ' ' || u.last_name AS parent_name
    FROM payments p
    JOIN enrollments e ON p.enrollment_id = e.id
    JOIN children c ON e.child_id = c.id
    JOIN classes cl ON e.class_id = cl.id
    JOIN users u ON c.user_id = u.id
    WHERE cl.school_id = $1 AND p.payment_status = 'completed'
    ORDER BY p.created_at DESC
  `;
  
  const result = await db.query(query, [schoolId]);
  return result.rows;
};

/**
 * Récupère un reçu par son ID
 * @param {number} receiptId - ID du reçu
 * @returns {Promise<Object>} - Détails du reçu
 */
const getReceiptById = async (receiptId) => {
  const query = `
    SELECT p.id, p.transaction_id AS receipt_number, p.amount, p.created_at, p.method AS payment_method,
           c.first_name || ' ' || c.last_name AS child_name,
           cl.name AS class_name,
           s.name AS school_name,
           u.first_name || ' ' || u.last_name AS parent_name,
           u.email AS parent_email
    FROM payments p
    JOIN enrollments e ON p.enrollment_id = e.id
    JOIN children c ON e.child_id = c.id
    JOIN classes cl ON e.class_id = cl.id
    JOIN users s ON cl.school_id = s.id
    JOIN users u ON c.user_id = u.id
    WHERE p.id = $1 AND p.payment_status = 'completed'
  `;
  
  const result = await db.query(query, [receiptId]);
  return result.rows[0];
};

module.exports = {
  getReceiptsByParent,
  getReceiptsBySchool,
  getReceiptById
};
