const { 
  getReceiptsByParent, 
  getReceiptsBySchool, 
  getReceiptById 
} = require('../models/receiptModel');
const db = require('../config/db');

// Fonction utilitaire pour vérifier si l'utilisateur est une école
const isSchool = async (user_id) => {
  const result = await db.query("SELECT role FROM users WHERE id = $1", [user_id]);
  return result.rows.length > 0 && result.rows[0].role === 'ecole';
};

/**
 * Récupère tous les reçus pour un parent
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 */
const getReceipts = async (req, res) => {
  const user_id = req.user.id;
  try {
    const receipts = await getReceiptsByParent(user_id);
    res.json(receipts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur lors de la récupération des reçus', error: err.message });
  }
};

/**
 * Récupère tous les reçus pour une école
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 */
const getSchoolReceipts = async (req, res) => {
  const user_id = req.user.id;
  
  try {
    // Vérifier si l'utilisateur est une école
    if (!(await isSchool(user_id))) {
      return res.status(403).json({ message: 'Accès refusé. Seules les écoles peuvent accéder à cette ressource.' });
    }
    
    // Récupérer l'ID de l'école (qui est l'ID de l'utilisateur)
    const school_id = user_id;
    
    const receipts = await getReceiptsBySchool(school_id);
    res.json(receipts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur lors de la récupération des reçus', error: err.message });
  }
};

/**
 * Télécharge un reçu au format PDF
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 */
const downloadReceipt = async (req, res) => {
  const { id } = req.params;
  const user_id = req.user.id;
  
  try {
    // Récupérer les détails du reçu
    const receipt = await getReceiptById(id);
    
    if (!receipt) {
      return res.status(404).json({ message: 'Reçu non trouvé' });
    }
    
    // Vérifier si l'utilisateur est autorisé à accéder à ce reçu
    const isUserAuthorized = await db.query(
      `SELECT 1 FROM payments p
       JOIN enrollments e ON p.enrollment_id = e.id
       JOIN children c ON e.child_id = c.id
       JOIN classes cl ON e.class_id = cl.id
       WHERE p.id = $1 AND (c.user_id = $2 OR cl.school_id = $2)`,
      [id, user_id]
    );
    
    if (isUserAuthorized.rows.length === 0) {
      return res.status(403).json({ message: 'Vous n\'êtes pas autorisé à accéder à ce reçu' });
    }
    
    // TODO: Générer le PDF du reçu
    // Pour l'instant, nous renvoyons simplement un message
    res.status(501).json({ message: 'Fonctionnalité de téléchargement de reçu à implémenter' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur lors du téléchargement du reçu', error: err.message });
  }
};

module.exports = {
  getReceipts,
  getSchoolReceipts,
  downloadReceipt
};
