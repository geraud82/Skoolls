const db = require('../config/db');

const createUser = async ({ name, email, password, role }) => {
  const result = await db.query(
    'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING *',
    [name, email, password, role]
  );
  return result.rows[0];
};

const findUserByEmail = async (email) => {
  const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
  return result.rows[0];
};

const findUserById = async (id) => {
  try {
    console.log('🔍 Recherche de l\'utilisateur avec ID:', id);
    
    // Vérifier si l'ID est valide
    if (!id) {
      console.error('❌ ID utilisateur invalide ou manquant:', id);
      throw new Error('ID utilisateur invalide ou manquant');
    }
    
    // Vérifier la connexion à la base de données
    if (!db) {
      console.error('❌ Connexion à la base de données non établie');
      throw new Error('Connexion à la base de données non établie');
    }
    
    // Exécuter la requête avec plus de détails
    console.log('🔍 Exécution de la requête SQL: SELECT * FROM users WHERE id = $1', [id]);
    const result = await db.query('SELECT * FROM users WHERE id = $1', [id]);
    
    // Logs détaillés sur le résultat
    console.log('📊 Résultat de la requête SQL:', result.rowCount, 'lignes trouvées');
    if (result.rowCount === 0) {
      console.log('⚠️ Aucun utilisateur trouvé avec l\'ID:', id);
    } else {
      console.log('✅ Utilisateur trouvé avec l\'ID:', id);
      // Log sécurisé sans afficher les informations sensibles
      const { password, ...safeUserData } = result.rows[0];
      console.log('📋 Données utilisateur récupérées:', safeUserData);
    }
    
    return result.rows[0];
  } catch (err) {
    console.error('❌ Erreur lors de la recherche de l\'utilisateur:', err);
    console.error('❌ Détails de l\'erreur:', err.message);
    console.error('❌ Stack trace:', err.stack);
    throw err;
  }
};

const updateUser = async (id, updateData) => {
  // Construire la requête dynamiquement en fonction des champs à mettre à jour
  const fields = Object.keys(updateData);
  const values = Object.values(updateData);
  
  // Créer la partie SET de la requête (ex: "name = $1, email = $2")
  const setClause = fields.map((field, index) => `${field} = $${index + 1}`).join(', ');
  
  // Ajouter l'ID à la fin des valeurs pour la clause WHERE
  values.push(id);
  
  const query = `
    UPDATE users 
    SET ${setClause} 
    WHERE id = $${values.length} 
    RETURNING *
  `;
  
  const result = await db.query(query, values);
  return result.rows[0];
};

module.exports = { createUser, findUserByEmail, findUserById, updateUser };
