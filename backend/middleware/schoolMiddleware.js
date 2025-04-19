const schoolMiddleware = (req, res, next) => {
  console.log('🔒 Vérification des droits école');
  
  // Vérifier si l'utilisateur est connecté et a un rôle
  if (!req.user || !req.user.role) {
    console.log('❌ Utilisateur non authentifié ou rôle manquant');
    return res.status(401).json({ message: 'Accès non autorisé' });
  }
  
  // Vérifier si l'utilisateur est une école
  if (req.user.role !== 'ecole') {
    console.log(`❌ Accès refusé pour le rôle: ${req.user.role}`);
    return res.status(403).json({ message: 'Accès réservé aux écoles' });
  }
  
  console.log('✅ Accès école autorisé');
  next();
};

module.exports = schoolMiddleware;
