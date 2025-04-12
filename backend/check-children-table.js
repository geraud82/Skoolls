const db = require('./config/db');

async function checkTable() {
  try {
    console.log('Vérification de la structure de la table children...');
    
    const result = await db.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'children'
    `);
    
    console.log('Colonnes de la table children:');
    result.rows.forEach(row => {
      console.log(`- ${row.column_name} (${row.data_type})`);
    });
    
    await db.end();
  } catch (err) {
    console.error('❌ Erreur:', err);
    process.exit(1);
  }
}

checkTable();
