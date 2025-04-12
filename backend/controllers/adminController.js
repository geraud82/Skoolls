const db = require('../config/db');

// Tableau de bord administrateur avec statistiques globales
const adminDashboard = async (req, res) => {
  try {
    // Récupérer les statistiques globales en parallèle
    const [
      usersCount,
      schoolsCount,
      parentsCount,
      childrenCount,
      classesCount,
      enrollmentsCount,
      paymentsStats
    ] = await Promise.all([
      db.query('SELECT COUNT(*) FROM users'),
      db.query('SELECT COUNT(*) FROM users WHERE role = $1', ['ecole']),
      db.query('SELECT COUNT(*) FROM users WHERE role = $1', ['parent']),
      db.query('SELECT COUNT(*) FROM children'),
      db.query('SELECT COUNT(*) FROM classes'),
      db.query('SELECT status, COUNT(*) FROM enrollments GROUP BY status'),
      db.query('SELECT COUNT(*) as total, COALESCE(SUM(amount), 0) as total_amount FROM payments')
    ]);

    res.json({
      users: {
        total: parseInt(usersCount.rows[0].count),
        schools: parseInt(schoolsCount.rows[0].count),
        parents: parseInt(parentsCount.rows[0].count)
      },
      children: parseInt(childrenCount.rows[0].count),
      classes: parseInt(classesCount.rows[0].count),
      enrollments: enrollmentsCount.rows,
      payments: paymentsStats.rows[0]
    });
  } catch (err) {
    console.error('❌ Erreur tableau de bord admin:', err);
    res.status(500).json({ message: 'Erreur lors de la récupération des statistiques' });
  }
};

// Liste de tous les utilisateurs
const getAllUsers = async (req, res) => {
  try {
    const result = await db.query(
      'SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (err) {
    console.error('❌ Erreur récupération utilisateurs:', err);
    res.status(500).json({ message: 'Erreur lors de la récupération des utilisateurs' });
  }
};

// Liste de toutes les écoles
const getAllSchools = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT u.id, u.name, u.email, u.created_at, 
             COUNT(DISTINCT c.id) as classes_count
      FROM users u
      LEFT JOIN classes c ON u.id = c.school_id
      WHERE u.role = 'ecole'
      GROUP BY u.id
      ORDER BY u.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('❌ Erreur récupération écoles:', err);
    res.status(500).json({ message: 'Erreur lors de la récupération des écoles' });
  }
};

// Liste de tous les parents
const getAllParents = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT u.id, u.name, u.email, u.created_at, 
             COUNT(DISTINCT ch.id) as children_count
      FROM users u
      LEFT JOIN children ch ON u.id = ch.user_id
      WHERE u.role = 'parent'
      GROUP BY u.id
      ORDER BY u.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('❌ Erreur récupération parents:', err);
    res.status(500).json({ message: 'Erreur lors de la récupération des parents' });
  }
};

// Liste de tous les paiements
const getAllPayments = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT p.id, p.amount, p.method, p.status, p.created_at,
             e.id as enrollment_id,
             c.first_name || ' ' || c.last_name as child_name,
             u.name as parent_name,
             cl.name as class_name,
             s.name as school_name
      FROM payments p
      JOIN enrollments e ON p.enrollment_id = e.id
      JOIN children c ON e.child_id = c.id
      JOIN users u ON c.user_id = u.id
      JOIN classes cl ON e.class_id = cl.id
      JOIN users s ON cl.school_id = s.id
      ORDER BY p.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('❌ Erreur récupération paiements:', err);
    res.status(500).json({ message: 'Erreur lors de la récupération des paiements' });
  }
};

// Liste de toutes les inscriptions
const getAllEnrollments = async (req, res) => {
  try {
  const result = await db.query(`
      SELECT e.id, e.status, e.created_at,
             c.first_name || ' ' || c.last_name as child_name,
             u.name as parent_name,
             cl.name as class_name,
             s.name as school_name
      FROM enrollments e
      JOIN children c ON e.child_id = c.id
      JOIN users u ON c.user_id = u.id
      JOIN classes cl ON e.class_id = cl.id
      JOIN users s ON cl.school_id = s.id
      ORDER BY e.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('❌ Erreur récupération inscriptions:', err);
    res.status(500).json({ message: 'Erreur lors de la récupération des inscriptions' });
  }
};

// Activer/désactiver un utilisateur
const toggleUserStatus = async (req, res) => {
  const { userId, active } = req.body;
  
  try {
    // Dans cet exemple, nous utilisons un champ 'active' pour indiquer si un utilisateur est actif
    // Si ce champ n'existe pas dans votre base de données, vous devrez d'abord l'ajouter
    const result = await db.query(
      'UPDATE users SET active = $1 WHERE id = $2 RETURNING id, name, email, role, active',
      [active, userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    
    res.json({
      message: active ? 'Utilisateur activé' : 'Utilisateur désactivé',
      user: result.rows[0]
    });
  } catch (err) {
    console.error('❌ Erreur modification statut utilisateur:', err);
    res.status(500).json({ message: 'Erreur lors de la modification du statut de l\'utilisateur' });
  }
};

module.exports = {
  adminDashboard,
  getAllUsers,
  getAllSchools,
  getAllParents,
  getAllPayments,
  getAllEnrollments,
  toggleUserStatus
};
