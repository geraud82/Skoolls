const fs = require('fs');
const path = require('path');
const db = require('./config/db');

async function runMigration() {
  try {
    console.log('Connexion à la base de données...');
    await db.query('SELECT NOW()');
    console.log('✅ Connexion à la base de données réussie');
    
    // Lire le fichier SQL
    const sqlFilePath = path.join(__dirname, 'db_migrations', 'update_role_constraint.sql');
    const sqlQuery = fs.readFileSync(sqlFilePath, 'utf8');
    
    console.log('🔄 Mise à jour de la contrainte sur les rôles...');
    
    // Exécuter la requête SQL
    await db.query(sqlQuery);
    
    console.log('✅ Contrainte sur les rôles mise à jour avec succès!');
    
    // Vérifier la nouvelle contrainte
    const result = await db.query(`
      SELECT conname, pg_get_constraintdef(oid) AS constraint_def
      FROM pg_constraint
      WHERE conrelid = 'users'::regclass AND conname = 'users_role_check'
    `);
    
    console.log('\nNouvelle contrainte sur les rôles:');
    result.rows.forEach(row => {
      console.log(`- ${row.conname}: ${row.constraint_def}`);
    });
  } catch (err) {
    console.error('❌ Erreur lors de la migration:', err);
  } finally {
    await db.end();
  }
}

runMigration();
