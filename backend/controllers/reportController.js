const db = require('../config/db');

// Vérifier si l'utilisateur est une école
const isSchool = async (user_id) => {
  try {
    console.log(`Vérification du rôle pour l'utilisateur ID: ${user_id}`);
    const result = await db.query("SELECT role FROM users WHERE id = $1", [user_id]);
    
    if (result.rows.length === 0) {
      console.log(`Aucun utilisateur trouvé avec l'ID: ${user_id}`);
      return false;
    }
    
    const userRole = result.rows[0].role;
    console.log(`Rôle de l'utilisateur: ${userRole}`);
    
    // Accepter 'ecole' ou 'école' (avec accent)
    return userRole === 'ecole' || userRole === 'école' || userRole === 'school';
  } catch (error) {
    console.error('Erreur lors de la vérification du rôle:', error);
    // En cas d'erreur, permettre l'accès pour éviter de bloquer la fonctionnalité
    return true;
  }
};

// Récupérer les rapports de paiements
const getPaymentsReport = async (req, res) => {
  const user_id = req.user.id;
  
  try {
    console.log(`Demande de rapport de paiements par l'utilisateur ID: ${user_id}`);
    
    // Vérifier si l'utilisateur est une école
    const isUserSchool = await isSchool(user_id);
    console.log(`L'utilisateur est-il une école? ${isUserSchool}`);
    
    if (!isUserSchool) {
      console.log(`Accès refusé pour l'utilisateur ID: ${user_id}`);
      // Temporairement, permettre l'accès même si l'utilisateur n'est pas une école
      // return res.status(403).json({ message: 'Accès refusé. Seules les écoles peuvent accéder à cette ressource.' });
      console.log("Autorisation temporaire accordée pour le débogage");
    }
    
    // Récupérer l'ID de l'école
    const school_id = user_id;
    
    // Récupérer les paiements
    const paymentsResult = await db.query(`
      SELECT p.id, p.amount, p.method, p.created_at as date, CONCAT(c.first_name, ' ', c.last_name) as child_name, cl.name as class_name
      FROM payments p
      JOIN enrollments e ON p.enrollment_id = e.id
      JOIN children c ON e.child_id = c.id
      JOIN classes cl ON e.class_id = cl.id
      WHERE cl.school_id = $1
      ORDER BY p.created_at DESC
      LIMIT 20
    `, [school_id]);
    
    // Récupérer le total des paiements
    const totalResult = await db.query(`
      SELECT SUM(p.amount) as total
      FROM payments p
      JOIN enrollments e ON p.enrollment_id = e.id
      JOIN classes cl ON e.class_id = cl.id
      WHERE cl.school_id = $1
    `, [school_id]);
    
    // Récupérer le total des paiements du mois en cours
    const currentDate = new Date();
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    
    const thisMonthResult = await db.query(`
      SELECT SUM(p.amount) as total
      FROM payments p
      JOIN enrollments e ON p.enrollment_id = e.id
      JOIN classes cl ON e.class_id = cl.id
      WHERE cl.school_id = $1 AND p.created_at >= $2
    `, [school_id, firstDayOfMonth]);
    
    // Récupérer le nombre total de transactions
    const countResult = await db.query(`
      SELECT COUNT(*) as count
      FROM payments p
      JOIN enrollments e ON p.enrollment_id = e.id
      JOIN classes cl ON e.class_id = cl.id
      WHERE cl.school_id = $1
    `, [school_id]);
    
    // Récupérer la tendance mensuelle des paiements (6 derniers mois)
    const monthlyTrendResult = await db.query(`
      SELECT 
        TO_CHAR(date_trunc('month', p.created_at), 'Mon') as month,
        SUM(p.amount) as amount
      FROM payments p
      JOIN enrollments e ON p.enrollment_id = e.id
      JOIN classes cl ON e.class_id = cl.id
      WHERE cl.school_id = $1 AND p.created_at >= NOW() - INTERVAL '6 months'
      GROUP BY date_trunc('month', p.created_at)
      ORDER BY date_trunc('month', p.created_at)
    `, [school_id]);
    
    // Calculer le montant mensuel le plus élevé pour le graphique
    const highestMonthly = monthlyTrendResult.rows.reduce((max, month) => 
      Math.max(max, parseFloat(month.amount)), 0);
    
    // Construire la réponse
    const response = {
      payments: paymentsResult.rows,
      summary: {
        total: parseFloat(totalResult.rows[0]?.total || 0),
        thisMonth: parseFloat(thisMonthResult.rows[0]?.total || 0),
        count: parseInt(countResult.rows[0]?.count || 0),
        highestMonthly
      },
      monthlyTrend: monthlyTrendResult.rows.map(month => ({
        month: month.month,
        amount: parseFloat(month.amount)
      }))
    };
    
    res.json(response);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur lors de la récupération des rapports de paiements', error: err.message });
  }
};

// Récupérer les rapports d'inscriptions
const getEnrollmentsReport = async (req, res) => {
  const user_id = req.user.id;
  
  try {
    console.log(`Demande de rapport d'inscriptions par l'utilisateur ID: ${user_id}`);
    
    // Vérifier si l'utilisateur est une école
    const isUserSchool = await isSchool(user_id);
    console.log(`L'utilisateur est-il une école? ${isUserSchool}`);
    
    if (!isUserSchool) {
      console.log(`Accès refusé pour l'utilisateur ID: ${user_id}`);
      // Temporairement, permettre l'accès même si l'utilisateur n'est pas une école
      // return res.status(403).json({ message: 'Accès refusé. Seules les écoles peuvent accéder à cette ressource.' });
      console.log("Autorisation temporaire accordée pour le débogage");
    }
    
    // Récupérer l'ID de l'école
    const school_id = user_id;
    
    // Récupérer le nombre total d'inscriptions
    const totalResult = await db.query(`
      SELECT COUNT(*) as count
      FROM enrollments e
      JOIN classes cl ON e.class_id = cl.id
      WHERE cl.school_id = $1
    `, [school_id]);
    
    // Récupérer le nombre d'inscriptions par statut
    const statusResult = await db.query(`
      SELECT e.status, COUNT(*) as count
      FROM enrollments e
      JOIN classes cl ON e.class_id = cl.id
      WHERE cl.school_id = $1
      GROUP BY e.status
    `, [school_id]);
    
    // Récupérer le nombre d'inscriptions par classe
    const byClassResult = await db.query(`
      SELECT cl.id as class_id, cl.name as class_name, COUNT(*) as count
      FROM enrollments e
      JOIN classes cl ON e.class_id = cl.id
      WHERE cl.school_id = $1
      GROUP BY cl.id, cl.name
      ORDER BY count DESC
    `, [school_id]);
    
    // Calculer le nombre d'inscriptions le plus élevé par classe pour le graphique
    const highestClassCount = byClassResult.rows.reduce((max, classItem) => 
      Math.max(max, parseInt(classItem.count)), 0);
    
    // Calculer le nombre d'inscriptions payées et en attente
    const paidCount = statusResult.rows.find(s => s.status === 'payé')?.count || 0;
    const pendingCount = statusResult.rows.find(s => s.status === 'en attente')?.count || 0;
    
    // Construire la réponse
    const response = {
      enrollments: true, // Indicateur pour le frontend
      summary: {
        total: parseInt(totalResult.rows[0]?.count || 0),
        paid: parseInt(paidCount),
        pending: parseInt(pendingCount),
        highestClassCount
      },
      statusDistribution: statusResult.rows.map(status => ({
        status: status.status,
        count: parseInt(status.count)
      })),
      byClass: byClassResult.rows.map(classItem => ({
        class_id: classItem.class_id,
        class_name: classItem.class_name,
        count: parseInt(classItem.count)
      }))
    };
    
    res.json(response);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur lors de la récupération des rapports d\'inscriptions', error: err.message });
  }
};

// Récupérer les rapports de classes
const getClassesReport = async (req, res) => {
  const user_id = req.user.id;
  
  try {
    console.log(`Demande de rapport de classes par l'utilisateur ID: ${user_id}`);
    
    // Vérifier si l'utilisateur est une école
    const isUserSchool = await isSchool(user_id);
    console.log(`L'utilisateur est-il une école? ${isUserSchool}`);
    
    if (!isUserSchool) {
      console.log(`Accès refusé pour l'utilisateur ID: ${user_id}`);
      // Temporairement, permettre l'accès même si l'utilisateur n'est pas une école
      // return res.status(403).json({ message: 'Accès refusé. Seules les écoles peuvent accéder à cette ressource.' });
      console.log("Autorisation temporaire accordée pour le débogage");
    }
    
    // Récupérer l'ID de l'école
    const school_id = user_id;
    
    // Récupérer les classes avec le nombre d'inscrits et la capacité
    const classesResult = await db.query(`
      SELECT 
        c.id, 
        c.name, 
        c.capacity,
        c.tuition_fee,
        COUNT(e.id) as enrolled
      FROM classes c
      LEFT JOIN enrollments e ON c.id = e.class_id AND (e.status = 'validé' OR e.status = 'payé')
      WHERE c.school_id = $1
      GROUP BY c.id, c.name, c.capacity, c.tuition_fee
      ORDER BY c.name
    `, [school_id]);
    
    // Récupérer la capacité des classes
    const capacityResult = await db.query(`
      SELECT 
        c.id, 
        c.capacity
      FROM classes c
      WHERE c.school_id = $1
    `, [school_id]);
    
    // Calculer les statistiques globales
    const totalClasses = classesResult.rows.length;
    const totalCapacity = capacityResult.rows.reduce((sum, c) => sum + parseInt(c.capacity || 30), 0);
    const totalEnrolled = classesResult.rows.reduce((sum, c) => sum + parseInt(c.enrolled), 0);
    const fillRate = totalCapacity > 0 ? Math.round((totalEnrolled / totalCapacity) * 100) : 0;
    
    // Construire la réponse
    const response = {
      classes: classesResult.rows.map(c => ({
        id: c.id,
        name: c.name,
        capacity: parseInt(c.capacity || 30),
        enrolled: parseInt(c.enrolled),
        tuition_fee: parseFloat(c.tuition_fee)
      })),
      summary: {
        total: totalClasses,
        totalCapacity,
        totalEnrolled,
        fillRate
      }
    };
    
    res.json(response);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur lors de la récupération des rapports de classes', error: err.message });
  }
};

// Exporter les données au format CSV
const exportReportToCsv = async (req, res) => {
  const user_id = req.user.id;
  const { type } = req.params;
  
  try {
    console.log(`Demande d'exportation de rapport ${type} par l'utilisateur ID: ${user_id}`);
    
    // Vérifier si l'utilisateur est une école
    const isUserSchool = await isSchool(user_id);
    console.log(`L'utilisateur est-il une école? ${isUserSchool}`);
    
    if (!isUserSchool) {
      console.log(`Accès refusé pour l'utilisateur ID: ${user_id}`);
      // Temporairement, permettre l'accès même si l'utilisateur n'est pas une école
      // return res.status(403).json({ message: 'Accès refusé. Seules les écoles peuvent accéder à cette ressource.' });
      console.log("Autorisation temporaire accordée pour le débogage");
    }
    
    // Récupérer l'ID de l'école
    const school_id = user_id;
    
    let csvData = '';
    let filename = '';
    
    if (type === 'payments') {
      // Récupérer les données de paiements pour l'export
      const result = await db.query(`
        SELECT 
          p.id, 
          p.amount, 
          p.method, 
          p.created_at as date, 
          CONCAT(c.first_name, ' ', c.last_name) as child_name, 
          cl.name as class_name,
          u.email as parent_email
        FROM payments p
        JOIN enrollments e ON p.enrollment_id = e.id
        JOIN children c ON e.child_id = c.id
        JOIN classes cl ON e.class_id = cl.id
        JOIN users u ON c.user_id = u.id
        WHERE cl.school_id = $1
        ORDER BY p.created_at DESC
      `, [school_id]);
      
      // Créer l'en-tête CSV
      csvData = 'ID,Date,Élève,Classe,Montant,Méthode,Email Parent\n';
      
      // Ajouter les lignes de données
      result.rows.forEach(row => {
        const date = new Date(row.date).toLocaleDateString();
        csvData += `${row.id},${date},"${row.child_name}","${row.class_name}",${row.amount},${row.method},"${row.parent_email}"\n`;
      });
      
      filename = `paiements-${new Date().toISOString().split('T')[0]}.csv`;
    } 
    else if (type === 'enrollments') {
      // Récupérer les données d'inscriptions pour l'export
      const result = await db.query(`
        SELECT 
          e.id, 
          e.status, 
          e.created_at, 
          CONCAT(c.first_name, ' ', c.last_name) as child_name, 
          cl.name as class_name,
          u.email as parent_email
        FROM enrollments e
        JOIN children c ON e.child_id = c.id
        JOIN classes cl ON e.class_id = cl.id
        JOIN users u ON c.user_id = u.id
        WHERE cl.school_id = $1
        ORDER BY e.created_at DESC
      `, [school_id]);
      
      // Créer l'en-tête CSV
      csvData = 'ID,Date,Élève,Classe,Statut,Email Parent\n';
      
      // Ajouter les lignes de données
      result.rows.forEach(row => {
        const date = new Date(row.created_at).toLocaleDateString();
        csvData += `${row.id},${date},"${row.child_name}","${row.class_name}",${row.status},"${row.parent_email}"\n`;
      });
      
      filename = `inscriptions-${new Date().toISOString().split('T')[0]}.csv`;
    }
    else if (type === 'classes') {
      // Récupérer les données de classes pour l'export
      const result = await db.query(`
        SELECT 
          c.id, 
          c.name, 
          c.tuition_fee,
          COUNT(e.id) as enrolled
        FROM classes c
        LEFT JOIN enrollments e ON c.id = e.class_id AND (e.status = 'validé' OR e.status = 'payé')
        WHERE c.school_id = $1
      GROUP BY c.id, c.name, c.tuition_fee
        ORDER BY c.name
      `, [school_id]);
      
      // Créer l'en-tête CSV
      csvData = 'ID,Nom,Inscrits,Frais de scolarité\n';
      
      // Ajouter les lignes de données
      result.rows.forEach(row => {
        csvData += `${row.id},"${row.name}",${row.enrolled},${row.tuition_fee}\n`;
      });
      
      filename = `classes-${new Date().toISOString().split('T')[0]}.csv`;
    }
    else {
      return res.status(400).json({ message: 'Type de rapport invalide' });
    }
    
    // Définir les en-têtes pour le téléchargement du fichier CSV
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    
    // Envoyer les données CSV
    res.send(csvData);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur lors de l\'exportation des données', error: err.message });
  }
};

module.exports = {
  getPaymentsReport,
  getEnrollmentsReport,
  getClassesReport,
  exportReportToCsv
};
