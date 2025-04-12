const db = require('./config/db');

async function checkAdminUser() {
  try {
    console.log('Connexion à la base de données...');
    
    // Vérifier si l'utilisateur admin existe
    const adminResult = await db.query('SELECT * FROM users WHERE role = $1', ['admin']);
    
    if (adminResult.rows.length > 0) {
      const admin = adminResult.rows[0];
      console.log('✅ Utilisateur administrateur trouvé:');
      console.log('ID:', admin.id);
      console.log('Nom:', admin.name);
      console.log('Email:', admin.email);
      console.log('Rôle:', admin.role);
      console.log('Actif:', admin.active);
      console.log('Créé le:', admin.created_at);
    } else {
      console.log('❌ Aucun utilisateur administrateur trouvé dans la base de données');
    }
    
    // Vérifier la contrainte de vérification sur la colonne role
    const checkConstraintResult = await db.query(`
      SELECT conname, pg_get_constraintdef(oid) as constraint_def
      FROM pg_constraint
      WHERE conrelid = 'users'::regclass AND conname = 'users_role_check'
    `);
    
    if (checkConstraintResult.rows.length > 0) {
      console.log('✅ Contrainte de vérification sur la colonne role:');
      console.log(checkConstraintResult.rows[0].constraint_def);
    } else {
      console.log('❌ Aucune contrainte de vérification trouvée pour la colonne role');
    }
    
    await db.end();
  } catch (err) {
    console.error('❌ Erreur lors de la vérification de l\'utilisateur administrateur:', err);
    process.exit(1);
  }
}

checkAdminUser();
