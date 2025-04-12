const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
require('dotenv').config();

/**
 * Crée une session de paiement Stripe
 * @param {Object} paymentData - Données du paiement
 * @param {number} paymentData.amount - Montant du paiement (en FCFA)
 * @param {string} paymentData.description - Description du paiement
 * @param {string} paymentData.successUrl - URL de redirection en cas de succès
 * @param {string} paymentData.cancelUrl - URL de redirection en cas d'annulation
 * @param {Object} paymentData.metadata - Métadonnées du paiement
 * @returns {Promise<Object>} - Résultat de la création de session
 */
const createPaymentSession = async (paymentData) => {
  try {
    // Convertir le montant en centimes (Stripe utilise les centimes)
    // Note: Pour une conversion réelle FCFA -> EUR ou USD, utilisez un taux de change
    // Ici, nous supposons simplement que 1 FCFA = 0.0015 EUR pour l'exemple
    const amountInCents = Math.round(paymentData.amount * 0.0015 * 100);
    
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: 'Frais de scolarité',
              description: paymentData.description,
            },
            unit_amount: amountInCents,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: paymentData.successUrl,
      cancel_url: paymentData.cancelUrl,
      metadata: paymentData.metadata || {},
    });
    
    return {
      success: true,
      sessionId: session.id,
      url: session.url,
      session
    };
  } catch (error) {
    console.error("Erreur Stripe:", error);
    throw error;
  }
};

/**
 * Vérifie le statut d'une session de paiement Stripe
 * @param {string} sessionId - ID de la session Stripe
 * @returns {Promise<Object>} - Statut de la session
 */
const checkSessionStatus = async (sessionId) => {
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    return {
      success: session.payment_status === 'paid',
      status: session.payment_status,
      session
    };
  } catch (error) {
    console.error("Erreur lors de la vérification de la session Stripe:", error);
    throw error;
  }
};

/**
 * Traite un webhook Stripe
 * @param {string} payload - Payload du webhook
 * @param {string} signature - Signature du webhook
 * @returns {Promise<Object>} - Événement Stripe
 */
const handleWebhook = async (payload, signature) => {
  try {
    const event = stripe.webhooks.constructEvent(
      payload,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
    
    return {
      success: true,
      event
    };
  } catch (error) {
    console.error("Erreur lors du traitement du webhook Stripe:", error);
    throw error;
  }
};

module.exports = {
  createPaymentSession,
  checkSessionStatus,
  handleWebhook
};
