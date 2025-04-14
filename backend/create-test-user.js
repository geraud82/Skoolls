const db = require('./config/db');
const bcrypt = require('bcrypt');

async function createTestUser() {
  try {
    console.log('Connexion à la base de données...');
    await db.query('SELECT NOW()');
    console.log('✅ Connexion à la base de données réussie');

    console.log('Création d\'un utilisateur de test...');

    // Vérifier si l'utilisateur existe déjà
    const userCheck = await db.query('SELECT * FROM users WHERE email = $1', ['parent@test.com']);
    
    if (userCheck.rows.length > 0) {
      console.log('✅ L\'utilisateur de test existe déjà');
      const userId = userCheck.rows[0].id;
      
      // Vérifier si l'utilisateur a des enfants
      const childrenCheck = await db.query('SELECT * FROM children WHERE user_id = $1', [userId]);
      
      if (childrenCheck.rows.length === 0) {
        console.log('Ajout d\'enfants pour l\'utilisateur de test...');
        
        // Ajouter des enfants
        await db.query(
          'INSERT INTO children (user_id, first_name, last_name, birth_date) VALUES ($1, $2, $3, $4)',
          [userId, 'Emma', 'Dupont', '2015-05-15']
        );
        
        await db.query(
          'INSERT INTO children (user_id, first_name, last_name, birth_date) VALUES ($1, $2, $3, $4)',
          [userId, 'Lucas', 'Dupont', '2017-08-22']
        );
        
        console.log('✅ Enfants ajoutés avec succès');
      } else {
        console.log('✅ L\'utilisateur a déjà des enfants');
      }
    } else {
      // Créer l'utilisateur
      const hashedPassword = await bcrypt.hash('password123', 10);
      
      const userResult = await db.query(
        'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id',
        ['Parent Test', 'parent@test.com', hashedPassword, 'parent']
      );
      
      const userId = userResult.rows[0].id;
      console.log('✅ Utilisateur de test créé avec succès');
      
      // Ajouter des enfants
      await db.query(
        'INSERT INTO children (user_id, first_name, last_name, birth_date) VALUES ($1, $2, $3, $4)',
        [userId, 'Emma', 'Dupont', '2015-05-15']
      );
      
      await db.query(
        'INSERT INTO children (user_id, first_name, last_name, birth_date) VALUES ($1, $2, $3, $4)',
        [userId, 'Lucas', 'Dupont', '2017-08-22']
      );
      
      console.log('✅ Enfants ajoutés avec succès');
    }

    console.log('\nInformations de connexion:');
    console.log('Email: parent@test.com');
    console.log('Mot de passe: password123');

    await db.end();
    console.log('\nTerminé');
  } catch (err) {
    console.error('❌ Erreur:', err);
    process.exit(1);
  }
}

createTestUser();
