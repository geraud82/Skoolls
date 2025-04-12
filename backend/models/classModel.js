const db = require('../config/db');

const createClass = async ({ school_id, name, tuition_fee }) => {
  try {
    const result = await db.query(
      'INSERT INTO classes (school_id, name, tuition_fee) VALUES ($1, $2, $3) RETURNING *',
      [school_id, name, tuition_fee]
    );
    return result.rows[0];
  } catch (err) {
    console.error('Erreur lors de la création de la classe:', err);
    throw err;
  }
};

const getClassesBySchool = async (school_id) => {
  try {
    // Vérifier si la table classes existe
    const tableCheck = await db.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'classes'
      )
    `);
    
    if (!tableCheck.rows[0].exists) {
      console.error('La table classes n\'existe pas');
      return [];
    }
    
    // Vérifier si school_id est valide
    if (!school_id || isNaN(parseInt(school_id))) {
      console.error('ID d\'école invalide:', school_id);
      return [];
    }
    
    const result = await db.query(
      'SELECT * FROM classes WHERE school_id = $1',
      [parseInt(school_id)]
    );
    return result.rows;
  } catch (err) {
    console.error('Erreur lors de la récupération des classes:', err);
    return [];
  }
};

const getClassById = async (id) => {
  try {
    if (!id || isNaN(parseInt(id))) {
      console.error('ID de classe invalide:', id);
      return null;
    }
    
    const result = await db.query('SELECT * FROM classes WHERE id = $1', [parseInt(id)]);
    return result.rows[0] || null;
  } catch (err) {
    console.error('Erreur lors de la récupération de la classe:', err);
    return null;
  }
};

const getAllClasses = async () => {
  try {
    // Vérifier si la table classes existe
    const tableCheck = await db.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'classes'
      )
    `);
    
    if (!tableCheck.rows[0].exists) {
      console.error('La table classes n\'existe pas');
      return [];
    }
    
    const result = await db.query('SELECT * FROM classes');
    return result.rows;
  } catch (err) {
    console.error('Erreur lors de la récupération des classes:', err);
    return [];
  }
};

module.exports = { createClass, getClassesBySchool, getClassById, getAllClasses };
