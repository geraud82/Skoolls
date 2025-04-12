const db = require('../config/db');

const getAllSchools = async () => {
  try {
    // Vérifier si la table users existe
    const tableCheck = await db.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      )
    `);
    
    if (!tableCheck.rows[0].exists) {
      console.error('La table users n\'existe pas');
      return [];
    }
    
    // Récupérer les écoles (utilisateurs avec le rôle 'ecole')
    const result = await db.query(`
      SELECT id, name, email, profile_picture, created_at 
      FROM users 
      WHERE role = 'ecole'
    `);
    
    return result.rows;
  } catch (err) {
    console.error('Erreur lors de la récupération des écoles:', err);
    return [];
  }
};

module.exports = { getAllSchools };
