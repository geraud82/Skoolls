const fs = require('fs');
const path = require('path');
const db = require('./config/db');

async function runMigration() {
  try {
    console.log('Connexion à la base de données...');
    await db.query('SELECT NOW()');
    console.log('✅ Connexion à la base de données réussie');

    console.log('🔄 Début de la migration pour les utilisateurs d\'école...');
    
    // Lire le fichier SQL
    const sqlFilePath = path.join(__dirname, 'db_migrations', 'add_school_users_fields.sql');
    const sqlQuery = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Exécuter la requête SQL
    await db.query(sqlQuery);
    
    console.log('✅ Migration pour les utilisateurs d\'école terminée avec succès!');
    
    await db.end();
  } catch (err) {
    console.error('❌ Erreur lors de la migration:', err);
    process.exit(1);
  }
}

runMigration();
