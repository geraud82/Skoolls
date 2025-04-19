const db = require('../config/db');
const enrollmentModel = require('../models/enrollmentModel');

// Créer une nouvelle inscription
const createEnrollment = async (req, res) => {
  const { child_id, class_id } = req.body;
  const userId = req.user.id;

  console.log('📝 Demande d\'inscription reçue:', { child_id, class_id, userId });

  if (!child_id || !class_id) {
    console.log('❌ Données d\'inscription incomplètes');
    return res.status(400).json({ message: 'Données d\'inscription incomplètes.' });
  }

  try {
    // Vérifier que l'enfant appartient au parent
    console.log('🔍 Vérification que l\'enfant appartient au parent:', { child_id, userId });
    const childCheck = await db.query(
      'SELECT * FROM children WHERE id = $1 AND user_id = $2',
      [parseInt(child_id), userId]
    );

    console.log('📊 Résultat de la vérification de l\'enfant:', { count: childCheck.rows.length });
    if (childCheck.rows.length === 0) {
      return res.status(403).json({ message: 'Cet enfant ne vous appartient pas.' });
    }

    // Utiliser le modèle pour créer l'inscription
    const enrollment = await enrollmentModel.createEnrollment({ 
      child_id: parseInt(child_id), 
      class_id: parseInt(class_id) 
    });

    console.log('✅ Inscription créée avec succès:', enrollment);
    
    // Récupérer les informations complètes pour la réponse
    const result = await db.query(
      `SELECT e.*, 
              c.name as class_name, 
              c.school_id,
              ch.first_name, 
              ch.last_name,
              CONCAT(ch.first_name, ' ', ch.last_name) AS child_name,
              u.name AS parent_name
       FROM enrollments e
       JOIN classes c ON e.class_id = c.id
       JOIN children ch ON e.child_id = ch.id
       JOIN users u ON ch.user_id = u.id
       WHERE e.id = $1`,
      [enrollment.id]
    );
    
    const enrollmentData = result.rows[0];
    
    // Vérifier si la table notifications existe
    const tableCheck = await db.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'notifications'
      )
    `);
    
    if (tableCheck.rows[0].exists) {
      try {
        // Récupérer l'ID de l'utilisateur école
        const schoolUserQuery = await db.query(
          'SELECT user_id FROM schools WHERE id = $1',
          [enrollmentData.school_id]
        );
        
        if (schoolUserQuery.rows.length > 0) {
          const schoolUserId = schoolUserQuery.rows[0].user_id;
          
          // Créer une notification pour l'école
          const title = '🆕 Nouvelle inscription reçue';
          const message = `${enrollmentData.child_name} a été inscrit(e) à la classe ${enrollmentData.class_name}. Veuillez examiner cette inscription.`;
          
          await db.query(
            'INSERT INTO notifications (user_id, title, message) VALUES ($1, $2, $3)',
            [schoolUserId, title, message]
          );
          
          console.log('✅ Notification envoyée à l\'école pour la nouvelle inscription');
        }
      } catch (notifErr) {
        console.error('❌ Erreur lors de l\'envoi de la notification à l\'école:', notifErr);
        // Ne pas bloquer la réponse en cas d'erreur de notification
      }
    }

    res.status(201).json(enrollmentData);
  } catch (err) {
    console.error('❌ Erreur lors de la création de l\'inscription:', err);
    
    // Gérer les différents types d'erreurs
    if (err.message === 'Enfant non trouvé') {
      return res.status(404).json({ message: 'Enfant non trouvé.' });
    } else if (err.message === 'Classe non trouvée') {
      return res.status(404).json({ message: 'Classe introuvable.' });
    } else if (err.message === 'Inscription déjà existante') {
      return res.status(400).json({ message: 'Cet enfant est déjà inscrit à cette classe.' });
    } else if (err.message === 'La table enrollments n\'existe pas') {
      return res.status(500).json({ message: 'Erreur de configuration du serveur: table manquante.' });
    } else if (err.message === 'ID enfant invalide' || err.message === 'ID classe invalide') {
      return res.status(400).json({ message: 'IDs d\'enfant ou de classe invalides.' });
    }
    
    res.status(500).json({ message: 'Erreur serveur: ' + err.message });
  }
};

// Récupérer les inscriptions d'un parent
const getParentEnrollments = async (req, res) => {
  const userId = req.user.id;
  const childId = req.query.childId; // Récupérer le paramètre childId de la requête

  try {
    // Vérifier si les tables nécessaires existent
    const tablesCheck = await db.query(`
      SELECT 
        (SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'enrollments')) AS enrollments_exists,
        (SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'children')) AS children_exists,
        (SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'classes')) AS classes_exists
    `);
    
    const { enrollments_exists, children_exists, classes_exists } = tablesCheck.rows[0];
    
    if (!enrollments_exists || !children_exists || !classes_exists) {
      console.error('Une ou plusieurs tables requises n\'existent pas');
      return res.status(500).json({ message: 'Erreur de configuration du serveur: tables manquantes.' });
    }
    
    let enrollments;
    
    if (childId) {
      // Si childId est fourni, vérifier d'abord que l'enfant appartient au parent
      const childCheck = await db.query(
        'SELECT * FROM children WHERE id = $1 AND user_id = $2',
        [parseInt(childId), userId]
      );
      
      if (childCheck.rows.length === 0) {
        return res.status(403).json({ message: 'Cet enfant ne vous appartient pas ou n\'existe pas.' });
      }
      
      // Récupérer les inscriptions pour cet enfant spécifique
      enrollments = await db.query(
        `SELECT e.id, 
                c.first_name, 
                c.last_name, 
                CONCAT(c.first_name, ' ', c.last_name) AS child_name,
                u.name AS parent_name,
                cl.name AS class_name, 
                cl.tuition_fee, 
                e.status, 
                e.created_at
         FROM enrollments e
         JOIN children c ON e.child_id = c.id
         JOIN classes cl ON e.class_id = cl.id
         JOIN users u ON c.user_id = u.id
         WHERE e.child_id = $1
         ORDER BY e.created_at DESC`,
        [parseInt(childId)]
      );
      
      enrollments = enrollments.rows;
    } else {
      // Sinon, utiliser le modèle pour récupérer toutes les inscriptions du parent
      enrollments = await enrollmentModel.getEnrollmentsByParent(userId);
    }
    
    res.status(200).json(enrollments);
  } catch (err) {
    console.error('❌ Erreur lors de la récupération des inscriptions:', err);
    res.status(500).json({ message: 'Erreur serveur: ' + err.message });
  }
};

// Récupérer les inscriptions d'une école
const getSchoolEnrollments = async (req, res) => {
  const userId = req.user.id;

  try {
    // Vérifier que l'utilisateur est associé à une école
    const schoolCheck = await db.query(
      'SELECT * FROM users WHERE id = $1 AND role = $2',
      [userId, 'ecole']
    );

    if (schoolCheck.rows.length === 0) {
      return res.status(403).json({ message: 'Vous n\'êtes pas associé à une école.' });
    }

    // Utiliser le modèle pour récupérer les inscriptions
    const enrollments = await enrollmentModel.getEnrollmentsBySchool(userId);
    
    res.status(200).json(enrollments);
  } catch (err) {
    console.error('❌ Erreur lors de la récupération des inscriptions:', err);
    res.status(500).json({ message: 'Erreur serveur: ' + err.message });
  }
};

const updateEnrollmentStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!['accepted', 'rejected'].includes(status)) {
    return res.status(400).json({ message: 'Statut invalide.' });
  }

  try {
    // Vérifier si la table notifications existe
    const tableCheck = await db.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'notifications'
      )
    `);
    
    if (!tableCheck.rows[0].exists) {
      console.error('La table notifications n\'existe pas');
      return res.status(500).json({ message: 'Erreur de configuration du serveur: table notifications manquante.' });
    }
    
    // Utiliser le modèle pour mettre à jour le statut
    const enrollment = await enrollmentModel.updateEnrollmentStatus(id, status);
    
    // Récupérer l'utilisateur parent
    const userRes = await db.query(
      `SELECT ch.user_id 
       FROM enrollments e
       JOIN children ch ON e.child_id = ch.id
       WHERE e.id = $1`,
      [id]
    );
    const userId = userRes.rows[0]?.user_id;

    if (userId) {
      // Créer la notification
      const title = 'Mise à jour de l\'inscription';
      const message =
        status === 'accepted'
          ? '✅ Votre demande d\'inscription a été acceptée.'
          : '❌ Votre demande d\'inscription a été rejetée.';

      await db.query(
        'INSERT INTO notifications (user_id, title, message) VALUES ($1, $2, $3)',
        [userId, title, message]
      );
    }

    res.status(200).json({ message: 'Statut mis à jour avec succès.' });
  } catch (err) {
    console.error('❌ Erreur lors de la mise à jour du statut:', err);
    
    if (err.message === 'Inscription non trouvée') {
      return res.status(404).json({ message: 'Inscription non trouvée.' });
    } else if (err.message === 'Statut d\'inscription invalide') {
      return res.status(400).json({ message: 'Statut d\'inscription invalide.' });
    } else if (err.message === 'ID inscription invalide') {
      return res.status(400).json({ message: 'ID d\'inscription invalide.' });
    }
    
    res.status(500).json({ message: 'Erreur serveur: ' + err.message });
  }
};

module.exports = {
  createEnrollment,
  getParentEnrollments,
  getSchoolEnrollments,
  updateEnrollmentStatus
};
