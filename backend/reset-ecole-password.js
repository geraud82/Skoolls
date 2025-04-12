const db = require('./config/db');
const bcrypt = require('bcrypt');

async function resetPassword() {
  try {
    console.log('Connexion à la base de données...');
    
    // Vérifier si l'utilisateur école existe
    const userCheck = await db.query(
      'SELECT * FROM users WHERE email = $1 AND role = $2',
      ['ton@mail.com', 'ecole']
    );
    
    if (userCheck.rows.length === 0) {
      console.log('❌ Utilisateur école non trouvé');
      return;
    }
    
    console.log('✅ Utilisateur école trouvé:', userCheck.rows[0]);
    
    // Nouveau mot de passe
    const newPassword = 'ecole123';
    
    // Hacher le nouveau mot de passe
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
    
    // Mettre à jour le mot de passe
    await db.query(
      'UPDATE users SET password = $1 WHERE email = $2',
      [hashedPassword, 'ton@mail.com']
    );
    
    console.log(`✅ Mot de passe mis à jour avec succès pour l'utilisateur école`);
    console.log(`✅ Nouveau mot de passe: "${newPassword}"`);
    
    await db.end();
  } catch (err) {
    console.error('❌ Erreur lors de la réinitialisation du mot de passe:', err);
    process.exit(1);
  }
}

resetPassword();
