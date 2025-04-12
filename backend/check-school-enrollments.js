const db = require('./config/db');

async function checkSchoolEnrollments() {
  try {
    console.log('Vérification des inscriptions pour les écoles...');
    
    // 1. Vérifier les utilisateurs avec le rôle 'ecole'
    const schoolUsers = await db.query(`
      SELECT id, name, email 
      FROM users 
      WHERE role = 'ecole'
    `);
    
    console.log(`\n📊 Utilisateurs avec le rôle 'ecole': ${schoolUsers.rows.length}`);
    
    if (schoolUsers.rows.length === 0) {
      console.log('❌ Aucun utilisateur avec le rôle "ecole" trouvé.');
      return;
    }
    
    // Pour chaque école, vérifier les classes associées
    for (const school of schoolUsers.rows) {
      console.log(`\n🏫 École: ${school.name} (ID: ${school.id})`);
      
      // 2. Vérifier les classes associées à cette école
      const classes = await db.query(`
        SELECT id, name 
        FROM classes 
        WHERE school_id = $1
      `, [school.id]);
      
      console.log(`📚 Classes associées: ${classes.rows.length}`);
      
      if (classes.rows.length === 0) {
        console.log('❌ Aucune classe associée à cette école.');
        continue;
      }
      
      // Récupérer les IDs des classes
      const classIds = classes.rows.map(c => c.id);
      
      // 3. Vérifier les inscriptions pour ces classes
      const enrollments = await db.query(`
        SELECT e.id, e.child_id, e.class_id, e.status, 
               c.name AS class_name,
               CONCAT(ch.first_name, ' ', ch.last_name) AS child_name
        FROM enrollments e
        JOIN classes c ON e.class_id = c.id
        JOIN children ch ON e.child_id = ch.id
        WHERE e.class_id = ANY($1)
      `, [classIds]);
      
      console.log(`📝 Inscriptions trouvées: ${enrollments.rows.length}`);
      
      if (enrollments.rows.length === 0) {
        console.log('❌ Aucune inscription trouvée pour les classes de cette école.');
      } else {
        // Afficher quelques détails sur les inscriptions
        console.log('\nDétails des inscriptions:');
        enrollments.rows.forEach(e => {
          console.log(`- ID: ${e.id}, Enfant: ${e.child_name}, Classe: ${e.class_name}, Statut: ${e.status}`);
        });
      }
      
      // 4. Tester directement la requête utilisée dans getEnrollmentsBySchool
      console.log('\n🔍 Test de la requête utilisée dans getEnrollmentsBySchool:');
      const testQuery = await db.query(`
        SELECT e.id, 
               c.first_name, 
               c.last_name, 
               CONCAT(c.first_name, ' ', c.last_name) AS child_name,
               u.name AS parent_name,
               cl.name AS class_name, 
               cl.tuition_fee, 
               e.status, 
               e.created_at
        FROM enrollments e
        JOIN children c ON e.child_id = c.id
        JOIN classes cl ON e.class_id = cl.id
        JOIN users u ON c.user_id = u.id
        WHERE cl.school_id = $1
        ORDER BY e.created_at DESC
      `, [school.id]);
      
      console.log(`📊 Résultats de la requête: ${testQuery.rows.length}`);
      
      if (testQuery.rows.length === 0) {
        console.log('❌ La requête ne retourne aucun résultat.');
      } else {
        console.log('✅ La requête retourne des résultats.');
      }
    }
    
    await db.end();
  } catch (err) {
    console.error('❌ Erreur lors de la vérification des inscriptions:', err);
    process.exit(1);
  }
}

checkSchoolEnrollments();
