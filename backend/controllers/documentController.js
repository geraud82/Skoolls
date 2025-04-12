const db = require('../config/db');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');
require('dotenv').config();

// Vérifier si l'utilisateur est une école
const isSchool = async (user_id) => {
  const result = await db.query("SELECT role FROM users WHERE id = $1", [user_id]);
  return result.rows.length > 0 && result.rows[0].role === 'ecole';
};

// Vérifier si l'utilisateur est un parent
const isParent = async (user_id) => {
  const result = await db.query("SELECT role FROM users WHERE id = $1", [user_id]);
  return result.rows.length > 0 && result.rows[0].role === 'parent';
};

// Générer un numéro de facture unique
const generateInvoiceNumber = async () => {
  const date = new Date();
  const year = date.getFullYear().toString().substr(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  
  // Récupérer le dernier numéro de facture pour ce mois
  const result = await db.query(
    "SELECT MAX(invoice_number) as last_number FROM invoices WHERE invoice_number LIKE $1",
    [`INV-${year}${month}-%`]
  );
  
  const lastNumber = result.rows[0].last_number;
  let sequence = 1;
  
  if (lastNumber) {
    const parts = lastNumber.split('-');
    sequence = parseInt(parts[2]) + 1;
  }
  
  return `INV-${year}${month}-${sequence.toString().padStart(4, '0')}`;
};

// Générer un numéro de reçu unique
const generateReceiptNumber = async () => {
  const date = new Date();
  const year = date.getFullYear().toString().substr(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  
  // Récupérer le dernier numéro de reçu pour ce mois
  const result = await db.query(
    "SELECT MAX(receipt_number) as last_number FROM receipts WHERE receipt_number LIKE $1",
    [`REC-${year}${month}-%`]
  );
  
  const lastNumber = result.rows[0].last_number;
  let sequence = 1;
  
  if (lastNumber) {
    const parts = lastNumber.split('-');
    sequence = parseInt(parts[2]) + 1;
  }
  
  return `REC-${year}${month}-${sequence.toString().padStart(4, '0')}`;
};

// Créer un dossier temporaire pour les PDF si nécessaire
const ensureTempDir = () => {
  const tempDir = path.join(__dirname, '../temp');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
  return tempDir;
};

// Générer une facture PDF
const generateInvoicePDF = async (invoice) => {
  const tempDir = ensureTempDir();
  const filePath = path.join(tempDir, `facture-${invoice.id}.pdf`);
  
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const writeStream = fs.createWriteStream(filePath);
      
      doc.pipe(writeStream);
      
      // En-tête
      doc.fontSize(20).text('FACTURE', { align: 'center' });
      doc.moveDown();
      doc.fontSize(10).text(`Numéro de facture: ${invoice.invoice_number}`, { align: 'right' });
      doc.fontSize(10).text(`Date: ${new Date(invoice.created_at).toLocaleDateString()}`, { align: 'right' });
      doc.moveDown();
      
      // Informations de l'école
      doc.fontSize(12).text('De:', { continued: true }).fontSize(14).text(` ${invoice.school_name}`);
      doc.fontSize(10).text(`Email: ${invoice.school_email}`);
      doc.moveDown();
      
      // Informations du parent/élève
      doc.fontSize(12).text('À:', { continued: true }).fontSize(14).text(` ${invoice.parent_name}`);
      doc.fontSize(10).text(`Email: ${invoice.parent_email}`);
      doc.fontSize(10).text(`Élève: ${invoice.child_name}`);
      doc.moveDown();
      
      // Détails de la facture
      doc.fontSize(12).text('Détails:');
      
      // Tableau des détails
      const tableTop = doc.y + 10;
      const tableLeft = 50;
      
      // En-têtes du tableau
      doc.fontSize(10)
        .text('Description', tableLeft, tableTop)
        .text('Montant', 400, tableTop);
      
      doc.moveTo(tableLeft, tableTop + 20)
        .lineTo(550, tableTop + 20)
        .stroke();
      
      // Ligne de détail
      const detailTop = tableTop + 30;
      doc.fontSize(10)
        .text(`Frais de scolarité - ${invoice.class_name}`, tableLeft, detailTop)
        .text(`${invoice.amount.toLocaleString()} FCFA`, 400, detailTop);
      
      // Total
      doc.moveTo(tableLeft, detailTop + 30)
        .lineTo(550, detailTop + 30)
        .stroke();
      
      doc.fontSize(12)
        .text('Total:', 350, detailTop + 40)
        .text(`${invoice.amount.toLocaleString()} FCFA`, 400, detailTop + 40);
      
      // Statut
      doc.moveDown(2);
      doc.fontSize(12).text(`Statut: ${invoice.status.toUpperCase()}`, { align: 'center' });
      
      // Pied de page
      doc.fontSize(10).text('Cette facture a été générée automatiquement par SchoolPay.', { align: 'center' });
      
      doc.end();
      
      writeStream.on('finish', () => {
        resolve(filePath);
      });
      
      writeStream.on('error', (err) => {
        reject(err);
      });
    } catch (err) {
      reject(err);
    }
  });
};

// Générer un reçu PDF
const generateReceiptPDF = async (receipt) => {
  const tempDir = ensureTempDir();
  const filePath = path.join(tempDir, `recu-${receipt.id}.pdf`);
  
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const writeStream = fs.createWriteStream(filePath);
      
      doc.pipe(writeStream);
      
      // En-tête
      doc.fontSize(20).text('REÇU DE PAIEMENT', { align: 'center' });
      doc.moveDown();
      doc.fontSize(10).text(`Numéro de reçu: ${receipt.receipt_number}`, { align: 'right' });
      doc.fontSize(10).text(`Date: ${new Date(receipt.created_at).toLocaleDateString()}`, { align: 'right' });
      doc.moveDown();
      
      // Informations de l'école
      doc.fontSize(12).text('École:', { continued: true }).fontSize(14).text(` ${receipt.school_name}`);
      doc.moveDown();
      
      // Informations du parent/élève
      doc.fontSize(12).text('Parent:', { continued: true }).fontSize(14).text(` ${receipt.parent_name}`);
      doc.fontSize(10).text(`Élève: ${receipt.child_name}`);
      doc.fontSize(10).text(`Classe: ${receipt.class_name}`);
      doc.moveDown();
      
      // Détails du paiement
      doc.fontSize(12).text('Détails du paiement:');
      doc.moveDown();
      
      doc.fontSize(10).text(`Montant payé: ${receipt.amount.toLocaleString()} FCFA`);
      doc.fontSize(10).text(`Méthode de paiement: ${receipt.payment_method}`);
      doc.fontSize(10).text(`Date de paiement: ${new Date(receipt.payment_date).toLocaleDateString()}`);
      
      // Confirmation
      doc.moveDown(2);
      doc.fontSize(12).text('Paiement reçu avec succès', { align: 'center' });
      
      // Pied de page
      doc.moveDown(2);
      doc.fontSize(10).text('Ce reçu a été généré automatiquement par SchoolPay.', { align: 'center' });
      
      doc.end();
      
      writeStream.on('finish', () => {
        resolve(filePath);
      });
      
      writeStream.on('error', (err) => {
        reject(err);
      });
    } catch (err) {
      reject(err);
    }
  });
};

// Configurer le transporteur d'email
const configureMailTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: process.env.MAIL_PORT,
    secure: process.env.MAIL_SECURE === 'true',
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASSWORD
    }
  });
};

// Générer une facture
const generateInvoice = async (req, res) => {
  const { enrollment_id } = req.body;
  const user_id = req.user.id;
  
  if (!enrollment_id) {
    return res.status(400).json({ message: 'ID d\'inscription requis' });
  }
  
  try {
    // Vérifier si l'utilisateur est une école
    if (!(await isSchool(user_id))) {
      return res.status(403).json({ message: 'Accès refusé. Seules les écoles peuvent générer des factures.' });
    }
    
    // Vérifier si l'inscription existe et appartient à l'école
    const enrollmentCheck = await db.query(`
      SELECT 
        e.id, 
        e.status, 
        c.name as child_name, 
        c.user_id as parent_id,
        u.email as parent_email,
        u.name as parent_name,
        cl.name as class_name, 
        cl.tuition_fee as amount,
        cl.school_id,
        s.name as school_name,
        s.email as school_email
      FROM enrollments e
      JOIN children c ON e.child_id = c.id
      JOIN users u ON c.user_id = u.id
      JOIN classes cl ON e.class_id = cl.id
      JOIN users s ON cl.school_id = s.id
      WHERE e.id = $1 AND cl.school_id = $2
    `, [enrollment_id, user_id]);
    
    if (enrollmentCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Inscription non trouvée ou n\'appartient pas à cette école' });
    }
    
    const enrollmentData = enrollmentCheck.rows[0];
    
    // Vérifier si une facture existe déjà pour cette inscription
    const invoiceCheck = await db.query(
      'SELECT id FROM invoices WHERE enrollment_id = $1',
      [enrollment_id]
    );
    
    if (invoiceCheck.rows.length > 0) {
      return res.status(400).json({ message: 'Une facture existe déjà pour cette inscription' });
    }
    
    // Générer un numéro de facture
    const invoiceNumber = await generateInvoiceNumber();
    
    // Créer la facture dans la base de données
    const invoiceResult = await db.query(`
      INSERT INTO invoices (
        enrollment_id, 
        invoice_number, 
        amount, 
        status, 
        parent_id, 
        school_id
      ) 
      VALUES ($1, $2, $3, $4, $5, $6) 
      RETURNING id, created_at
    `, [
      enrollment_id,
      invoiceNumber,
      enrollmentData.amount,
      enrollmentData.status,
      enrollmentData.parent_id,
      enrollmentData.school_id
    ]);
    
    const invoiceId = invoiceResult.rows[0].id;
    const createdAt = invoiceResult.rows[0].created_at;
    
    // Construire l'objet facture complet
    const invoice = {
      id: invoiceId,
      invoice_number: invoiceNumber,
      enrollment_id,
      amount: parseFloat(enrollmentData.amount),
      status: enrollmentData.status,
      created_at: createdAt,
      child_name: enrollmentData.child_name,
      class_name: enrollmentData.class_name,
      parent_name: enrollmentData.parent_name,
      parent_email: enrollmentData.parent_email,
      school_name: enrollmentData.school_name,
      school_email: enrollmentData.school_email
    };
    
    res.status(201).json({
      message: 'Facture générée avec succès',
      invoice
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur lors de la génération de la facture', error: err.message });
  }
};

// Récupérer les factures
const getInvoices = async (req, res) => {
  const user_id = req.user.id;
  
  try {
    const role = await db.query("SELECT role FROM users WHERE id = $1", [user_id]);
    
    if (role.rows.length === 0) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    
    let query;
    let params;
    
    if (role.rows[0].role === 'ecole') {
      // Pour les écoles, récupérer toutes les factures liées à leurs classes
      query = `
        SELECT 
          i.id, 
          i.amount, 
          i.status, 
          i.issued_at as created_at,
          ch.user_id as parent_id,
          cl.school_id,
          ch.first_name || ' ' || ch.last_name as child_name,
          cl.name as class_name,
          u_parent.name as parent_name,
          u_school.name as school_name
        FROM invoices i
        JOIN enrollments e ON i.enrollment_id = e.id
        JOIN children ch ON e.child_id = ch.id
        JOIN classes cl ON e.class_id = cl.id
        JOIN users u_parent ON ch.user_id = u_parent.id
        JOIN users u_school ON cl.school_id = u_school.id
        WHERE cl.school_id = $1
        ORDER BY i.issued_at DESC
      `;
      params = [user_id];
    } else {
      // Pour les parents, récupérer toutes les factures liées à leurs enfants
      query = `
        SELECT 
          i.id, 
          i.amount, 
          i.status, 
          i.issued_at as created_at,
          ch.user_id as parent_id,
          cl.school_id,
          ch.first_name || ' ' || ch.last_name as child_name,
          cl.name as class_name,
          u_parent.name as parent_name,
          u_school.name as school_name
        FROM invoices i
        JOIN enrollments e ON i.enrollment_id = e.id
        JOIN children ch ON e.child_id = ch.id
        JOIN classes cl ON e.class_id = cl.id
        JOIN users u_parent ON ch.user_id = u_parent.id
        JOIN users u_school ON cl.school_id = u_school.id
        WHERE ch.user_id = $1
        ORDER BY i.issued_at DESC
      `;
      params = [user_id];
    }
    
    const result = await db.query(query, params);
    
    // Ajouter un numéro de facture généré à partir de l'ID
    const invoicesWithNumber = result.rows.map(invoice => ({
      ...invoice,
      invoice_number: `INV-${String(invoice.id).padStart(6, '0')}`,
      amount: parseFloat(invoice.amount)
    }));
    
    res.json(invoicesWithNumber);
  } catch (err) {
    console.error('Erreur dans getInvoices:', err);
    res.status(500).json({ message: 'Erreur lors de la récupération des factures', error: err.message });
  }
};

// Télécharger une facture
const downloadInvoice = async (req, res) => {
  const { id } = req.params;
  const user_id = req.user.id;
  
  try {
    // Vérifier si la facture existe et si l'utilisateur a le droit de la télécharger
    const invoiceCheck = await db.query(`
      SELECT 
        i.id, 
        i.invoice_number, 
        i.amount, 
        i.status, 
        i.created_at,
        i.parent_id,
        i.school_id,
        c.name as child_name,
        cl.name as class_name,
        u.name as parent_name,
        u.email as parent_email,
        s.name as school_name,
        s.email as school_email
      FROM invoices i
      JOIN enrollments e ON i.enrollment_id = e.id
      JOIN children c ON e.child_id = c.id
      JOIN users u ON c.user_id = u.id
      JOIN classes cl ON e.class_id = cl.id
      JOIN users s ON cl.school_id = s.id
      WHERE i.id = $1 AND (i.parent_id = $2 OR i.school_id = $2)
    `, [id, user_id]);
    
    if (invoiceCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Facture non trouvée ou accès refusé' });
    }
    
    const invoice = {
      ...invoiceCheck.rows[0],
      amount: parseFloat(invoiceCheck.rows[0].amount)
    };
    
    // Générer le PDF
    const pdfPath = await generateInvoicePDF(invoice);
    
    // Envoyer le fichier
    res.download(pdfPath, `facture-${invoice.invoice_number}.pdf`, (err) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: 'Erreur lors du téléchargement de la facture' });
      }
      
      // Supprimer le fichier temporaire après l'envoi
      fs.unlink(pdfPath, (err) => {
        if (err) console.error('Erreur lors de la suppression du fichier temporaire:', err);
      });
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur lors du téléchargement de la facture', error: err.message });
  }
};

// Envoyer une facture par email
const sendInvoiceByEmail = async (req, res) => {
  const { id } = req.params;
  const user_id = req.user.id;
  
  try {
    // Vérifier si l'utilisateur est une école
    if (!(await isSchool(user_id))) {
      return res.status(403).json({ message: 'Accès refusé. Seules les écoles peuvent envoyer des factures.' });
    }
    
    // Vérifier si la facture existe et appartient à l'école
    const invoiceCheck = await db.query(`
      SELECT 
        i.id, 
        i.invoice_number, 
        i.amount, 
        i.status, 
        i.created_at,
        i.parent_id,
        i.school_id,
        c.name as child_name,
        cl.name as class_name,
        u.name as parent_name,
        u.email as parent_email,
        s.name as school_name,
        s.email as school_email
      FROM invoices i
      JOIN enrollments e ON i.enrollment_id = e.id
      JOIN children c ON e.child_id = c.id
      JOIN users u ON c.user_id = u.id
      JOIN classes cl ON e.class_id = cl.id
      JOIN users s ON cl.school_id = s.id
      WHERE i.id = $1 AND i.school_id = $2
    `, [id, user_id]);
    
    if (invoiceCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Facture non trouvée ou n\'appartient pas à cette école' });
    }
    
    const invoice = {
      ...invoiceCheck.rows[0],
      amount: parseFloat(invoiceCheck.rows[0].amount)
    };
    
    // Générer le PDF
    const pdfPath = await generateInvoicePDF(invoice);
    
    // Configurer le transporteur d'email
    const transporter = configureMailTransporter();
    
    // Envoyer l'email
    await transporter.sendMail({
      from: `"${invoice.school_name}" <${process.env.MAIL_USER}>`,
      to: invoice.parent_email,
      subject: `Facture #${invoice.invoice_number} - ${invoice.school_name}`,
      text: `Bonjour ${invoice.parent_name},\n\nVeuillez trouver ci-joint la facture #${invoice.invoice_number} pour les frais de scolarité de ${invoice.child_name} en classe de ${invoice.class_name}.\n\nMontant: ${invoice.amount.toLocaleString()} FCFA\nStatut: ${invoice.status}\n\nCordialement,\n${invoice.school_name}`,
      html: `
        <p>Bonjour ${invoice.parent_name},</p>
        <p>Veuillez trouver ci-joint la facture #${invoice.invoice_number} pour les frais de scolarité de <strong>${invoice.child_name}</strong> en classe de <strong>${invoice.class_name}</strong>.</p>
        <p>
          <strong>Montant:</strong> ${invoice.amount.toLocaleString()} FCFA<br>
          <strong>Statut:</strong> ${invoice.status}
        </p>
        <p>Cordialement,<br>${invoice.school_name}</p>
      `,
      attachments: [
        {
          filename: `facture-${invoice.invoice_number}.pdf`,
          path: pdfPath
        }
      ]
    });
    
    // Supprimer le fichier temporaire après l'envoi
    fs.unlink(pdfPath, (err) => {
      if (err) console.error('Erreur lors de la suppression du fichier temporaire:', err);
    });
    
    res.json({ message: 'Facture envoyée par email avec succès' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur lors de l\'envoi de la facture par email', error: err.message });
  }
};

// Récupérer les reçus
const getReceipts = async (req, res) => {
  const user_id = req.user.id;
  
  try {
    const role = await db.query("SELECT role FROM users WHERE id = $1", [user_id]);
    
    if (role.rows.length === 0) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    
    let query;
    let params;
    
    if (role.rows[0].role === 'ecole') {
      // Pour les écoles, récupérer tous les reçus liés à leurs classes
      query = `
        SELECT 
          r.id, 
          r.amount, 
          r.payment_method, 
          r.created_at,
          r.invoice_id,
          ch.first_name || ' ' || ch.last_name as child_name,
          cl.name as class_name,
          u_parent.name as parent_name,
          u_school.name as school_name
        FROM receipts r
        JOIN invoices i ON r.invoice_id = i.id
        JOIN enrollments e ON i.enrollment_id = e.id
        JOIN children ch ON e.child_id = ch.id
        JOIN classes cl ON e.class_id = cl.id
        JOIN users u_parent ON ch.user_id = u_parent.id
        JOIN users u_school ON cl.school_id = u_school.id
        WHERE cl.school_id = $1
        ORDER BY r.created_at DESC
      `;
      params = [user_id];
    } else {
      // Pour les parents, récupérer tous les reçus liés à leurs enfants
      query = `
        SELECT 
          r.id, 
          r.amount, 
          r.payment_method, 
          r.created_at,
          r.invoice_id,
          ch.first_name || ' ' || ch.last_name as child_name,
          cl.name as class_name,
          u_parent.name as parent_name,
          u_school.name as school_name
        FROM receipts r
        JOIN invoices i ON r.invoice_id = i.id
        JOIN enrollments e ON i.enrollment_id = e.id
        JOIN children ch ON e.child_id = ch.id
        JOIN classes cl ON e.class_id = cl.id
        JOIN users u_parent ON ch.user_id = u_parent.id
        JOIN users u_school ON cl.school_id = u_school.id
        WHERE ch.user_id = $1
        ORDER BY r.created_at DESC
      `;
      params = [user_id];
    }
    
    const result = await db.query(query, params);
    
    // Ajouter un numéro de reçu généré à partir de l'ID
    const receiptsWithNumber = result.rows.map(receipt => ({
      ...receipt,
      receipt_number: `REC-${String(receipt.id).padStart(6, '0')}`,
      amount: parseFloat(receipt.amount),
      payment_date: receipt.created_at // Utiliser created_at comme payment_date
    }));
    
    res.json(receiptsWithNumber);
  } catch (err) {
    console.error('Erreur dans getReceipts:', err);
    res.status(500).json({ message: 'Erreur lors de la récupération des reçus', error: err.message });
  }
};

// Télécharger un reçu
const downloadReceipt = async (req, res) => {
  const { id } = req.params;
  const user_id = req.user.id;
  
  try {
    // Vérifier si le reçu existe et si l'utilisateur a le droit de le télécharger
    const receiptCheck = await db.query(`
      SELECT 
        r.id, 
        r.receipt_number, 
        r.amount, 
        r.payment_method, 
        r.created_at,
        r.created_at as payment_date,
        ch.first_name || ' ' || ch.last_name as child_name,
        cl.name as class_name,
        u_parent.name as parent_name,
        u_school.name as school_name
      FROM receipts r
      JOIN invoices i ON r.invoice_id = i.id
      JOIN enrollments e ON i.enrollment_id = e.id
      JOIN children ch ON e.child_id = ch.id
      JOIN classes cl ON e.class_id = cl.id
      JOIN users u_parent ON ch.user_id = u_parent.id
      JOIN users u_school ON cl.school_id = u_school.id
      WHERE r.id = $1 AND (ch.user_id = $2 OR cl.school_id = $2)
    `, [id, user_id]);
    
    if (receiptCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Reçu non trouvé ou accès refusé' });
    }
    
    const receipt = {
      ...receiptCheck.rows[0],
      amount: parseFloat(receiptCheck.rows[0].amount)
    };
    
    // Générer le PDF
    const pdfPath = await generateReceiptPDF(receipt);
    
    // Envoyer le fichier
    res.download(pdfPath, `recu-${receipt.receipt_number}.pdf`, (err) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: 'Erreur lors du téléchargement du reçu' });
      }
      
      // Supprimer le fichier temporaire après l'envoi
      fs.unlink(pdfPath, (err) => {
        if (err) console.error('Erreur lors de la suppression du fichier temporaire:', err);
      });
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur lors du téléchargement du reçu', error: err.message });
  }
};

// Générer un reçu automatiquement après un paiement
const generateReceiptAfterPayment = async (payment_id) => {
  try {
    // Récupérer les informations du paiement
    const paymentInfo = await db.query(`
      SELECT 
        p.id, 
        p.amount, 
        p.method as payment_method, 
        p.date as payment_date,
        e.id as enrollment_id,
        i.id as invoice_id,
        ch.first_name || ' ' || ch.last_name as child_name,
        ch.user_id as parent_id,
        cl.name as class_name,
        cl.school_id,
        u_parent.name as parent_name,
        u_school.name as school_name
      FROM payments p
      JOIN enrollments e ON p.enrollment_id = e.id
      JOIN invoices i ON i.enrollment_id = e.id
      JOIN children ch ON e.child_id = ch.id
      JOIN users u_parent ON ch.user_id = u_parent.id
      JOIN classes cl ON e.class_id = cl.id
      JOIN users u_school ON cl.school_id = u_school.id
      WHERE p.id = $1
    `, [payment_id]);
    
    if (paymentInfo.rows.length === 0) {
      throw new Error('Paiement non trouvé');
    }
    
    const payment = paymentInfo.rows[0];
    
    // Vérifier si un reçu existe déjà pour ce paiement
    const receiptCheck = await db.query(
      'SELECT id FROM receipts WHERE invoice_id = $1',
      [payment.invoice_id]
    );
    
    if (receiptCheck.rows.length > 0) {
      throw new Error('Un reçu existe déjà pour cette facture');
    }
    
    // Générer un numéro de reçu
    const receiptNumber = await generateReceiptNumber();
    
    // Créer le reçu dans la base de données
    await db.query(`
      INSERT INTO receipts (
        invoice_id, 
        receipt_number, 
        amount, 
        payment_method
      ) 
      VALUES ($1, $2, $3, $4)
    `, [
      payment.invoice_id,
      receiptNumber,
      payment.amount,
      payment.payment_method
    ]);
    
    return true;
  } catch (err) {
    console.error('Erreur lors de la génération du reçu:', err);
    return false;
  }
};

module.exports = {
  generateInvoice,
  getInvoices,
  downloadInvoice,
  sendInvoiceByEmail,
  getReceipts,
  downloadReceipt,
  generateReceiptAfterPayment
};
