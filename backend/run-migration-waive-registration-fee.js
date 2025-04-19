const db = require('./config/db');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  try {
    console.log('Exécution de la migration pour ajouter le champ waive_registration_fee_for_returning_students...');
    
    // Lire le fichier SQL
    const sqlFilePath = path.join(__dirname, 'db_migrations', 'add_waive_registration_fee_for_returning_students.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Exécuter la requête SQL
    await db.query(sqlContent);
    
    console.log('✅ Migration réussie: Le champ waive_registration_fee_for_returning_students a été ajouté à la table classes');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error);
    process.exit(1);
  }
}

runMigration();
