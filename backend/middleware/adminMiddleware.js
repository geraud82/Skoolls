const adminMiddleware = (req, res, next) => {
  console.log('🔒 Vérification des droits administrateur');
  
  // Vérifier si l'utilisateur est connecté et a un rôle
  if (!req.user || !req.user.role) {
    console.log('❌ Utilisateur non authentifié ou rôle manquant');
    return res.status(401).json({ message: 'Accès non autorisé' });
  }
  
  // Vérifier si l'utilisateur est un administrateur
  if (req.user.role !== 'admin') {
    console.log(`❌ Accès refusé pour le rôle: ${req.user.role}`);
    return res.status(403).json({ message: 'Accès réservé aux administrateurs' });
  }
  
  console.log('✅ Accès administrateur autorisé');
  next();
};

module.exports = adminMiddleware;
