const axios = require('axios');
require('dotenv').config();

// Fonction pour obtenir un token d'authentification pour une école
async function getSchoolToken() {
  try {
    console.log('Obtention d\'un token d\'authentification pour une école...');
    
    // Identifiants de l'école (à remplacer par des identifiants valides)
    const loginData = {
      email: 'ecole@example.com',
      password: '123456'
    };
    
    const response = await axios.post('http://localhost:3005/api/auth/login', loginData);
    
    if (response.data && response.data.token) {
      console.log('✅ Token obtenu avec succès!');
      return response.data.token;
    } else {
      throw new Error('Impossible d\'obtenir un token');
    }
  } catch (error) {
    console.error('❌ Erreur lors de l\'obtention du token:', error.response?.data || error.message);
    throw error;
  }
}

// Fonction pour tester la création d'un utilisateur avec différents formats de permissions
async function testCreateSchoolUser() {
  try {
    console.log('Test de création d\'utilisateur avec différents formats de permissions');
    
    // Obtenir un token d'authentification
    const token = await getSchoolToken();
    
    // Format de permissions avec des booléens
    const userDataWithBooleanPermissions = {
      name: 'Test Utilisateur 1',
      email: 'test1@example.com',
      password: '123456',
      role: 'censeur',
      permissions: {
        canViewStudents: true,
        canManageFees: false
      }
    };
    
    console.log('\n1. Test avec permissions sous forme d\'objet avec des booléens:');
    console.log('Données envoyées:', userDataWithBooleanPermissions);
    
    try {
      const response1 = await axios.post('http://localhost:3005/api/school-users', userDataWithBooleanPermissions, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      console.log('✅ Succès! Réponse:', response1.data);
    } catch (error) {
      console.error('❌ Erreur:', error.response?.data || error.message);
    }
    
    // Format de permissions avec des tableaux (comme dans SchoolUsers.js)
    const userDataWithArrayPermissions = {
      name: 'Test Utilisateur 2',
      email: 'test2@example.com',
      password: '123456',
      role: 'censeur',
      permissions: {
        classes: ['view', 'create'],
        enrollments: ['view'],
        payments: []
      }
    };
    
    console.log('\n2. Test avec permissions sous forme d\'objet avec des tableaux:');
    console.log('Données envoyées:', userDataWithArrayPermissions);
    
    try {
      const response2 = await axios.post('http://localhost:3005/api/school-users', userDataWithArrayPermissions, {
        headers: {
          'Authorization': `Bearer ${process.env.TEST_SCHOOL_TOKEN}`
        }
      });
      console.log('✅ Succès! Réponse:', response2.data);
    } catch (error) {
      console.error('❌ Erreur:', error.response?.data || error.message);
    }
    
    // Format de permissions vide
    const userDataWithEmptyPermissions = {
      name: 'Test Utilisateur 3',
      email: 'test3@example.com',
      password: '123456',
      role: 'censeur',
      permissions: {}
    };
    
    console.log('\n3. Test avec permissions vides:');
    console.log('Données envoyées:', userDataWithEmptyPermissions);
    
    try {
      const response3 = await axios.post('http://localhost:3005/api/school-users', userDataWithEmptyPermissions, {
        headers: {
          'Authorization': `Bearer ${process.env.TEST_SCHOOL_TOKEN}`
        }
      });
      console.log('✅ Succès! Réponse:', response3.data);
    } catch (error) {
      console.error('❌ Erreur:', error.response?.data || error.message);
    }
    
    // Sans permissions
    const userDataWithoutPermissions = {
      name: 'Test Utilisateur 4',
      email: 'test4@example.com',
      password: '123456',
      role: 'censeur'
    };
    
    console.log('\n4. Test sans permissions:');
    console.log('Données envoyées:', userDataWithoutPermissions);
    
    try {
      const response4 = await axios.post('http://localhost:3005/api/school-users', userDataWithoutPermissions, {
        headers: {
          'Authorization': `Bearer ${process.env.TEST_SCHOOL_TOKEN}`
        }
      });
      console.log('✅ Succès! Réponse:', response4.data);
    } catch (error) {
      console.error('❌ Erreur:', error.response?.data || error.message);
    }
    
  } catch (error) {
    console.error('Erreur générale:', error);
  }
}

// Exécuter le test
testCreateSchoolUser();
