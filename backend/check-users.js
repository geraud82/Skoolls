const db = require('./config/db');

async function checkUsers() {
  try {
    console.log('Connexion à la base de données...');
    
    // Récupérer tous les utilisateurs
    const users = await db.query('SELECT id, name, email, role FROM users');
    
    console.log(`\n📊 Nombre d'utilisateurs: ${users.rows.length}`);
    
    if (users.rows.length === 0) {
      console.log('❌ Aucun utilisateur trouvé');
      return;
    }
    
    console.log('\nListe des utilisateurs:');
    users.rows.forEach((user, index) => {
      console.log(`\nUtilisateur ${index + 1}:`);
      console.log(`- ID: ${user.id}`);
      console.log(`- Nom: ${user.name}`);
      console.log(`- Email: ${user.email}`);
      console.log(`- Rôle: ${user.role}`);
    });
    
    // Récupérer les utilisateurs avec le rôle 'ecole'
    const schoolUsers = await db.query('SELECT id, name, email FROM users WHERE role = $1', ['ecole']);
    
    console.log(`\n📊 Nombre d'utilisateurs avec le rôle 'ecole': ${schoolUsers.rows.length}`);
    
    if (schoolUsers.rows.length === 0) {
      console.log('❌ Aucun utilisateur avec le rôle "ecole" trouvé');
    } else {
      console.log('\nListe des utilisateurs avec le rôle "ecole":');
      schoolUsers.rows.forEach((user, index) => {
        console.log(`\nÉcole ${index + 1}:`);
        console.log(`- ID: ${user.id}`);
        console.log(`- Nom: ${user.name}`);
        console.log(`- Email: ${user.email}`);
      });
    }
    
    await db.end();
  } catch (err) {
    console.error('❌ Erreur lors de la vérification des utilisateurs:', err);
    process.exit(1);
  }
}

checkUsers();
