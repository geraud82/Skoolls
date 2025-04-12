const axios = require('axios');
require('dotenv').config();

// Configuration
const API_URL = 'http://localhost:5000/api';

// Fonction pour enregistrer un nouvel utilisateur
async function registerUser() {
  try {
    console.log('Tentative d\'enregistrement d\'un nouvel utilisateur...');
    
    const userData = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      role: 'ecole' // ou 'parent'
    };
    
    const response = await axios.post(`${API_URL}/auth/register`, userData);
    
    console.log('✅ Utilisateur enregistré avec succès');
    console.log(`✅ Données: ${JSON.stringify(response.data, null, 2)}`);
    
    return response.data;
  } catch (error) {
    console.error(`❌ Erreur lors de l'enregistrement: ${error.message}`);
    if (error.response) {
      console.error(`❌ Statut: ${error.response.status}`);
      console.error(`❌ Données: ${JSON.stringify(error.response.data, null, 2)}`);
    }
    return null;
  }
}

// Fonction pour se connecter avec l'utilisateur enregistré
async function loginUser() {
  try {
    console.log('Tentative de connexion avec l\'utilisateur enregistré...');
    
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

// Exécuter les fonctions
async function main() {
  console.log('=== Enregistrement et connexion d\'un utilisateur de test ===');
  
  // Enregistrer un nouvel utilisateur
  const registrationResult = await registerUser();
  
  if (registrationResult) {
    // Se connecter avec l'utilisateur enregistré
    const loginResult = await loginUser();
    
    if (loginResult && loginResult.token) {
      console.log('=== Test des routes protégées ===');
      
      // Tester la route /invoices
      try {
        console.log('Test de la route /invoices...');
        const invoicesResponse = await axios.get(`${API_URL}/invoices`, {
          headers: {
            Authorization: `Bearer ${loginResult.token}`
          }
        });
        console.log(`✅ Statut: ${invoicesResponse.status}`);
        console.log(`✅ Données: ${JSON.stringify(invoicesResponse.data, null, 2)}`);
      } catch (error) {
        console.error(`❌ Erreur lors du test de /invoices: ${error.message}`);
        if (error.response) {
          console.error(`❌ Statut: ${error.response.status}`);
          console.error(`❌ Données: ${JSON.stringify(error.response.data, null, 2)}`);
        }
      }
      
      // Tester la route /receipts
      try {
        console.log('Test de la route /receipts...');
        const receiptsResponse = await axios.get(`${API_URL}/receipts`, {
          headers: {
            Authorization: `Bearer ${loginResult.token}`
          }
        });
        console.log(`✅ Statut: ${receiptsResponse.status}`);
        console.log(`✅ Données: ${JSON.stringify(receiptsResponse.data, null, 2)}`);
      } catch (error) {
        console.error(`❌ Erreur lors du test de /receipts: ${error.message}`);
        if (error.response) {
          console.error(`❌ Statut: ${error.response.status}`);
          console.error(`❌ Données: ${JSON.stringify(error.response.data, null, 2)}`);
        }
      }
    }
  }
  
  console.log('=== Fin des tests ===');
}

main();
