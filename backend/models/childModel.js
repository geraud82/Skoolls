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

const getChildById = async (id, user_id = null) => {
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
      return null;
    }
    
    // Vérifier si id est valide
    if (!id || isNaN(parseInt(id))) {
      console.error('ID enfant invalide:', id);
      return null;
    }
    
    // Si user_id est fourni, vérifier que l'enfant appartient à l'utilisateur
    let query = 'SELECT * FROM children WHERE id = $1';
    let params = [id];
    
    if (user_id) {
      query += ' AND user_id = $2';
      params.push(user_id);
    }
    
    console.log('Exécution de la requête:', query, 'avec les paramètres:', params);
    const result = await db.query(query, params);
    console.log('Résultat de la requête:', result.rows);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return result.rows[0];
  } catch (err) {
    console.error('Erreur lors de la récupération de l\'enfant:', err);
    return null;
  }
};

module.exports = { addChild, getChildrenByParent, getChildById };
