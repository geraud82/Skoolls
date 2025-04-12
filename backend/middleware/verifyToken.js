const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  console.log('🔐 Vérification du token d\'authentification');
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    console.log('❌ Token manquant dans les headers');
    console.log('📝 Headers reçus:', JSON.stringify(req.headers));
    return res.status(401).json({ message: 'Token manquant' });
  }

  console.log('📝 Header d\'autorisation reçu:', authHeader);
  
  // Vérifier le format du header d'autorisation
  if (!authHeader.startsWith('Bearer ')) {
    console.log('❌ Format de token invalide (doit commencer par "Bearer ")');
    return res.status(401).json({ message: 'Format de token invalide' });
  }
  
  const token = authHeader.split(' ')[1];
  
  // Vérifier si le token est vide
  if (!token) {
    console.log('❌ Token vide après le préfixe "Bearer"');
    return res.status(401).json({ message: 'Token vide' });
  }
  
  try {
    console.log('🔑 Tentative de décodage du token avec JWT_SECRET');
    
    // Vérifier si JWT_SECRET est défini
    if (!process.env.JWT_SECRET) {
      console.error('❌ JWT_SECRET n\'est pas défini dans les variables d\'environnement');
      return res.status(500).json({ message: 'Erreur de configuration du serveur' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('✅ Token décodé avec succès:', decoded);
    
    // Vérifier si le token décodé contient un ID utilisateur
    if (!decoded.id) {
      console.log('❌ Token décodé ne contient pas d\'ID utilisateur:', decoded);
      return res.status(401).json({ message: 'Token invalide (ID utilisateur manquant)' });
    }
    
    req.user = decoded; // contient { id, role }
    next();
  } catch (err) {
    console.error('❌ Erreur lors de la vérification du token:', err.message);
    
    // Fournir des messages d'erreur plus spécifiques
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expiré', error: err.message });
    } else if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Token invalide', error: err.message });
    } else {
      return res.status(401).json({ message: 'Erreur d\'authentification', error: err.message });
    }
  }
};

module.exports = verifyToken;
