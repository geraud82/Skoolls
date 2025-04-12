const axios = require('axios');

// Configuration
const API_URL = 'http://localhost:3004/api';
const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OSwicm9sZSI6ImVjb2xlIiwiaWF0IjoxNzQ0MDYyMzE2LCJleHAiOjE3NDQxNDg3MTZ9.v6Qo_I1oE9acNOolWFPn6ucG0uBKfIORTkK3p2csPlM';

// Fonction pour tester l'inscription
async function testEnrollment() {
  try {
    console.log('Test d\'inscription d\'un enfant...');
    
    const response = await axios.post(
      `${API_URL}/enrollments`,
      {
        child_id: '2',
        class_id: '4'
      },
      {
        headers: {
          Authorization: `Bearer ${TOKEN}`
        }
      }
    );
    
    console.log('✅ Inscription réussie:', response.data);
  } catch (error) {
    console.error('❌ Erreur lors de l\'inscription:', error.message);
    if (error.response) {
      console.error('Détails de l\'erreur:', {
        status: error.response.status,
        data: error.response.data
      });
    }
  }
}

// Exécuter le test
testEnrollment();
