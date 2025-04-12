const db = require('./config/db');

async function checkEnrollmentsTable() {
  try {
    console.log('Vérification de la structure de la table enrollments...');
    
    const columns = await db.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'enrollments'
    `);
    
    columns.rows.forEach(column => {
      console.log(`- ${column.column_name} (${column.data_type})`);
    });
    
    await db.end();
  } catch (err) {
    console.error('Erreur:', err);
    process.exit(1);
  }
}

checkEnrollmentsTable();
