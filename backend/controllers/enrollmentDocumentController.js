const db = require('../config/db');
const fs = require('fs');
const path = require('path');

// Vérifier si l'utilisateur est le propriétaire de l'enfant
const isChildOwner = async (userId, childId) => {
  const result = await db.query(
    'SELECT * FROM children WHERE id = $1 AND user_id = $2',
    [childId, userId]
  );
  return result.rows.length > 0;
};

// Vérifier si l'utilisateur est associé à l'inscription
const isEnrollmentOwner = async (userId, enrollmentId) => {
  const result = await db.query(
    `SELECT e.* 
     FROM enrollments e
     JOIN children c ON e.child_id = c.id
     WHERE e.id = $1 AND c.user_id = $2`,
    [enrollmentId, userId]
  );
  return result.rows.length > 0;
};

// Vérifier si l'utilisateur est une école associée à l'inscription
const isEnrollmentSchool = async (userId, enrollmentId) => {
  const result = await db.query(
    `SELECT e.* 
     FROM enrollments e
     JOIN classes cl ON e.class_id = cl.id
     WHERE e.id = $1 AND cl.school_id = $2`,
    [enrollmentId, userId]
  );
  return result.rows.length > 0;
};

// Télécharger un document pour une inscription
const uploadEnrollmentDocument = async (req, res) => {
  try {
    const userId = req.user.id;
    const { enrollment_id, document_type, description } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ message: 'Aucun fichier téléchargé' });
    }
    
    if (!enrollment_id || !document_type) {
      // Supprimer le fichier si les paramètres sont incomplets
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ message: 'ID d\'inscription et type de document requis' });
    }
    
    // Vérifier si l'utilisateur est associé à l'inscription
    if (!(await isEnrollmentOwner(userId, enrollment_id))) {
      // Supprimer le fichier si l'utilisateur n'est pas autorisé
      fs.unlinkSync(req.file.path);
      return res.status(403).json({ message: 'Vous n\'êtes pas autorisé à télécharger des documents pour cette inscription' });
    }
    
    // Enregistrer les informations du document dans la base de données
    const result = await db.query(
      `INSERT INTO enrollment_documents 
       (enrollment_id, document_type, file_path, original_filename, mime_type, description, uploaded_by) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) 
       RETURNING *`,
      [
        enrollment_id,
        document_type,
        req.file.path,
        req.file.originalname,
        req.file.mimetype,
        description || null,
        userId
      ]
    );
    
    const document = result.rows[0];
    
    res.status(201).json({
      message: 'Document téléchargé avec succès',
      document: {
        id: document.id,
        enrollment_id: document.enrollment_id,
        document_type: document.document_type,
        original_filename: document.original_filename,
        description: document.description,
        created_at: document.created_at
      }
    });
  } catch (err) {
    console.error('Erreur lors du téléchargement du document:', err);
    
    // Supprimer le fichier en cas d'erreur
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({ message: 'Erreur lors du téléchargement du document', error: err.message });
  }
};

// Télécharger un document pour un enfant (avant inscription)
const uploadChildDocument = async (req, res) => {
  try {
    const userId = req.user.id;
    const { child_id, document_type, description } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ message: 'Aucun fichier téléchargé' });
    }
    
    if (!child_id || !document_type) {
      // Supprimer le fichier si les paramètres sont incomplets
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ message: 'ID de l\'enfant et type de document requis' });
    }
    
    // Vérifier si l'utilisateur est le propriétaire de l'enfant
    if (!(await isChildOwner(userId, child_id))) {
      // Supprimer le fichier si l'utilisateur n'est pas autorisé
      fs.unlinkSync(req.file.path);
      return res.status(403).json({ message: 'Vous n\'êtes pas autorisé à télécharger des documents pour cet enfant' });
    }
    
    // Enregistrer les informations du document dans la base de données
    const result = await db.query(
      `INSERT INTO child_documents 
       (child_id, document_type, file_path, original_filename, mime_type, description, uploaded_by) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) 
       RETURNING *`,
      [
        child_id,
        document_type,
        req.file.path,
        req.file.originalname,
        req.file.mimetype,
        description || null,
        userId
      ]
    );
    
    const document = result.rows[0];
    
    res.status(201).json({
      message: 'Document téléchargé avec succès',
      document: {
        id: document.id,
        child_id: document.child_id,
        document_type: document.document_type,
        original_filename: document.original_filename,
        description: document.description,
        created_at: document.created_at
      }
    });
  } catch (err) {
    console.error('Erreur lors du téléchargement du document:', err);
    
    // Supprimer le fichier en cas d'erreur
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({ message: 'Erreur lors du téléchargement du document', error: err.message });
  }
};

// Récupérer les documents d'une inscription
const getEnrollmentDocuments = async (req, res) => {
  try {
    const userId = req.user.id;
    const { enrollment_id } = req.params;
    
    if (!enrollment_id) {
      return res.status(400).json({ message: 'ID d\'inscription requis' });
    }
    
    // Vérifier si l'utilisateur est associé à l'inscription (parent ou école)
    const isOwner = await isEnrollmentOwner(userId, enrollment_id);
    const isSchool = await isEnrollmentSchool(userId, enrollment_id);
    
    if (!isOwner && !isSchool) {
      return res.status(403).json({ message: 'Vous n\'êtes pas autorisé à accéder aux documents de cette inscription' });
    }
    
    // Récupérer les documents
    const result = await db.query(
      `SELECT id, enrollment_id, document_type, original_filename, description, created_at
       FROM enrollment_documents
       WHERE enrollment_id = $1
       ORDER BY created_at DESC`,
      [enrollment_id]
    );
    
    res.json(result.rows);
  } catch (err) {
    console.error('Erreur lors de la récupération des documents:', err);
    res.status(500).json({ message: 'Erreur lors de la récupération des documents', error: err.message });
  }
};

// Récupérer les documents d'un enfant
const getChildDocuments = async (req, res) => {
  try {
    const userId = req.user.id;
    const { child_id } = req.params;
    
    if (!child_id) {
      return res.status(400).json({ message: 'ID de l\'enfant requis' });
    }
    
    // Vérifier si l'utilisateur est le propriétaire de l'enfant
    if (!(await isChildOwner(userId, child_id))) {
      return res.status(403).json({ message: 'Vous n\'êtes pas autorisé à accéder aux documents de cet enfant' });
    }
    
    // Récupérer les documents
    const result = await db.query(
      `SELECT id, child_id, document_type, original_filename, description, created_at
       FROM child_documents
       WHERE child_id = $1
       ORDER BY created_at DESC`,
      [child_id]
    );
    
    res.json(result.rows);
  } catch (err) {
    console.error('Erreur lors de la récupération des documents:', err);
    res.status(500).json({ message: 'Erreur lors de la récupération des documents', error: err.message });
  }
};

// Télécharger un document spécifique
const downloadDocument = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id, type } = req.params;
    
    if (!id || !type) {
      return res.status(400).json({ message: 'ID et type de document requis' });
    }
    
    let document;
    
    if (type === 'enrollment') {
      // Vérifier si l'utilisateur est associé à l'inscription (parent ou école)
      const documentQuery = await db.query(
        `SELECT d.*, e.id as enrollment_id
         FROM enrollment_documents d
         JOIN enrollments e ON d.enrollment_id = e.id
         WHERE d.id = $1`,
        [id]
      );
      
      if (documentQuery.rows.length === 0) {
        return res.status(404).json({ message: 'Document non trouvé' });
      }
      
      document = documentQuery.rows[0];
      
      const isOwner = await isEnrollmentOwner(userId, document.enrollment_id);
      const isSchool = await isEnrollmentSchool(userId, document.enrollment_id);
      
      if (!isOwner && !isSchool) {
        return res.status(403).json({ message: 'Vous n\'êtes pas autorisé à télécharger ce document' });
      }
    } else if (type === 'child') {
      // Vérifier si l'utilisateur est le propriétaire de l'enfant
      const documentQuery = await db.query(
        `SELECT d.*, c.id as child_id
         FROM child_documents d
         JOIN children c ON d.child_id = c.id
         WHERE d.id = $1`,
        [id]
      );
      
      if (documentQuery.rows.length === 0) {
        return res.status(404).json({ message: 'Document non trouvé' });
      }
      
      document = documentQuery.rows[0];
      
      if (!(await isChildOwner(userId, document.child_id))) {
        return res.status(403).json({ message: 'Vous n\'êtes pas autorisé à télécharger ce document' });
      }
    } else {
      return res.status(400).json({ message: 'Type de document invalide' });
    }
    
    // Vérifier si le fichier existe
    if (!fs.existsSync(document.file_path)) {
      return res.status(404).json({ message: 'Fichier non trouvé sur le serveur' });
    }
    
    // Envoyer le fichier
    res.download(document.file_path, document.original_filename);
  } catch (err) {
    console.error('Erreur lors du téléchargement du document:', err);
    res.status(500).json({ message: 'Erreur lors du téléchargement du document', error: err.message });
  }
};

// Supprimer un document
const deleteDocument = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id, type } = req.params;
    
    if (!id || !type) {
      return res.status(400).json({ message: 'ID et type de document requis' });
    }
    
    let document;
    
    if (type === 'enrollment') {
      // Vérifier si l'utilisateur est associé à l'inscription
      const documentQuery = await db.query(
        `SELECT d.*, e.id as enrollment_id
         FROM enrollment_documents d
         JOIN enrollments e ON d.enrollment_id = e.id
         WHERE d.id = $1`,
        [id]
      );
      
      if (documentQuery.rows.length === 0) {
        return res.status(404).json({ message: 'Document non trouvé' });
      }
      
      document = documentQuery.rows[0];
      
      if (!(await isEnrollmentOwner(userId, document.enrollment_id))) {
        return res.status(403).json({ message: 'Vous n\'êtes pas autorisé à supprimer ce document' });
      }
      
      // Supprimer le document de la base de données
      await db.query('DELETE FROM enrollment_documents WHERE id = $1', [id]);
    } else if (type === 'child') {
      // Vérifier si l'utilisateur est le propriétaire de l'enfant
      const documentQuery = await db.query(
        `SELECT d.*, c.id as child_id
         FROM child_documents d
         JOIN children c ON d.child_id = c.id
         WHERE d.id = $1`,
        [id]
      );
      
      if (documentQuery.rows.length === 0) {
        return res.status(404).json({ message: 'Document non trouvé' });
      }
      
      document = documentQuery.rows[0];
      
      if (!(await isChildOwner(userId, document.child_id))) {
        return res.status(403).json({ message: 'Vous n\'êtes pas autorisé à supprimer ce document' });
      }
      
      // Supprimer le document de la base de données
      await db.query('DELETE FROM child_documents WHERE id = $1', [id]);
    } else {
      return res.status(400).json({ message: 'Type de document invalide' });
    }
    
    // Supprimer le fichier du système de fichiers
    if (fs.existsSync(document.file_path)) {
      fs.unlinkSync(document.file_path);
    }
    
    res.json({ message: 'Document supprimé avec succès' });
  } catch (err) {
    console.error('Erreur lors de la suppression du document:', err);
    res.status(500).json({ message: 'Erreur lors de la suppression du document', error: err.message });
  }
};

module.exports = {
  uploadEnrollmentDocument,
  uploadChildDocument,
  getEnrollmentDocuments,
  getChildDocuments,
  downloadDocument,
  deleteDocument
};
