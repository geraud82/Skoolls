const db = require('../config/db');

const createEnrollment = async ({ child_id, class_id }) => {
  try {
    // Vérifier si la table enrollments existe
    const tableCheck = await db.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'enrollments'
      )
    `);
    
    if (!tableCheck.rows[0].exists) {
      console.error('La table enrollments n\'existe pas');
      throw new Error('La table enrollments n\'existe pas');
    }
    
    // Vérifier si child_id est valide
    if (!child_id || isNaN(parseInt(child_id))) {
      console.error('ID enfant invalide:', child_id);
      throw new Error('ID enfant invalide');
    }
    
    // Vérifier si class_id est valide
    if (!class_id || isNaN(parseInt(class_id))) {
      console.error('ID classe invalide:', class_id);
      throw new Error('ID classe invalide');
    }
    
    // Vérifier si l'enfant existe
    const childCheck = await db.query('SELECT * FROM children WHERE id = $1', [parseInt(child_id)]);
    if (childCheck.rows.length === 0) {
      console.error('Enfant non trouvé avec l\'ID:', child_id);
      throw new Error('Enfant non trouvé');
    }
    
    // Vérifier si la classe existe
    const classCheck = await db.query('SELECT * FROM classes WHERE id = $1', [parseInt(class_id)]);
    if (classCheck.rows.length === 0) {
      console.error('Classe non trouvée avec l\'ID:', class_id);
      throw new Error('Classe non trouvée');
    }
    
    // Vérifier si l'inscription existe déjà
    const existingCheck = await db.query(
      'SELECT * FROM enrollments WHERE child_id = $1 AND class_id = $2',
      [parseInt(child_id), parseInt(class_id)]
    );
    if (existingCheck.rows.length > 0) {
      console.error('Inscription déjà existante pour cet enfant dans cette classe');
      throw new Error('Inscription déjà existante');
    }
    
    const result = await db.query(
      'INSERT INTO enrollments (child_id, class_id, status) VALUES ($1, $2, $3) RETURNING *',
      [parseInt(child_id), parseInt(class_id), 'pending']
    );
    return result.rows[0];
  } catch (err) {
    console.error('Erreur lors de la création de l\'inscription:', err);
    throw err;
  }
};

const getEnrollmentsByParent = async (user_id) => {
  try {
    // Vérifier si user_id est valide
    if (!user_id || isNaN(parseInt(user_id))) {
      console.error('ID utilisateur invalide:', user_id);
      return [];
    }
    
    // Vérifier si les tables nécessaires existent
    const tablesCheck = await db.query(`
      SELECT 
        (SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'enrollments')) AS enrollments_exists,
        (SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'children')) AS children_exists,
        (SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'classes')) AS classes_exists
    `);
    
    const { enrollments_exists, children_exists, classes_exists } = tablesCheck.rows[0];
    
    if (!enrollments_exists || !children_exists || !classes_exists) {
      console.error('Une ou plusieurs tables requises n\'existent pas');
      return [];
    }
    
    const result = await db.query(
      `SELECT e.id, 
              c.first_name, 
              c.last_name, 
              CONCAT(c.first_name, ' ', c.last_name) AS child_name,
              u.name AS parent_name,
              cl.name AS class_name, 
              cl.tuition_fee, 
              e.status, 
              e.created_at,
              cl.school_id,
              s.name AS school_name
       FROM enrollments e
       JOIN children c ON e.child_id = c.id
       JOIN classes cl ON e.class_id = cl.id
       JOIN users u ON c.user_id = u.id
       JOIN users s ON cl.school_id = s.id
       WHERE c.user_id = $1
       ORDER BY e.created_at DESC`,
      [parseInt(user_id)]
    );
    return result.rows;
  } catch (err) {
    console.error('Erreur lors de la récupération des inscriptions par parent:', err);
    return [];
  }
};

const getEnrollmentsBySchool = async (school_id) => {
  try {
    // Vérifier si school_id est valide
    if (!school_id || isNaN(parseInt(school_id))) {
      console.error('ID école invalide:', school_id);
      return [];
    }
    
    // Vérifier si les tables nécessaires existent
    const tablesCheck = await db.query(`
      SELECT 
        (SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'enrollments')) AS enrollments_exists,
        (SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'children')) AS children_exists,
        (SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'classes')) AS classes_exists
    `);
    
    const { enrollments_exists, children_exists, classes_exists } = tablesCheck.rows[0];
    
    if (!enrollments_exists || !children_exists || !classes_exists) {
      console.error('Une ou plusieurs tables requises n\'existent pas');
      return [];
    }
    
  const result = await db.query(
    `SELECT e.id, 
            c.first_name, 
            c.last_name, 
            CONCAT(c.first_name, ' ', c.last_name) AS child_name,
            u.name AS parent_name,
            cl.name AS class_name, 
            cl.tuition_fee, 
            e.status, 
            e.created_at,
            e.updated_at
     FROM enrollments e
     JOIN children c ON e.child_id = c.id
     JOIN classes cl ON e.class_id = cl.id
     JOIN users u ON c.user_id = u.id
     WHERE cl.school_id = $1
     ORDER BY e.created_at DESC`,
    [parseInt(school_id)]
  );
    return result.rows;
  } catch (err) {
    console.error('Erreur lors de la récupération des inscriptions par école:', err);
    return [];
  }
};

const updateEnrollmentStatus = async (enrollment_id, status) => {
  try {
    const validStatuses = ['pending', 'accepted', 'rejected', 'paid'];
    if (!validStatuses.includes(status)) {
      console.error('Statut d\'inscription invalide:', status);
      throw new Error('Statut d\'inscription invalide');
    }
    
    // Vérifier si enrollment_id est valide
    if (!enrollment_id || isNaN(parseInt(enrollment_id))) {
      console.error('ID inscription invalide:', enrollment_id);
      throw new Error('ID inscription invalide');
    }
    
    const result = await db.query(
      'UPDATE enrollments SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [status, parseInt(enrollment_id)]
    );
    
    if (result.rows.length === 0) {
      console.error('Inscription non trouvée avec l\'ID:', enrollment_id);
      throw new Error('Inscription non trouvée');
    }
    
    return result.rows[0];
  } catch (err) {
    console.error('Erreur lors de la mise à jour du statut de l\'inscription:', err);
    throw err;
  }
};

module.exports = { 
  createEnrollment, 
  getEnrollmentsByParent, 
  getEnrollmentsBySchool, 
  updateEnrollmentStatus 
};
