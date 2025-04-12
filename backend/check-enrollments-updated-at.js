const db = require('./config/db');

async function checkEnrollmentsUpdatedAt() {
  try {
    console.log('Vérification de la colonne updated_at dans la table enrollments...');
    
    // Vérifier si la colonne updated_at existe
    const columnCheck = await db.query(`
      SELECT column_name, data_type, column_default, is_nullable
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'enrollments'
      AND column_name = 'updated_at'
    `);
    
    if (columnCheck.rows.length === 0) {
      console.log('❌ La colonne updated_at n\'existe pas dans la table enrollments');
      
      // Ajouter la colonne updated_at si elle n'existe pas
      console.log('Ajout de la colonne updated_at à la table enrollments...');
      await db.query(`
        ALTER TABLE enrollments 
        ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      `);
      
      // Mettre à jour la colonne updated_at pour les enregistrements existants
      console.log('Mise à jour de la colonne updated_at pour les enregistrements existants...');
      await db.query(`
        UPDATE enrollments 
        SET updated_at = created_at 
        WHERE updated_at IS NULL
      `);
      
      console.log('✅ Colonne updated_at ajoutée et mise à jour avec succès');
    } else {
      console.log('✅ La colonne updated_at existe dans la table enrollments');
      console.log('Détails de la colonne:');
      console.log(columnCheck.rows[0]);
      
      // Vérifier si des enregistrements ont updated_at NULL
      const nullCheck = await db.query(`
        SELECT COUNT(*) 
        FROM enrollments 
        WHERE updated_at IS NULL
      `);
      
      const nullCount = parseInt(nullCheck.rows[0].count);
      if (nullCount > 0) {
        console.log(`❌ ${nullCount} enregistrements ont updated_at NULL`);
        
        // Mettre à jour la colonne updated_at pour les enregistrements avec NULL
        console.log('Mise à jour de la colonne updated_at pour les enregistrements avec NULL...');
        await db.query(`
          UPDATE enrollments 
          SET updated_at = created_at 
          WHERE updated_at IS NULL
        `);
        
        console.log('✅ Colonne updated_at mise à jour avec succès');
      } else {
        console.log('✅ Tous les enregistrements ont une valeur pour updated_at');
      }
    }
    
    // Vérifier quelques enregistrements
    console.log('\nExemples d\'enregistrements:');
    const samples = await db.query(`
      SELECT id, child_id, class_id, status, created_at, updated_at
      FROM enrollments
      LIMIT 5
    `);
    
    samples.rows.forEach((row, index) => {
      console.log(`\nEnregistrement ${index + 1}:`);
      console.log(row);
    });
    
    await db.end();
  } catch (err) {
    console.error('❌ Erreur:', err);
    process.exit(1);
  }
}

checkEnrollmentsUpdatedAt();
