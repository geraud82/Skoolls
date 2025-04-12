const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

// Fonction pour afficher les tables de la base de données
async function listTables() {
  try {
    const response = await axios.get(`${API_URL}/test/db-tables`);
    console.log('Tables de la base de données:');
    console.log(response.data.tables);
    return response.data.tables;
  } catch (error) {
    console.error('Erreur lors de la récupération des tables:', error.response?.data || error.message);
    return [];
  }
}

// Fonction pour afficher la structure d'une table
async function showTableStructure(tableName) {
  try {
    const response = await axios.get(`${API_URL}/test/table-structure/${tableName}`);
    console.log(`Structure de la table ${tableName}:`);
    console.log(response.data.columns);
    return response.data.columns;
  } catch (error) {
    console.error(`Erreur lors de la récupération de la structure de la table ${tableName}:`, error.response?.data || error.message);
    return [];
  }
}

// Fonction pour créer une classe de test
async function createTestClass(id, school_id) {
  try {
    const response = await axios.post(`${API_URL}/test/create-test-class`, {
      id,
      school_id,
      name: `Classe de test ${id}`,
      tuition_fee: 100
    });
    console.log('Classe de test créée:');
    console.log(response.data);
    return response.data.class;
  } catch (error) {
    console.error('Erreur lors de la création de la classe de test:', error.response?.data || error.message);
    return null;
  }
}

// Fonction pour lister toutes les classes
async function listAllClasses() {
  try {
    const response = await axios.get(`${API_URL}/classes/all`);
    console.log('Toutes les classes:');
    console.log(response.data);
    return response.data;
  } catch (error) {
    console.error('Erreur lors de la récupération des classes:', error.response?.data || error.message);
    return [];
  }
}

// Fonction pour obtenir une classe par son ID
async function getClassById(id) {
  try {
    const response = await axios.get(`${API_URL}/classes/${id}`);
    console.log(`Classe avec ID ${id}:`);
    console.log(response.data);
    return response.data;
  } catch (error) {
    console.error(`Erreur lors de la récupération de la classe avec ID ${id}:`, error.response?.data || error.message);
    return null;
  }
}

// Fonction pour inscrire un enfant à une classe
async function enrollChild(token, child_id, class_id) {
  try {
    const response = await axios.post(
      `${API_URL}/enrollments`,
      { child_id, class_id },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    console.log('Inscription réussie:');
    console.log(response.data);
    return response.data;
  } catch (error) {
    console.error('Erreur lors de l\'inscription:', error.response?.data || error.message);
    return null;
  }
}

// Fonction pour lister les inscriptions d'une école
async function listSchoolEnrollments(token) {
  try {
    const response = await axios.get(
      `${API_URL}/enrollments/school`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    console.log('Inscriptions de l\'école:');
    console.log(response.data);
    return response.data;
  } catch (error) {
    console.error('Erreur lors de la récupération des inscriptions:', error.response?.data || error.message);
    return [];
  }
}

// Fonction pour valider une inscription
async function validateEnrollment(token, enrollment_id, action) {
  try {
    const response = await axios.post(
      `${API_URL}/enrollments/validate`,
      { enrollment_id, action },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    console.log(`Inscription ${action === 'approve' ? 'validée' : 'rejetée'}:`);
    console.log(response.data);
    return response.data;
  } catch (error) {
    console.error('Erreur lors de la validation de l\'inscription:', error.response?.data || error.message);
    return null;
  }
}

// Fonction pour marquer une inscription comme payée (côté école)
async function markEnrollmentAsPaid(token, enrollment_id) {
  try {
    const response = await axios.post(
      `${API_URL}/enrollments/payment`,
      { enrollment_id },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    console.log('Paiement enregistré (côté école):');
    console.log(response.data);
    return response.data;
  } catch (error) {
    console.error('Erreur lors de l\'enregistrement du paiement:', error.response?.data || error.message);
    return null;
  }
}

// Fonction pour effectuer un paiement (côté parent)
async function payTuition(token, enrollment_id, amount, method) {
  try {
    const response = await axios.post(
      `${API_URL}/payments`,
      { enrollment_id, amount, method },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    console.log('Paiement effectué (côté parent):');
    console.log(response.data);
    return response.data;
  } catch (error) {
    console.error('Erreur lors du paiement:', error.response?.data || error.message);
    return null;
  }
}

// Fonction pour lister les paiements (côté parent)
async function listPayments(token) {
  try {
    const response = await axios.get(
      `${API_URL}/payments`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    console.log('Paiements du parent:');
    console.log(response.data);
    return response.data;
  } catch (error) {
    console.error('Erreur lors de la récupération des paiements:', error.response?.data || error.message);
    return [];
  }
}

// Fonction pour lister les paiements (côté école)
async function listSchoolPayments(token) {
  try {
    const response = await axios.get(
      `${API_URL}/payments/school`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    console.log('Paiements de l\'école:');
    console.log(response.data);
    return response.data;
  } catch (error) {
    console.error('Erreur lors de la récupération des paiements de l\'école:', error.response?.data || error.message);
    return [];
  }
}

// Fonction pour se connecter et obtenir un token
async function login(email, password) {
  try {
    const response = await axios.post(`${API_URL}/auth/login`, {
      email,
      password
    });
    console.log('Connexion réussie:');
    console.log(`Token: ${response.data.token}`);
    return response.data.token;
  } catch (error) {
    console.error('Erreur lors de la connexion:', error.response?.data || error.message);
    return null;
  }
}

// Fonction principale pour exécuter les tests
async function runTests() {
  console.log('=== Démarrage des tests ===');
  
  // 1. Lister les tables
  const tables = await listTables();
  
  // 2. Vérifier la structure des tables importantes
  if (tables.includes('classes')) {
    await showTableStructure('classes');
  } else {
    console.error('La table "classes" n\'existe pas!');
    return;
  }
  
  if (tables.includes('enrollments')) {
    await showTableStructure('enrollments');
  } else {
    console.error('La table "enrollments" n\'existe pas!');
    return;
  }
  
  // 3. Lister toutes les classes existantes
  const existingClasses = await listAllClasses();
  
  // 4. Vérifier si la classe avec ID 2 existe
  const classWithId2 = await getClassById(2);
  
  // 5. Si la classe n'existe pas, la créer
  if (!classWithId2) {
    console.log('La classe avec ID 2 n\'existe pas, création en cours...');
    // Utiliser l'ID 1 comme school_id par défaut (ajuster si nécessaire)
    await createTestClass(2, 1);
    
    // Vérifier à nouveau
    await getClassById(2);
  }
  
  console.log('=== Tests terminés ===');
  console.log('Pour tester les nouvelles fonctionnalités:');
  console.log('\n=== Côté École ===');
  console.log('1. Connectez-vous en tant qu\'école avec: login("ecole@example.com", "password")');
  console.log('2. Utilisez le token pour lister les inscriptions: listSchoolEnrollments(token)');
  console.log('3. Validez une inscription: validateEnrollment(token, enrollment_id, "approve")');
  console.log('4. Marquez une inscription comme payée: markEnrollmentAsPaid(token, enrollment_id)');
  console.log('5. Listez les paiements reçus: listSchoolPayments(token)');
  
  console.log('\n=== Côté Parent ===');
  console.log('1. Connectez-vous en tant que parent avec: login("parent@example.com", "password")');
  console.log('2. Effectuez un paiement: payTuition(token, enrollment_id, amount, "mobile_money")');
  console.log('3. Listez vos paiements: listPayments(token)');
  
  console.log('\n=== Flux complet ===');
  console.log('1. École: Valider une inscription');
  console.log('2. Parent: Effectuer un paiement pour l\'inscription validée');
  console.log('3. École: Vérifier que le paiement a été reçu');
}

// Exécuter les tests
runTests().catch(console.error);
