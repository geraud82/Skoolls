const db = require('./config/db');

async function createTables() {
  try {
    console.log('Connexion à la base de données...');
    await db.query('SELECT NOW()');
    console.log('✅ Connexion à la base de données réussie');

    console.log('Création des tables de base si elles n\'existent pas...');

    // Création de la table users si elle n'existe pas
    await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) NOT NULL UNIQUE,
        password VARCHAR(100) NOT NULL,
        role VARCHAR(20) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        profile_picture VARCHAR(255)
      );
    `);
    console.log('✅ Table users créée ou déjà existante');

    // Création de la table schools si elle n'existe pas
    await db.query(`
      CREATE TABLE IF NOT EXISTS schools (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        name VARCHAR(100) NOT NULL,
        location VARCHAR(100),
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Table schools créée ou déjà existante');

    // Création de la table classes si elle n'existe pas
    await db.query(`
      CREATE TABLE IF NOT EXISTS classes (
        id SERIAL PRIMARY KEY,
        school_id INTEGER REFERENCES users(id),
        name VARCHAR(100) NOT NULL,
        description TEXT,
        tuition_fee DECIMAL(10, 2),
        available_seats INTEGER,
        teacher_name VARCHAR(100),
        schedule TEXT,
        age_group VARCHAR(20),
        start_date DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Table classes créée ou déjà existante');

    // Création de la table children si elle n'existe pas
    await db.query(`
      CREATE TABLE IF NOT EXISTS children (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        birth_date DATE,
        gender CHAR(1),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Table children créée ou déjà existante');

    // Création de la table enrollments si elle n'existe pas
    await db.query(`
      CREATE TABLE IF NOT EXISTS enrollments (
        id SERIAL PRIMARY KEY,
        child_id INTEGER REFERENCES children(id),
        class_id INTEGER REFERENCES classes(id),
        status VARCHAR(20) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Table enrollments créée ou déjà existante');

    // Création de la table payments si elle n'existe pas
    await db.query(`
      CREATE TABLE IF NOT EXISTS payments (
        id SERIAL PRIMARY KEY,
        enrollment_id INTEGER REFERENCES enrollments(id),
        amount DECIMAL(10, 2) NOT NULL,
        method VARCHAR(50) NOT NULL,
        status VARCHAR(20) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Table payments créée ou déjà existante');

    // Création de la table notifications si elle n'existe pas
    await db.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        title VARCHAR(100) NOT NULL,
        message TEXT NOT NULL,
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Table notifications créée ou déjà existante');

    console.log('✅ Toutes les tables ont été créées ou existaient déjà');

    // Vérifier si des écoles existent, sinon en créer une pour les tests
    const schoolsResult = await db.query('SELECT COUNT(*) FROM users WHERE role = $1', ['ecole']);
    if (parseInt(schoolsResult.rows[0].count) === 0) {
      console.log('Aucune école trouvée, création d\'une école de test...');
      
      // Créer un utilisateur école
      const schoolUserResult = await db.query(
        'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id',
        ['École Test', 'ecole@test.com', '$2b$10$X7o4.KTbCOPYnOXj3DXkK.3NkSOqQf4Vl0vVZYwqPoPb9kGp2Qpou', 'ecole']
      );
      
      const schoolUserId = schoolUserResult.rows[0].id;
      
      // Créer des classes pour cette école
      await db.query(
        'INSERT INTO classes (school_id, name, tuition_fee, available_seats) VALUES ($1, $2, $3, $4)',
        [schoolUserId, 'CP', 50000, 20]
      );
      
      await db.query(
        'INSERT INTO classes (school_id, name, tuition_fee, available_seats) VALUES ($1, $2, $3, $4)',
        [schoolUserId, 'CE1', 55000, 15]
      );
      
      console.log('✅ École de test et classes créées avec succès');
    }

    console.log('✅ Initialisation de la base de données terminée');
    await db.end();
  } catch (err) {
    console.error('❌ Erreur lors de la création des tables:', err);
    process.exit(1);
  }
}

createTables();
