// Mock service pour PayDunya
// Ce fichier est une version simplifiée qui ne dépend pas de la bibliothèque PayDunya

/**
 * Crée une demande de paiement PayDunya
 * @param {Object} paymentData - Données du paiement
 * @param {number} paymentData.amount - Montant du paiement
 * @param {string} paymentData.description - Description du paiement
 * @param {string} paymentData.callbackUrl - URL de callback après paiement
 * @param {string} paymentData.cancelUrl - URL en cas d'annulation
 * @param {string} paymentData.returnUrl - URL de retour après paiement
 * @param {Object} paymentData.customData - Données personnalisées
 * @returns {Promise<Object>} - Résultat de la demande de paiement
 */
const createPaymentRequest = async (paymentData) => {
  try {
    console.log('Création d\'une demande de paiement PayDunya (mock):', paymentData);
    
    // Simuler une réponse de l'API PayDunya
    const mockResponse = {
      success: true,
      token: 'mock_token_' + Date.now(),
      url: 'https://app.paydunya.com/sandbox-checkout/mock-' + Date.now(),
      response: {
        status: 'success',
        token: 'mock_token_' + Date.now(),
        response_text: 'Demande de paiement créée avec succès'
      }
    };
    
    return mockResponse;
  } catch (error) {
    console.error("Erreur PayDunya (mock):", error);
    throw error;
  }
};

/**
 * Vérifie le statut d'un paiement PayDunya
 * @param {string} token - Token du paiement
 * @returns {Promise<Object>} - Statut du paiement
 */
const checkPaymentStatus = async (token) => {
  try {
    console.log('Vérification du statut du paiement (mock):', token);
    
    // Simuler une réponse de l'API PayDunya
    return {
      success: true,
      status: 'completed',
      response: {
        status: 'completed',
        response_text: 'Paiement complété avec succès'
      }
    };
  } catch (error) {
    console.error("Erreur lors de la vérification du statut (mock):", error);
    throw error;
  }
};

/**
 * Traite le webhook de PayDunya
 * @param {Object} webhookData - Données du webhook
 * @returns {Promise<Object>} - Résultat du traitement
 */
const handleWebhook = async (webhookData) => {
  try {
    console.log('Traitement du webhook PayDunya (mock):', webhookData);
    
    // Extraire les données du webhook
    const token = webhookData.data?.token || 'mock_token';
    const status = webhookData.data?.status || 'completed';
    
    return {
      success: true,
      token,
      status
    };
  } catch (error) {
    console.error("Erreur lors du traitement du webhook (mock):", error);
    throw error;
  }
};

module.exports = {
  createPaymentRequest,
  checkPaymentStatus,
  handleWebhook
};
