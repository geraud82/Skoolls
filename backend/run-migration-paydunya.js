const fs = require('fs');
const path = require('path');
const db = require('./config/db');

async function runMigration() {
  try {
    console.log('Exécution de la migration pour ajouter les champs PayDunya...');
    
    // Lire le fichier SQL
    const sqlFilePath = path.join(__dirname, 'db_migrations', 'add_paydunya_fields.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Exécuter la requête SQL
    await db.query(sqlContent);
    
    console.log('Migration terminée avec succès!');
    
    // Vérifier la structure de la table payments
    const result = await db.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'payments'
      ORDER BY column_name
    `);
    
    console.log('\nStructure actuelle de la table payments:');
    result.rows.forEach(row => {
      console.log(`${row.column_name}: ${row.data_type}`);
    });
    
  } catch (err) {
    console.error('Erreur lors de la migration:', err);
  } finally {
    // Fermer la connexion à la base de données
    await db.end();
  }
}

runMigration();
