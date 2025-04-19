const db = require('./config/db');

async function checkUsersTable() {
  try {
    console.log('Vérification de la connexion à la base de données...');
    await db.query('SELECT NOW()');
    console.log('✅ Connexion à la base de données réussie');
    
    const result = await db.query(
      'SELECT column_name, data_type FROM information_schema.columns WHERE table_name = $1',
      ['users']
    );
    
    console.log('\nColonnes de la table "users":');
    result.rows.forEach(row => {
      console.log(`- ${row.column_name} (${row.data_type})`);
    });
  } catch (err) {
    console.error('❌ Erreur:', err);
  } finally {
    await db.end();
  }
}

checkUsersTable();
