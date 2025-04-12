const db = require('./config/db');

async function checkTables() {
  try {
    // Vérifier si la connexion à la base de données fonctionne
    console.log('Vérification de la connexion à la base de données...');
    await db.query('SELECT NOW()');
    console.log('✅ Connexion à la base de données réussie');

    // Vérifier si les tables existent
    console.log('\nVérification des tables...');
    
    // Liste des tables à vérifier
    const tables = [
      'users',
      'schools',
      'classes',
      'children',
      'enrollments',
      'payments',
      'invoices',
      'receipts'
    ];
    
    for (const table of tables) {
      try {
        const result = await db.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = $1
          )
        `, [table]);
        
        const exists = result.rows[0].exists;
        console.log(`Table "${table}": ${exists ? '✅ Existe' : '❌ N\'existe pas'}`);
      } catch (err) {
        console.error(`Erreur lors de la vérification de la table "${table}":`, err.message);
      }
    }
    
    // Vérifier les colonnes des tables invoices et receipts si elles existent
    const tablesToCheck = ['invoices', 'receipts'];
    
    for (const table of tablesToCheck) {
      try {
        const result = await db.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = $1
          )
        `, [table]);
        
        if (result.rows[0].exists) {
          console.log(`\nColonnes de la table "${table}":`);
          
          const columns = await db.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = $1
          `, [table]);
          
          columns.rows.forEach(column => {
            console.log(`- ${column.column_name} (${column.data_type})`);
          });
        }
      } catch (err) {
        console.error(`Erreur lors de la vérification des colonnes de la table "${table}":`, err.message);
      }
    }
    
    // Fermer la connexion
    await db.end();
    console.log('\nVérification terminée');
  } catch (err) {
    console.error('Erreur:', err);
    process.exit(1);
  }
}

checkTables();
