const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configuration du stockage pour les documents d'inscription
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Créer un dossier spécifique pour les documents d'inscription
    const uploadPath = path.join(__dirname, '../uploads/documents');
    
    // Créer le répertoire s'il n'existe pas
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    // Générer un nom de fichier unique avec l'ID de l'utilisateur et le type de document
    const userId = req.user.id;
    const childId = req.body.child_id || 'new';
    const documentType = req.body.document_type || 'document';
    const fileExt = path.extname(file.originalname);
    const fileName = `${documentType}_${userId}_${childId}_${Date.now()}${fileExt}`;
    cb(null, fileName);
  }
});

// Filtre pour accepter les types de documents courants
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'application/pdf', 
    'image/jpeg', 
    'image/jpg', 
    'image/png',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Type de fichier non pris en charge. Formats acceptés: PDF, JPEG, PNG, DOC, DOCX, XLS, XLSX'), false);
  }
};

// Middleware de téléchargement de documents
const uploadDocument = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB max
  },
  fileFilter: fileFilter
});

module.exports = uploadDocument;
