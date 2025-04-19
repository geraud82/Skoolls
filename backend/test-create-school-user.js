const db = require('./config/db');
const bcrypt = require('bcryptjs');

async function testCreateSchoolUser() {
  try {
    console.log('Connexion à la base de données...');
    await db.query('SELECT NOW()');
    console.log('✅ Connexion à la base de données réussie');
    
    // Récupérer un utilisateur avec le rôle 'ecole'
    const schoolResult = await db.query(
      'SELECT id FROM users WHERE role = $1 LIMIT 1',
      ['ecole']
    );
    
    if (schoolResult.rows.length === 0) {
      console.error('❌ Aucun utilisateur avec le rôle "ecole" trouvé');
      return;
    }
    
    const schoolId = schoolResult.rows[0].id;
    console.log(`✅ ID de l'école trouvé: ${schoolId}`);
    
    // Données de test pour le nouvel utilisateur
    const name = 'Test Censeur';
    const email = 'censeur.test@example.com';
    const password = 'password123';
    const role = 'censeur';
    const permissions = {
      classes: ['view', 'edit'],
      enrollments: ['view', 'approve'],
      payments: ['view']
    };
    
    // Hasher le mot de passe
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Convertir les permissions en JSON pour PostgreSQL
    const permissionsJson = JSON.stringify(permissions);
    
    console.log('Tentative de création d\'un utilisateur d\'école...');
    console.log('Données:', { name, email, role, schoolId, permissions: permissionsJson });
    
    // Créer l'utilisateur
    const result = await db.query(
      'INSERT INTO users (name, email, password, role, school_id, permissions) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, name, email, role, permissions',
      [name, email, hashedPassword, role, schoolId, permissionsJson]
    );
    
    console.log('✅ Utilisateur créé avec succès:', result.rows[0]);
  } catch (err) {
    console.error('❌ Erreur:', err);
  } finally {
    await db.end();
  }
}

testCreateSchoolUser();
