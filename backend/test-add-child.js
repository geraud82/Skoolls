const axios = require('axios');

// Configuration
const API_URL = 'http://localhost:3005/api';

// Fonction pour se connecter et obtenir un token
async function login(email, password) {
  try {
    console.log(`Tentative de connexion avec ${email}...`);
    
    const response = await axios.post(`${API_URL}/auth/login`, {
      email,
      password
    });
    
    console.log('✅ Connexion réussie');
    return response.data.token;
  } catch (error) {
    console.error('❌ Erreur lors de la connexion:', error.message);
    if (error.response) {
      console.error('Détails de l\'erreur:', {
        status: error.response.status,
        data: error.response.data
      });
    }
    return null;
  }
}

// Fonction pour tester l'ajout d'un enfant
async function testAddChild(token) {
  if (!token) {
    console.error('❌ Impossible de tester l\'ajout d\'enfant: pas de token');
    return;
  }
  
  try {
    console.log('Test d\'ajout d\'un enfant...');
    
    const response = await axios.post(
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
    
    console.log('✅ Ajout d\'enfant réussi:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Erreur lors de l\'ajout de l\'enfant:', error.message);
    if (error.response) {
      console.error('Détails de l\'erreur:', {
        status: error.response.status,
        data: error.response.data
      });
    }
    return null;
  }
}

// Fonction principale
async function main() {
  // Se connecter en tant que parent
  const token = await login('parent@test.com', 'password123');
  
  // Tester l'ajout d'un enfant
  if (token) {
    await testAddChild(token);
  }
}

// Exécuter le test
main().catch(console.error);
