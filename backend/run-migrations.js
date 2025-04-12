const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function runMigrations() {
  try {
    // Créer une connexion à la base de données
    const pool = new Pool({
      user: process.env.DB_USER,
      host: process.env.DB_HOST,
      database: process.env.DB_NAME,
      password: process.env.DB_PASSWORD,
      port: process.env.DB_PORT,
    });

    console.log('Connexion à la base de données...');
    await pool.connect();
    console.log('✅ Connexion à la base de données réussie');

    // Lire et exécuter les fichiers SQL
    const migrationFiles = [
      'add_documents_tables.sql',
      'add_profile_picture.sql',
      'add_enrollment_documents_tables.sql',
      'add_active_field_and_admin_user.sql'
    ];

    console.log('Exécution des migrations...');
    
    for (const file of migrationFiles) {
      console.log(`Exécution de la migration: ${file}`);
      const sqlFilePath = path.join(__dirname, 'db_migrations', file);
      const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
      
      // Exécuter le script SQL
      await pool.query(sqlContent);
      console.log(`✅ Migration ${file} exécutée avec succès`);
    }
    
    console.log('✅ Migrations exécutées avec succès');
    
    // Fermer la connexion
    await pool.end();
    console.log('Connexion à la base de données fermée');
  } catch (err) {
    console.error('❌ Erreur lors de l\'exécution des migrations:', err);
    process.exit(1);
  }
}

runMigrations();
