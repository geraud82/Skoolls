const axios = require('axios');

// Configuration
const API_URL = 'http://localhost:3005/api';

// Fonction pour tester l'ajout d'un enfant
async function testAddChild() {
  try {
    console.log('Test d\'ajout d\'un enfant...');
    
    // Créer un utilisateur de test (parent) avec un email unique
    const timestamp = new Date().getTime();
    const uniqueEmail = `test${timestamp}@example.com`;
    console.log(`Création d'un utilisateur de test avec l'email: ${uniqueEmail}...`);
    
    const registerResponse = await axios.post(`${API_URL}/auth/register`, {
      name: 'Parent Test',
      email: uniqueEmail,
      password: 'password123',
      role: 'parent'
    });
    
    console.log('✅ Utilisateur créé avec succès');
    console.log('Réponse complète:', JSON.stringify(registerResponse.data, null, 2));
    
    // Essayer de se connecter avec les identifiants créés
    console.log('Connexion avec les identifiants créés...');
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      email: uniqueEmail,
      password: 'password123'
    });
    
    console.log('✅ Connexion réussie');
    console.log('Réponse de connexion:', JSON.stringify(loginResponse.data, null, 2));
    
    const token = loginResponse.data.token;
    console.log('Token:', token);
    
    // Ajouter un enfant
    console.log('Ajout d\'un enfant...');
    const childResponse = await axios.post(
      `${API_URL}/children`,
      {
        first_name: 'Test',
        last_name: 'Enfant',
        birth_date: '2020-01-01'
      },
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );
    
    console.log('✅ Enfant ajouté avec succès:', childResponse.data);
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    if (error.response) {
      console.error('Détails de l\'erreur:', {
        status: error.response.status,
        data: error.response.data
      });
    } else if (error.request) {
      console.error('Pas de réponse reçue:', error.request);
    } else {
      console.error('Erreur de configuration de la requête:', error.config);
    }
    console.error('Stack trace:', error.stack);
  }
}

// Exécuter le test
testAddChild();
