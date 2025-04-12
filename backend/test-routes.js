const axios = require('axios');
require('dotenv').config();

// Configuration
const API_URL = 'http://localhost:5000/api';

// Fonction pour tester une route sans authentification
async function testRouteWithoutAuth(route) {
  try {
    console.log(`Test de la route sans authentification: ${route}`);
    const response = await axios.get(`${API_URL}${route}`);
    console.log(`✅ Statut: ${response.status}`);
    console.log(`✅ Données: ${JSON.stringify(response.data, null, 2)}`);
    return true;
  } catch (error) {
    console.error(`❌ Erreur: ${error.message}`);
    if (error.response) {
      console.error(`❌ Statut: ${error.response.status}`);
      console.error(`❌ Données: ${JSON.stringify(error.response.data, null, 2)}`);
    }
    return false;
  }
}

// Fonction pour obtenir un token JWT
async function getToken() {
  try {
    console.log('Tentative de connexion pour obtenir un token JWT...');
    const response = await axios.post(`${API_URL}/auth/login`, {
      email: 'admin@example.com',
      password: 'password123'
    });
    
    if (response.data && response.data.token) {
      console.log('✅ Token JWT obtenu avec succès');
      return response.data.token;
    } else {
      console.error('❌ Aucun token dans la réponse');
      return null;
    }
  } catch (error) {
    console.error(`❌ Erreur lors de la connexion: ${error.message}`);
    if (error.response) {
      console.error(`❌ Statut: ${error.response.status}`);
      console.error(`❌ Données: ${JSON.stringify(error.response.data, null, 2)}`);
    }
    return null;
  }
}

// Fonction pour tester une route avec authentification
async function testRouteWithAuth(route, token) {
  try {
    console.log(`Test de la route avec authentification: ${route}`);
    const response = await axios.get(`${API_URL}${route}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    console.log(`✅ Statut: ${response.status}`);
    console.log(`✅ Données: ${JSON.stringify(response.data, null, 2)}`);
    return true;
  } catch (error) {
    console.error(`❌ Erreur: ${error.message}`);
    if (error.response) {
      console.error(`❌ Statut: ${error.response.status}`);
      console.error(`❌ Données: ${JSON.stringify(error.response.data, null, 2)}`);
    }
    return false;
  }
}

// Routes à tester sans authentification
const publicRoutes = [
  '/'
];

// Routes à tester avec authentification
const protectedRoutes = [
  '/invoices',
  '/receipts'
];

// Tester toutes les routes
async function testAllRoutes() {
  console.log('=== Test des routes publiques ===');
  
  for (const route of publicRoutes) {
    await testRouteWithoutAuth(route);
    console.log('-------------------');
  }
  
  console.log('=== Test des routes protégées ===');
  
  // Obtenir un token JWT
  const token = await getToken();
  
  if (token) {
    for (const route of protectedRoutes) {
      await testRouteWithAuth(route, token);
      console.log('-------------------');
    }
  } else {
    console.error('❌ Impossible de tester les routes protégées sans token JWT');
  }
  
  console.log('=== Fin des tests ===');
}

// Exécuter les tests
testAllRoutes();
