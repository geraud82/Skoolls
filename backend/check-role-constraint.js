const db = require('./config/db');

async function checkRoleConstraint() {
  try {
    console.log('Vérification de la connexion à la base de données...');
    await db.query('SELECT NOW()');
    console.log('✅ Connexion à la base de données réussie');
    
    // Vérifier les contraintes sur la table users
    const result = await db.query(`
      SELECT conname, pg_get_constraintdef(oid) AS constraint_def
      FROM pg_constraint
      WHERE conrelid = 'users'::regclass
    `);
    
    console.log('\nContraintes sur la table "users":');
    result.rows.forEach(row => {
      console.log(`- ${row.conname}: ${row.constraint_def}`);
    });
    
    // Vérifier les valeurs autorisées pour la colonne role
    const roleValues = await db.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'users' AND column_name = 'role'
    `);
    
    console.log('\nInformations sur la colonne "role":');
    console.log(roleValues.rows[0]);
  } catch (err) {
    console.error('❌ Erreur:', err);
  } finally {
    await db.end();
  }
}

checkRoleConstraint();
