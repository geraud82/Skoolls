const PayDunya = require('paydunya');
require('dotenv').config();

// Configuration de PayDunya
const setup = new PayDunya.Setup({
  masterKey: process.env.PAYDUNYA_MASTER_KEY,
  privateKey: process.env.PAYDUNYA_PRIVATE_KEY,
  publicKey: process.env.PAYDUNYA_PUBLIC_KEY,
  token: process.env.PAYDUNYA_TOKEN,
  mode: process.env.NODE_ENV === 'production' ? 'live' : 'test'
});

// Configuration du store
const store = new PayDunya.Store({
  name: "SchoolPay",
  tagline: "Paiement des frais de scolarité",
  phoneNumber: process.env.STORE_PHONE_NUMBER || "+22500000000",
  postalAddress: process.env.STORE_ADDRESS || "Abidjan, Côte d'Ivoire",
  websiteUrl: process.env.WEBSITE_URL || "https://schoolpay.com",
  logoUrl: process.env.LOGO_URL || "https://schoolpay.com/logo.png"
});

// Initialisation de l'API PayDunya
const paydunya = new PayDunya(setup, store);

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
    const invoice = new PayDunya.CheckoutInvoice(setup, store);
    
    // Ajouter les détails du paiement
    invoice.addItem(paymentData.description, 1, paymentData.amount, paymentData.amount);
    invoice.totalAmount = paymentData.amount;
    
    // Ajouter les URLs de callback
    if (paymentData.callbackUrl) {
      invoice.callbackUrl = paymentData.callbackUrl;
    }
    if (paymentData.cancelUrl) {
      invoice.cancelUrl = paymentData.cancelUrl;
    }
    if (paymentData.returnUrl) {
      invoice.returnUrl = paymentData.returnUrl;
    }
    
    // Ajouter des données personnalisées
    if (paymentData.customData) {
      Object.entries(paymentData.customData).forEach(([key, value]) => {
        invoice.addCustomData(key, value);
      });
    }
    
    // Créer la facture
    const response = await invoice.create();
    
    if (response.status === "success") {
      return {
        success: true,
        token: response.token,
        url: response.url,
        response
      };
    } else {
      throw new Error(response.response_text || "Échec de la création de la demande de paiement");
    }
  } catch (error) {
    console.error("Erreur PayDunya:", error);
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
    const invoice = new PayDunya.CheckoutInvoice(setup, store);
    invoice.token = token;
    
    const response = await invoice.confirm();
    
    return {
      success: response.status === "completed",
      status: response.status,
      response
    };
  } catch (error) {
    console.error("Erreur lors de la vérification du statut:", error);
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
    // Vérifier la signature du webhook
    // Cette partie dépend de la façon dont PayDunya implémente les webhooks
    
    const token = webhookData.data.token;
    const status = webhookData.data.status;
    
    return {
      success: true,
      token,
      status
    };
  } catch (error) {
    console.error("Erreur lors du traitement du webhook:", error);
    throw error;
  }
};

module.exports = {
  createPaymentRequest,
  checkPaymentStatus,
  handleWebhook
};
