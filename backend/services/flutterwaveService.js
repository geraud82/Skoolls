const Flutterwave = require('flutterwave-node-v3');
require('dotenv').config();

// Initialisation de Flutterwave
const flw = new Flutterwave(
  process.env.FLUTTERWAVE_PUBLIC_KEY,
  process.env.FLUTTERWAVE_SECRET_KEY
);

/**
 * Crée une transaction de paiement Flutterwave
 * @param {Object} paymentData - Données du paiement
 * @param {number} paymentData.amount - Montant du paiement
 * @param {string} paymentData.description - Description du paiement
 * @param {string} paymentData.customerEmail - Email du client
 * @param {string} paymentData.customerName - Nom du client
 * @param {string} paymentData.customerPhone - Téléphone du client (optionnel)
 * @param {string} paymentData.redirectUrl - URL de redirection après paiement
 * @param {Object} paymentData.metadata - Métadonnées du paiement
 * @returns {Promise<Object>} - Résultat de la création de transaction
 */
const createPaymentLink = async (paymentData) => {
  try {
    const payload = {
      tx_ref: `SCH-PAY-${Date.now()}`,
      amount: paymentData.amount,
      currency: 'XOF', // Franc CFA (BCEAO)
      payment_options: 'card,mobilemoney,ussd',
      redirect_url: paymentData.redirectUrl,
      customer: {
        email: paymentData.customerEmail,
        name: paymentData.customerName,
        phonenumber: paymentData.customerPhone || '',
      },
      customizations: {
        title: 'SchoolPay',
        description: paymentData.description,
        logo: process.env.LOGO_URL || 'https://schoolpay.com/logo.png',
      },
      meta: paymentData.metadata || {},
    };

    const response = await flw.Charge.initialize(payload);
    
    if (response.status === 'success') {
      return {
        success: true,
        transactionId: response.data.id,
        transactionRef: payload.tx_ref,
        paymentLink: response.data.link,
        response
      };
    } else {
      throw new Error(response.message || 'Échec de la création du lien de paiement');
    }
  } catch (error) {
    console.error('Erreur Flutterwave:', error);
    throw error;
  }
};

/**
 * Vérifie le statut d'une transaction Flutterwave
 * @param {string} transactionId - ID de la transaction
 * @returns {Promise<Object>} - Statut de la transaction
 */
const verifyTransaction = async (transactionId) => {
  try {
    const response = await flw.Transaction.verify({ id: transactionId });
    
    if (response.status === 'success') {
      return {
        success: response.data.status === 'successful',
        status: response.data.status,
        transactionId: response.data.id,
        transactionRef: response.data.tx_ref,
        amount: response.data.amount,
        currency: response.data.currency,
        customerEmail: response.data.customer.email,
        customerName: response.data.customer.name,
        paymentMethod: response.data.payment_type,
        response
      };
    } else {
      throw new Error(response.message || 'Échec de la vérification de la transaction');
    }
  } catch (error) {
    console.error('Erreur lors de la vérification de la transaction Flutterwave:', error);
    throw error;
  }
};

/**
 * Traite un webhook Flutterwave
 * @param {Object} webhookData - Données du webhook
 * @param {string} signature - Signature du webhook
 * @returns {Promise<Object>} - Résultat du traitement
 */
const handleWebhook = async (webhookData, signature) => {
  try {
    // Vérifier la signature du webhook
    // Note: Flutterwave utilise un secret hash pour vérifier les webhooks
    // Vous devriez implémenter une vérification appropriée ici
    const secretHash = process.env.FLUTTERWAVE_SECRET_HASH;
    
    // Exemple simple de vérification (à adapter selon la documentation Flutterwave)
    if (signature !== secretHash) {
      throw new Error('Signature de webhook invalide');
    }
    
    // Traiter les données du webhook
    const { event, data } = webhookData;
    
    // Vérifier si c'est un événement de paiement réussi
    if (event === 'charge.completed' && data.status === 'successful') {
      return {
        success: true,
        transactionId: data.id,
        transactionRef: data.tx_ref,
        status: data.status,
        data
      };
    }
    
    return {
      success: false,
      event,
      status: data.status,
      data
    };
  } catch (error) {
    console.error('Erreur lors du traitement du webhook Flutterwave:', error);
    throw error;
  }
};

module.exports = {
  createPaymentLink,
  verifyTransaction,
  handleWebhook
};
