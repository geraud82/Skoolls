const { 
  createPayment, 
  getPaymentsByParent, 
  getPaymentsBySchool, 
  updatePaymentStatus,
  getPaymentByToken
} = require('../models/paymentModel');
const paydunyaService = require('../services/paydunyaService');
const stripeService = require('../services/stripeService');
const flutterwaveService = require('../services/flutterwaveService');
const db = require('../config/db');
const { updateEnrollmentStatus } = require('../models/enrollmentModel');

// Fonction utilitaire pour vérifier si l'utilisateur est une école
const isSchool = async (user_id) => {
  const result = await db.query("SELECT role FROM users WHERE id = $1", [user_id]);
  return result.rows.length > 0 && result.rows[0].role === 'ecole';
};

const payTuition = async (req, res) => {
  const { enrollment_id, amount, method, payment_details } = req.body;
  const user_id = req.user.id;

  if (!enrollment_id || !amount || !method) {
    return res.status(400).json({ message: 'ID d\'inscription, montant et méthode de paiement sont requis' });
  }

  try {
    // Vérifier si l'inscription existe et appartient à l'utilisateur
    const enrollmentCheck = await db.query(
      `SELECT e.id, e.status, c.user_id, c.first_name, c.last_name, cl.tuition_fee, cl.name as class_name
       FROM enrollments e
       JOIN children c ON e.child_id = c.id
       JOIN classes cl ON e.class_id = cl.id
       WHERE e.id = $1`,
      [enrollment_id]
    );
    
    if (enrollmentCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Inscription non trouvée' });
    }
    
    const enrollment = enrollmentCheck.rows[0];
    
    // Vérifier si l'utilisateur est le parent de l'enfant inscrit
    if (enrollment.user_id !== user_id) {
      return res.status(403).json({ message: 'Vous n\'êtes pas autorisé à payer pour cette inscription' });
    }
    
    // Vérifier si l'inscription est acceptée
    if (enrollment.status !== 'accepted') {
      return res.status(400).json({ message: 'Seules les inscriptions validées peuvent être payées' });
    }
    
    // Vérifier si un paiement existe déjà pour cette inscription
    const paymentCheck = await db.query(
      'SELECT id FROM payments WHERE enrollment_id = $1',
      [enrollment_id]
    );
    
    if (paymentCheck.rows.length > 0) {
      return res.status(400).json({ message: 'Un paiement existe déjà pour cette inscription' });
    }
    
    // Vérifier si le montant correspond aux frais de scolarité
    if (parseFloat(enrollment.tuition_fee) !== parseFloat(amount)) {
      return res.status(400).json({ 
        message: 'Le montant du paiement doit correspondre aux frais de scolarité',
        expected: parseFloat(enrollment.tuition_fee),
        received: parseFloat(amount)
      });
    }
    
    // Traiter le paiement en fonction de la méthode choisie
    switch (method) {
      case 'paydunya': {
        // Construire l'URL de base de l'application
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        
        // Créer une demande de paiement PayDunya
        const paydunyaRequest = await paydunyaService.createPaymentRequest({
          amount: parseFloat(amount),
          description: `Frais de scolarité pour ${enrollment.first_name} ${enrollment.last_name} - ${enrollment.class_name}`,
          callbackUrl: `${baseUrl}/api/payments/paydunya/callback`,
          returnUrl: `${baseUrl}/payments/success?token=${encodeURIComponent(paydunyaRequest?.token || '')}`,
          cancelUrl: `${baseUrl}/payments/cancel`,
          customData: {
            enrollment_id: enrollment_id,
            user_id: user_id
          }
        });
        
        // Créer le paiement dans notre base de données
        const payment = await createPayment({ 
          enrollment_id, 
          amount, 
          method,
          payment_token: paydunyaRequest.token,
          payment_url: paydunyaRequest.url,
          payment_status: 'pending',
          payment_details: payment_details || {}
        });
        
        // Retourner l'URL de paiement PayDunya
        return res.status(201).json({
          message: 'Redirection vers PayDunya pour le paiement',
          payment_url: paydunyaRequest.url,
          payment_token: paydunyaRequest.token,
          payment
        });
      }
      
      case 'stripe': {
        // Construire l'URL de base de l'application
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        
        // Créer une session de paiement Stripe
        const stripeSession = await stripeService.createPaymentSession({
          amount: parseFloat(amount),
          description: `Frais de scolarité pour ${enrollment.first_name} ${enrollment.last_name} - ${enrollment.class_name}`,
          successUrl: `${baseUrl}/payments/success?session_id={CHECKOUT_SESSION_ID}`,
          cancelUrl: `${baseUrl}/payments/cancel`,
          metadata: {
            enrollment_id: enrollment_id,
            user_id: user_id
          }
        });
        
        // Créer le paiement dans notre base de données
        const payment = await createPayment({ 
          enrollment_id, 
          amount, 
          method,
          payment_token: stripeSession.sessionId,
          payment_url: stripeSession.url,
          payment_status: 'pending',
          payment_details: payment_details || {}
        });
        
        // Retourner l'URL de paiement Stripe
        return res.status(201).json({
          message: 'Redirection vers Stripe pour le paiement',
          payment_url: stripeSession.url,
          session_id: stripeSession.sessionId,
          payment
        });
      }
      
      case 'flutterwave': {
        // Construire l'URL de base de l'application
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        
        // Extraire les informations du client des détails de paiement
        const { email, name, phone } = payment_details || {};
        
        if (!email || !name) {
          return res.status(400).json({ 
            message: 'Email et nom du client sont requis pour le paiement Flutterwave' 
          });
        }
        
        // Créer un lien de paiement Flutterwave
        const flutterwavePayment = await flutterwaveService.createPaymentLink({
          amount: parseFloat(amount),
          description: `Frais de scolarité pour ${enrollment.first_name} ${enrollment.last_name} - ${enrollment.class_name}`,
          customerEmail: email,
          customerName: name,
          customerPhone: phone,
          redirectUrl: `${baseUrl}/payments/success?transaction_id={id}&tx_ref={txRef}`,
          metadata: {
            enrollment_id: enrollment_id,
            user_id: user_id
          }
        });
        
        // Créer le paiement dans notre base de données
        const payment = await createPayment({ 
          enrollment_id, 
          amount, 
          method,
          payment_token: flutterwavePayment.transactionRef,
          payment_url: flutterwavePayment.paymentLink,
          payment_status: 'pending',
          payment_details: {
            ...payment_details,
            transaction_id: flutterwavePayment.transactionId
          }
        });
        
        // Retourner l'URL de paiement Flutterwave
        return res.status(201).json({
          message: 'Redirection vers Flutterwave pour le paiement',
          payment_url: flutterwavePayment.paymentLink,
          transaction_ref: flutterwavePayment.transactionRef,
          payment
        });
      }
      
      default:
        return res.status(400).json({ 
          message: 'Méthode de paiement non prise en charge. Veuillez utiliser PayDunya, Stripe ou Flutterwave.' 
        });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur lors du paiement', error: err.message });
  }
};

const listPayments = async (req, res) => {
  const user_id = req.user.id;
  try {
    const payments = await getPaymentsByParent(user_id);
    res.json(payments);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur lors de la récupération des paiements' });
  }
};

const listSchoolPayments = async (req, res) => {
  const user_id = req.user.id;
  
  try {
    // Vérifier si l'utilisateur est une école
    if (!(await isSchool(user_id))) {
      return res.status(403).json({ message: 'Accès refusé. Seules les écoles peuvent accéder à cette ressource.' });
    }
    
    // Récupérer l'ID de l'école (qui est l'ID de l'utilisateur)
    const school_id = user_id;
    
    const payments = await getPaymentsBySchool(school_id);
    res.json(payments);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur lors de la récupération des paiements', error: err.message });
  }
};

/**
 * Gère le callback de PayDunya
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 */
const handlePaydunyaCallback = async (req, res) => {
  try {
    const webhookData = req.body;
    
    // Traiter le webhook
    const result = await paydunyaService.handleWebhook(webhookData);
    
    if (result.success) {
      // Récupérer le paiement par token
      const payment = await getPaymentByToken(result.token);
      
      if (!payment) {
        return res.status(404).json({ message: 'Paiement non trouvé' });
      }
      
      // Mettre à jour le statut du paiement
      await updatePaymentStatus(
        payment.id, 
        result.status === 'completed' ? 'completed' : 'failed',
        webhookData,
        webhookData.data?.transaction_id
      );
      
      // Si le paiement est complété, mettre à jour le statut de l'inscription
      if (result.status === 'completed') {
        await updateEnrollmentStatus(payment.enrollment_id, 'paid');
      }
      
      return res.status(200).json({ message: 'Webhook traité avec succès' });
    } else {
      return res.status(400).json({ message: 'Échec du traitement du webhook' });
    }
  } catch (err) {
    console.error('Erreur lors du traitement du callback PayDunya:', err);
    return res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

/**
 * Vérifie le statut d'un paiement PayDunya
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 */
const checkPaydunyaStatus = async (req, res) => {
  const { token } = req.params;
  
  if (!token) {
    return res.status(400).json({ message: 'Token de paiement requis' });
  }
  
  try {
    // Vérifier le statut du paiement sur PayDunya
    const statusResult = await paydunyaService.checkPaymentStatus(token);
    
    // Récupérer le paiement dans notre base de données
    const payment = await getPaymentByToken(token);
    
    if (!payment) {
      return res.status(404).json({ message: 'Paiement non trouvé' });
    }
    
    // Mettre à jour le statut du paiement si nécessaire
    if (statusResult.status !== payment.payment_status) {
      await updatePaymentStatus(
        payment.id, 
        statusResult.status,
        statusResult.response,
        statusResult.response?.transaction_id
      );
      
      // Si le paiement est complété, mettre à jour le statut de l'inscription
      if (statusResult.status === 'completed') {
        await updateEnrollmentStatus(payment.enrollment_id, 'paid');
      }
    }
    
    return res.status(200).json({
      payment_status: statusResult.status,
      payment: payment
    });
  } catch (err) {
    console.error('Erreur lors de la vérification du statut PayDunya:', err);
    return res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

/**
 * Gère le callback de Stripe
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 */
const handleStripeWebhook = async (req, res) => {
  try {
    const signature = req.headers['stripe-signature'];
    
    // Traiter le webhook
    const result = await stripeService.handleWebhook(req.rawBody, signature);
    
    if (result.success) {
      const event = result.event;
      
      // Traiter l'événement en fonction de son type
      if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        
        // Récupérer le paiement par token (session ID)
        const payment = await getPaymentByToken(session.id);
        
        if (!payment) {
          return res.status(404).json({ message: 'Paiement non trouvé' });
        }
        
        // Mettre à jour le statut du paiement
        await updatePaymentStatus(
          payment.id, 
          'completed',
          session,
          session.payment_intent
        );
        
        // Mettre à jour le statut de l'inscription
        await updateEnrollmentStatus(payment.enrollment_id, 'paid');
      }
      
      return res.status(200).json({ received: true });
    } else {
      return res.status(400).json({ message: 'Échec du traitement du webhook' });
    }
  } catch (err) {
    console.error('Erreur lors du traitement du webhook Stripe:', err);
    return res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

/**
 * Gère le callback de Flutterwave
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 */
const handleFlutterwaveWebhook = async (req, res) => {
  try {
    const signature = req.headers['verif-hash'];
    
    // Traiter le webhook
    const result = await flutterwaveService.handleWebhook(req.body, signature);
    
    if (result.success) {
      // Récupérer le paiement par token (transaction reference)
      const payment = await getPaymentByToken(result.transactionRef);
      
      if (!payment) {
        return res.status(404).json({ message: 'Paiement non trouvé' });
      }
      
      // Mettre à jour le statut du paiement
      await updatePaymentStatus(
        payment.id, 
        result.status === 'successful' ? 'completed' : 'failed',
        result.data,
        result.transactionId
      );
      
      // Si le paiement est réussi, mettre à jour le statut de l'inscription
      if (result.status === 'successful') {
        await updateEnrollmentStatus(payment.enrollment_id, 'paid');
      }
      
      return res.status(200).json({ message: 'Webhook traité avec succès' });
    } else {
      return res.status(400).json({ message: 'Échec du traitement du webhook' });
    }
  } catch (err) {
    console.error('Erreur lors du traitement du webhook Flutterwave:', err);
    return res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

/**
 * Vérifie le statut d'un paiement Stripe
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 */
const checkStripeStatus = async (req, res) => {
  const { session_id } = req.params;
  
  if (!session_id) {
    return res.status(400).json({ message: 'ID de session requis' });
  }
  
  try {
    // Vérifier le statut de la session Stripe
    const statusResult = await stripeService.checkSessionStatus(session_id);
    
    // Récupérer le paiement dans notre base de données
    const payment = await getPaymentByToken(session_id);
    
    if (!payment) {
      return res.status(404).json({ message: 'Paiement non trouvé' });
    }
    
    // Mettre à jour le statut du paiement si nécessaire
    if (statusResult.status !== payment.payment_status) {
      await updatePaymentStatus(
        payment.id, 
        statusResult.status === 'paid' ? 'completed' : statusResult.status,
        statusResult.session,
        statusResult.session?.payment_intent
      );
      
      // Si le paiement est complété, mettre à jour le statut de l'inscription
      if (statusResult.status === 'paid') {
        await updateEnrollmentStatus(payment.enrollment_id, 'paid');
      }
    }
    
    return res.status(200).json({
      payment_status: statusResult.status,
      payment: payment
    });
  } catch (err) {
    console.error('Erreur lors de la vérification du statut Stripe:', err);
    return res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

/**
 * Vérifie le statut d'un paiement Flutterwave
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 */
const checkFlutterwaveStatus = async (req, res) => {
  const { transaction_id } = req.params;
  
  if (!transaction_id) {
    return res.status(400).json({ message: 'ID de transaction requis' });
  }
  
  try {
    // Vérifier le statut de la transaction Flutterwave
    const statusResult = await flutterwaveService.verifyTransaction(transaction_id);
    
    // Récupérer le paiement dans notre base de données par les détails de paiement
    const payments = await db.query(
      "SELECT * FROM payments WHERE payment_details->>'transaction_id' = $1",
      [transaction_id]
    );
    
    if (payments.rows.length === 0) {
      return res.status(404).json({ message: 'Paiement non trouvé' });
    }
    
    const payment = payments.rows[0];
    
    // Mettre à jour le statut du paiement si nécessaire
    if (statusResult.status !== payment.payment_status) {
      await updatePaymentStatus(
        payment.id, 
        statusResult.status === 'successful' ? 'completed' : 'failed',
        statusResult,
        transaction_id
      );
      
      // Si le paiement est complété, mettre à jour le statut de l'inscription
      if (statusResult.status === 'successful') {
        await updateEnrollmentStatus(payment.enrollment_id, 'paid');
      }
    }
    
    return res.status(200).json({
      payment_status: statusResult.status,
      payment: payment
    });
  } catch (err) {
    console.error('Erreur lors de la vérification du statut Flutterwave:', err);
    return res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

module.exports = { 
  payTuition, 
  listPayments, 
  listSchoolPayments,
  handlePaydunyaCallback,
  checkPaydunyaStatus,
  handleStripeWebhook,
  handleFlutterwaveWebhook,
  checkStripeStatus,
  checkFlutterwaveStatus
};
