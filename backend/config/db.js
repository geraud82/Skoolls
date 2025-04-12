const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// Vérifier que les variables d'environnement sont correctement chargées
console.log('Variables d\'environnement de la base de données:');
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_NAME:', process.env.DB_NAME);
console.log('DB_PORT:', process.env.DB_PORT);
console.log('DB_PASSWORD est défini:', !!process.env.DB_PASSWORD);

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD ? process.env.DB_PASSWORD.replace(/^"(.*)"$/, '$1') : '', // Supprimer les guillemets si présents
  port: process.env.DB_PORT,
});

pool.connect()
  .then(() => {
    console.log('✅ Connected to PostgreSQL database');
  })
  .catch((err) => {
    console.error('❌ Failed to connect to database:', err);
  });

module.exports = pool;
