const axios = require('axios');
const jwt = require('jsonwebtoken');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

// Vérifier que les variables d'environnement sont correctement chargées
console.log('JWT_SECRET est défini:', !!process.env.JWT_SECRET);

// Fonction pour créer un token JWT pour un utilisateur école
const createSchoolToken = (schoolId) => {
  return jwt.sign(
    { id: schoolId, role: 'ecole' },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
};

// Fonction pour tester la route /enrollments/school
async function testSchoolEnrollments() {
  try {
    console.log('Test de la route /enrollments/school...');
    
    // Créer un token pour l'école avec ID 2 (École Dev)
    const schoolId = 2; // ID de l'école qui a des inscriptions
    const token = createSchoolToken(schoolId);
    
    console.log(`Token créé pour l'école avec ID ${schoolId}`);
    
    // Faire une requête à la route /enrollments/school
    const response = await axios.get('http://localhost:3005/api/enrollments/school', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    console.log('✅ Réponse reçue avec succès');
    console.log(`📊 Nombre d'inscriptions: ${response.data.length}`);
    
    // Afficher les détails des inscriptions
    if (response.data.length > 0) {
      console.log('\nDétails des inscriptions:');
      response.data.forEach((enrollment, index) => {
        console.log(`\nInscription ${index + 1}:`);
        console.log('Propriétés disponibles:', Object.keys(enrollment).join(', '));
        console.log(JSON.stringify(enrollment, null, 2));
      });
    } else {
      console.log('❌ Aucune inscription trouvée pour cette école.');
    }
    
  } catch (err) {
    console.error('❌ Erreur lors du test:', err.message);
    
    if (err.response) {
      console.error('Détails de l\'erreur:');
      console.error(`Status: ${err.response.status}`);
      console.error('Data:', err.response.data);
    }
  }
}

testSchoolEnrollments();
