const fs = require('fs');
const path = require('path');
const db = require('./config/db');

async function runMigration() {
  try {
    console.log('Connexion à la base de données...');
    await db.query('SELECT NOW()');
    console.log('✅ Connexion à la base de données réussie');

    console.log('Exécution de la migration pour ajouter les champs de contact...');
    
    // Lire le fichier SQL
    const sqlFilePath = path.join(__dirname, 'db_migrations', 'add_contact_fields_to_users.sql');
    const sqlQuery = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Exécuter la requête SQL
    await db.query(sqlQuery);
    
    console.log('✅ Migration exécutée avec succès');
    console.log('✅ Champs de contact ajoutés à la table users');
    
    await db.end();
  } catch (err) {
    console.error('❌ Erreur lors de l\'exécution de la migration:', err);
    process.exit(1);
  }
}

runMigration();
