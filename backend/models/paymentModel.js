const db = require('../config/db');

const createPayment = async ({ enrollment_id, amount, method, payment_token = null, payment_url = null, payment_status = 'pending', payment_details = null, transaction_id = null }) => {
  const result = await db.query(
    `INSERT INTO payments 
     (enrollment_id, amount, method, payment_token, payment_url, payment_status, payment_details, transaction_id) 
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
     RETURNING *`,
    [enrollment_id, amount, method, payment_token, payment_url, payment_status, payment_details, transaction_id]
  );
  return result.rows[0];
};

const getPaymentsByParent = async (user_id) => {
  const result = await db.query(
    `SELECT p.id, c.first_name, c.last_name, cl.name AS class_name, p.amount, p.method, p.created_at
     FROM payments p
     JOIN enrollments e ON p.enrollment_id = e.id
     JOIN children c ON e.child_id = c.id
     JOIN classes cl ON e.class_id = cl.id
     WHERE c.user_id = $1`,
    [user_id]
  );
  return result.rows;
};

const getPaymentsBySchool = async (school_id) => {
  const result = await db.query(
    `SELECT p.id, c.first_name, c.last_name, cl.name AS class_name, p.amount, p.method, p.created_at
     FROM payments p
     JOIN enrollments e ON p.enrollment_id = e.id
     JOIN children c ON e.child_id = c.id
     JOIN classes cl ON e.class_id = cl.id
     WHERE cl.school_id = $1`,
    [school_id]
  );
  return result.rows;
};

/**
 * Met à jour le statut d'un paiement
 * @param {number} payment_id - ID du paiement
 * @param {string} payment_status - Nouveau statut du paiement
 * @param {Object} payment_details - Détails du paiement (optionnel)
 * @param {string} transaction_id - ID de transaction (optionnel)
 * @returns {Promise<Object>} - Paiement mis à jour
 */
const updatePaymentStatus = async (payment_id, payment_status, payment_details = null, transaction_id = null) => {
  let query = 'UPDATE payments SET payment_status = $1';
  const params = [payment_status];
  
  // Ajouter les détails du paiement si fournis
  if (payment_details !== null) {
    query += ', payment_details = $2';
    params.push(payment_details);
    
    // Ajouter l'ID de transaction si fourni
    if (transaction_id !== null) {
      query += ', transaction_id = $3';
      params.push(transaction_id);
    }
    
    query += ' WHERE id = $' + (params.length + 1);
  } else {
    // Ajouter l'ID de transaction si fourni
    if (transaction_id !== null) {
      query += ', transaction_id = $2';
      params.push(transaction_id);
    }
    
    query += ' WHERE id = $' + (params.length + 1);
  }
  
  params.push(payment_id);
  query += ' RETURNING *';
  
  const result = await db.query(query, params);
  return result.rows[0];
};

/**
 * Récupère un paiement par son token PayDunya
 * @param {string} token - Token PayDunya
 * @returns {Promise<Object|null>} - Paiement trouvé ou null
 */
const getPaymentByToken = async (token) => {
  const result = await db.query(
    'SELECT * FROM payments WHERE payment_token = $1',
    [token]
  );
  return result.rows.length > 0 ? result.rows[0] : null;
};

module.exports = { 
  createPayment, 
  getPaymentsByParent, 
  getPaymentsBySchool,
  updatePaymentStatus,
  getPaymentByToken
};
