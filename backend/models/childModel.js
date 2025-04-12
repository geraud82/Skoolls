const db = require('../config/db');

const addChild = async ({ user_id, first_name, last_name, birth_date }) => {
  try {
    // Vérifier si la table children existe
    const tableCheck = await db.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'children'
      )
    `);
    
    if (!tableCheck.rows[0].exists) {
      console.error('La table children n\'existe pas');
      throw new Error('La table children n\'existe pas');
    }
    
    // Vérifier si user_id est valide
    if (!user_id || isNaN(parseInt(user_id))) {
      console.error('ID utilisateur invalide:', user_id);
      throw new Error('ID utilisateur invalide');
    }
    
    const result = await db.query(
      'INSERT INTO children (user_id, first_name, last_name, birth_date) VALUES ($1, $2, $3, $4) RETURNING *',
      [user_id, first_name, last_name, birth_date]
    );
    return result.rows[0];
  } catch (err) {
    console.error('Erreur lors de l\'ajout de l\'enfant:', err);
    throw err;
  }
};

const getChildrenByParent = async (user_id) => {
  try {
    // Vérifier si la table children existe
    const tableCheck = await db.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'children'
      )
    `);
    
    if (!tableCheck.rows[0].exists) {
      console.error('La table children n\'existe pas');
      return [];
    }
    
    // Vérifier si user_id est valide
    if (!user_id || isNaN(parseInt(user_id))) {
      console.error('ID utilisateur invalide:', user_id);
      return [];
    }
    
    const result = await db.query('SELECT * FROM children WHERE user_id = $1', [user_id]);
    return result.rows;
  } catch (err) {
    console.error('Erreur lors de la récupération des enfants:', err);
    return [];
  }
};

module.exports = { addChild, getChildrenByParent };
