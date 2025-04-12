const axios = require('axios');
require('dotenv').config();

// Configuration
const API_URL = 'http://localhost:5000/api';

// Fonction pour se connecter
async function login() {
  try {
    console.log('Tentative de connexion...');
    
    const loginData = {
      email: 'test@example.com',
      password: 'password123'
    };
    
    const response = await axios.post(`${API_URL}/auth/login`, loginData);
    
    console.log('✅ Connexion réussie');
    console.log(`✅ Token JWT: ${response.data.token}`);
    console.log(`✅ Utilisateur: ${JSON.stringify(response.data.user, null, 2)}`);
    
    return response.data;
  } catch (error) {
    console.error(`❌ Erreur lors de la connexion: ${error.message}`);
    if (error.response) {
      console.error(`❌ Statut: ${error.response.status}`);
      console.error(`❌ Données: ${JSON.stringify(error.response.data, null, 2)}`);
    }
    return null;
  }
}

// Fonction pour tester l'API des rapports
async function testReportsAPI(token) {
  try {
    console.log('Test de l\'API des rapports...');
    
    // Tester les rapports de paiements
    console.log('Test des rapports de paiements...');
    const paymentsResponse = await axios.get(`${API_URL}/reports/payments`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    console.log(`✅ Statut: ${paymentsResponse.status}`);
    console.log(`✅ Données: ${JSON.stringify(paymentsResponse.data, null, 2)}`);
    
    // Tester les rapports d'inscriptions
    console.log('Test des rapports d\'inscriptions...');
    const enrollmentsResponse = await axios.get(`${API_URL}/reports/enrollments`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    console.log(`✅ Statut: ${enrollmentsResponse.status}`);
    console.log(`✅ Données: ${JSON.stringify(enrollmentsResponse.data, null, 2)}`);
    
    // Tester les rapports de classes
    console.log('Test des rapports de classes...');
    const classesResponse = await axios.get(`${API_URL}/reports/classes`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    console.log(`✅ Statut: ${classesResponse.status}`);
    console.log(`✅ Données: ${JSON.stringify(classesResponse.data, null, 2)}`);
    
    return true;
  } catch (error) {
    console.error(`❌ Erreur lors du test de l'API des rapports: ${error.message}`);
    if (error.response) {
      console.error(`❌ Statut: ${error.response.status}`);
      console.error(`❌ Données: ${JSON.stringify(error.response.data, null, 2)}`);
    }
    return false;
  }
}

// Exécuter les fonctions
async function main() {
  console.log('=== Test de l\'API des rapports ===');
  
  // Se connecter
  const loginResult = await login();
  
  if (loginResult && loginResult.token) {
    // Tester l'API des rapports
    await testReportsAPI(loginResult.token);
  }
  
  console.log('=== Fin des tests ===');
}

main();
