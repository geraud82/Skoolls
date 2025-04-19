const db = require('../config/db');
const bcrypt = require('bcryptjs');

// Créer un nouvel utilisateur d'école (censeur, comptable, surveillant, etc.)
const createSchoolUser = async (req, res) => {
  try {
    console.log('📝 Création d\'un nouvel utilisateur d\'école');
    console.log('📝 Données reçues:', req.body);
    console.log('📝 Type de permissions:', typeof req.body.permissions);
    console.log('📝 Valeur de permissions:', req.body.permissions);
    console.log('📝 Utilisateur connecté:', req.user);
    
    const { name, email, password, role, permissions } = req.body;
    const schoolId = req.user.id; // L'ID de l'école connectée
    
    console.log('📝 ID de l\'école connectée:', schoolId);
    
    // Vérifier que tous les champs requis sont présents
    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: 'Tous les champs sont requis' });
    }
    
    // Vérifier que le rôle est valide
    const validRoles = ['censeur', 'comptable', 'surveillant', 'bibliothecaire'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: 'Rôle invalide. Les rôles autorisés sont: censeur, comptable, surveillant, bibliothecaire' });
    }
    
    // Vérifier si l'email existe déjà
    const emailCheck = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (emailCheck.rows.length > 0) {
      return res.status(400).json({ message: 'Cet email est déjà utilisé' });
    }
    
    // Hasher le mot de passe
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Convertir les permissions en JSON
    let permissionsJson = '{}';
    try {
      permissionsJson = JSON.stringify(permissions || {});
    } catch (error) {
      console.error('❌ Erreur permissions:', error);
      return res.status(400).json({ message: 'Le format des permissions est invalide (doit être un objet JSON)' });
    }
    
    // Vérifier que l'école existe
    const schoolCheck = await db.query('SELECT * FROM users WHERE id = $1 AND role = $2', [schoolId, 'ecole']);
    if (schoolCheck.rows.length === 0) {
      return res.status(400).json({ message: 'École non trouvée ou utilisateur non autorisé' });
    }
    
    console.log('📝 Tentative d\'insertion dans la base de données avec les valeurs:', {
      name, email, role, schoolId, permissions: permissionsJson
    });
    
    // Créer l'utilisateur avec un rôle spécifique à l'école et une référence à l'école
    const result = await db.query(
      'INSERT INTO users (name, email, password, role, school_id, permissions) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, name, email, role, permissions',
      [name, email, hashedPassword, role, schoolId, permissionsJson]
    );
    
    // Convertir les permissions JSON en objet JavaScript avec gestion d'erreur
    let parsedPermissions = {};
    
    if (result.rows[0].permissions) {
      try {
        parsedPermissions = JSON.parse(result.rows[0].permissions);
      } catch (error) {
        console.error(`❌ Erreur lors du parsing des permissions pour l'utilisateur ${result.rows[0].id}:`, error);
        console.error('❌ Valeur des permissions:', result.rows[0].permissions);
        // Utiliser un objet vide en cas d'erreur
        parsedPermissions = {};
      }
    }
    
    const newUser = {
      ...result.rows[0],
      permissions: parsedPermissions
    };
    
    res.status(201).json({
      message: 'Utilisateur créé avec succès',
      user: newUser
    });
  } catch (err) {
    console.error('❌ Erreur création utilisateur école:', err);
    console.error('❌ Détails de l\'erreur:', err.message);
    if (err.stack) {
      console.error('❌ Stack trace:', err.stack);
    }
    if (err.code) {
      console.error('❌ Code d\'erreur:', err.code);
    }
    if (err.detail) {
      console.error('❌ Détails supplémentaires:', err.detail);
    }
    
    // Envoyer un message d'erreur plus spécifique si possible
    let errorMessage = 'Erreur lors de la création de l\'utilisateur';
    
    // Erreurs spécifiques à PostgreSQL
    if (err.code === '23505') {
      errorMessage = 'Un utilisateur avec cet email existe déjà';
    } else if (err.code === '23503') {
      errorMessage = 'Référence invalide (contrainte de clé étrangère)';
    } else if (err.code === '23514') {
      errorMessage = 'Contrainte de validation violée';
    } else if (err.code === '22P02') {
      errorMessage = 'Type de données invalide';
    }
    
    res.status(500).json({ 
      message: errorMessage,
      error: err.message
    });
  }
};

// Récupérer tous les utilisateurs liés à l'école connectée
const getSchoolUsers = async (req, res) => {
  try {
    const schoolId = req.user.id; // L'ID de l'école connectée
    
    const result = await db.query(
      'SELECT id, name, email, role, permissions, created_at FROM users WHERE school_id = $1 ORDER BY created_at DESC',
      [schoolId]
    );
    
    // Convertir les permissions JSON en objets JavaScript avec gestion d'erreur
    const users = result.rows.map(user => {
      let parsedPermissions = {};
      
      if (user.permissions) {
        try {
          parsedPermissions = JSON.parse(user.permissions);
        } catch (error) {
          console.error(`❌ Erreur lors du parsing des permissions pour l'utilisateur ${user.id}:`, error);
          console.error('❌ Valeur des permissions:', user.permissions);
          // Utiliser un objet vide en cas d'erreur
          parsedPermissions = {};
        }
      }
      
      return {
        ...user,
        permissions: parsedPermissions
      };
    });
    
    res.json(users);
  } catch (err) {
    console.error('❌ Erreur récupération utilisateurs école:', err);
    console.error('❌ Détails de l\'erreur:', err.message);
    if (err.stack) {
      console.error('❌ Stack trace:', err.stack);
    }
    
    res.status(500).json({ 
      message: 'Erreur lors de la récupération des utilisateurs',
      error: err.message
    });
  }
};

// Récupérer un utilisateur spécifique de l'école
const getSchoolUserById = async (req, res) => {
  try {
    const { userId } = req.params;
    const schoolId = req.user.id; // L'ID de l'école connectée
    
    // Vérifier que l'utilisateur appartient bien à cette école
    const result = await db.query(
      'SELECT id, name, email, role, permissions, created_at FROM users WHERE id = $1 AND school_id = $2',
      [userId, schoolId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    
    // Convertir les permissions JSON en objet JavaScript avec gestion d'erreur
    let parsedPermissions = {};
    
    if (result.rows[0].permissions) {
      try {
        parsedPermissions = JSON.parse(result.rows[0].permissions);
      } catch (error) {
        console.error(`❌ Erreur lors du parsing des permissions pour l'utilisateur ${result.rows[0].id}:`, error);
        console.error('❌ Valeur des permissions:', result.rows[0].permissions);
        // Utiliser un objet vide en cas d'erreur
        parsedPermissions = {};
      }
    }
    
    const user = {
      ...result.rows[0],
      permissions: parsedPermissions
    };
    
    res.json(user);
  } catch (err) {
    console.error('❌ Erreur récupération utilisateur école:', err);
    console.error('❌ Détails de l\'erreur:', err.message);
    if (err.stack) {
      console.error('❌ Stack trace:', err.stack);
    }
    
    res.status(500).json({ 
      message: 'Erreur lors de la récupération de l\'utilisateur',
      error: err.message
    });
  }
};

// Mettre à jour un utilisateur de l'école
const updateSchoolUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { name, email, password, role, permissions } = req.body;
    const schoolId = req.user.id; // L'ID de l'école connectée
    
    // Vérifier que l'utilisateur appartient bien à cette école
    const userCheck = await db.query(
      'SELECT * FROM users WHERE id = $1 AND school_id = $2',
      [userId, schoolId]
    );
    
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    
    // Vérifier que le rôle est valide s'il est fourni
    if (role) {
      const validRoles = ['censeur', 'comptable', 'surveillant', 'bibliothecaire'];
      if (!validRoles.includes(role)) {
        return res.status(400).json({ message: 'Rôle invalide. Les rôles autorisés sont: censeur, comptable, surveillant, bibliothecaire' });
      }
    }
    
    // Construire la requête de mise à jour en fonction des champs fournis
    let updateQuery = 'UPDATE users SET ';
    const updateValues = [];
    const updateFields = [];
    
    if (name) {
      updateFields.push(`name = $${updateValues.length + 1}`);
      updateValues.push(name);
    }
    
    if (email) {
      // Vérifier si le nouvel email existe déjà pour un autre utilisateur
      if (email !== userCheck.rows[0].email) {
        const emailCheck = await db.query(
          'SELECT * FROM users WHERE email = $1 AND id != $2',
          [email, userId]
        );
        
        if (emailCheck.rows.length > 0) {
          return res.status(400).json({ message: 'Cet email est déjà utilisé' });
        }
      }
      
      updateFields.push(`email = $${updateValues.length + 1}`);
      updateValues.push(email);
    }
    
    if (password) {
      // Hasher le nouveau mot de passe
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      
      updateFields.push(`password = $${updateValues.length + 1}`);
      updateValues.push(hashedPassword);
    }
    
    if (role) {
      updateFields.push(`role = $${updateValues.length + 1}`);
      updateValues.push(role);
    }
    
    if (permissions !== undefined) {
      // Convertir les permissions en JSON
      let permissionsJson = '{}';
      try {
        permissionsJson = JSON.stringify(permissions || {});
      } catch (error) {
        console.error('❌ Erreur permissions:', error);
        return res.status(400).json({ message: 'Le format des permissions est invalide (doit être un objet JSON)' });
      }
      
      updateFields.push(`permissions = $${updateValues.length + 1}`);
      updateValues.push(permissionsJson);
    }
    
    // Si aucun champ à mettre à jour, retourner l'utilisateur tel quel
    if (updateFields.length === 0) {
      return res.json({
        message: 'Aucune modification effectuée',
        user: userCheck.rows[0]
      });
    }
    
    // Finaliser la requête de mise à jour
    updateQuery += updateFields.join(', ');
    updateQuery += ` WHERE id = $${updateValues.length + 1} AND school_id = $${updateValues.length + 2} RETURNING id, name, email, role, permissions`;
    updateValues.push(userId, schoolId);
    
    // Exécuter la mise à jour
    const result = await db.query(updateQuery, updateValues);
    
    // Convertir les permissions JSON en objet JavaScript avec gestion d'erreur
    let parsedPermissions = {};
    
    if (result.rows[0].permissions) {
      try {
        parsedPermissions = JSON.parse(result.rows[0].permissions);
      } catch (error) {
        console.error(`❌ Erreur lors du parsing des permissions pour l'utilisateur ${result.rows[0].id}:`, error);
        console.error('❌ Valeur des permissions:', result.rows[0].permissions);
        // Utiliser un objet vide en cas d'erreur
        parsedPermissions = {};
      }
    }
    
    const updatedUser = {
      ...result.rows[0],
      permissions: parsedPermissions
    };
    
    res.json({
      message: 'Utilisateur mis à jour avec succès',
      user: updatedUser
    });
  } catch (err) {
    console.error('❌ Erreur mise à jour utilisateur école:', err);
    console.error('❌ Détails de l\'erreur:', err.message);
    if (err.stack) {
      console.error('❌ Stack trace:', err.stack);
    }
    if (err.code) {
      console.error('❌ Code d\'erreur:', err.code);
    }
    if (err.detail) {
      console.error('❌ Détails supplémentaires:', err.detail);
    }
    
    // Envoyer un message d'erreur plus spécifique si possible
    let errorMessage = 'Erreur lors de la mise à jour de l\'utilisateur';
    
    // Erreurs spécifiques à PostgreSQL
    if (err.code === '23505') {
      errorMessage = 'Un utilisateur avec cet email existe déjà';
    } else if (err.code === '23503') {
      errorMessage = 'Référence invalide (contrainte de clé étrangère)';
    } else if (err.code === '23514') {
      errorMessage = 'Contrainte de validation violée';
    } else if (err.code === '22P02') {
      errorMessage = 'Type de données invalide';
    }
    
    res.status(500).json({ 
      message: errorMessage,
      error: err.message
    });
  }
};

// Supprimer un utilisateur de l'école
const deleteSchoolUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const schoolId = req.user.id; // L'ID de l'école connectée
    
    // Vérifier que l'utilisateur appartient bien à cette école
    const userCheck = await db.query(
      'SELECT * FROM users WHERE id = $1 AND school_id = $2',
      [userId, schoolId]
    );
    
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    
    // Supprimer l'utilisateur
    await db.query(
      'DELETE FROM users WHERE id = $1 AND school_id = $2',
      [userId, schoolId]
    );
    
    res.json({ message: 'Utilisateur supprimé avec succès' });
  } catch (err) {
    console.error('❌ Erreur suppression utilisateur école:', err);
    console.error('❌ Détails de l\'erreur:', err.message);
    if (err.stack) {
      console.error('❌ Stack trace:', err.stack);
    }
    if (err.code) {
      console.error('❌ Code d\'erreur:', err.code);
    }
    if (err.detail) {
      console.error('❌ Détails supplémentaires:', err.detail);
    }
    
    // Envoyer un message d'erreur plus spécifique si possible
    let errorMessage = 'Erreur lors de la suppression de l\'utilisateur';
    
    // Erreurs spécifiques à PostgreSQL
    if (err.code === '23503') {
      errorMessage = 'Impossible de supprimer cet utilisateur car il est référencé par d\'autres données';
    }
    
    res.status(500).json({ 
      message: errorMessage,
      error: err.message
    });
  }
};

module.exports = {
  createSchoolUser,
  getSchoolUsers,
  getSchoolUserById,
  updateSchoolUser,
  deleteSchoolUser
};
