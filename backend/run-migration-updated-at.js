const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const db = require('./config/db');

async function runMigration() {
  try {
    console.log('Connexion à la base de données...');
    await db.query('SELECT NOW()');
    console.log('✅ Connexion à la base de données réussie');

    console.log('Exécution de la migration pour ajouter updated_at à la table children...');
    
    // Lire le fichier SQL
    const sqlFilePath = path.join(__dirname, 'db_migrations', 'add_updated_at_to_children.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Exécuter le SQL
    await db.query(sqlContent);
    
    console.log('✅ Migration exécutée avec succès');
    console.log('✅ La colonne updated_at a été ajoutée à la table children');
    
    await db.end();
  } catch (err) {
    console.error('❌ Erreur lors de l\'exécution de la migration:', err);
    process.exit(1);
  }
}

runMigration();
