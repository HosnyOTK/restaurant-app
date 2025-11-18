const jwt = require('jsonwebtoken');
const db = require('../config/database');

// Middleware pour vérifier le token JWT
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token manquant' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'secret', async (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: 'Token invalide' });
    }

    try {
      // Récupérer l'utilisateur complet avec le rôle
      const user = await db.get('SELECT id, email, role, nom, prenom FROM clients WHERE id = ?', decoded.id);
      if (!user) {
        return res.status(403).json({ error: 'Utilisateur non trouvé' });
      }

      req.user = user;
      next();
    } catch (error) {
      return res.status(500).json({ error: 'Erreur serveur' });
    }
  });
};

// Middleware pour vérifier si l'utilisateur est admin
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentification requise' });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Accès refusé. Rôle admin requis.' });
  }

  next();
};

// Middleware pour vérifier si l'utilisateur est livreur ou admin
const requireLivreurOrAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentification requise' });
  }

  if (req.user.role !== 'livreur' && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Accès refusé. Rôle livreur ou admin requis.' });
  }

  next();
};

module.exports = {
  authenticateToken,
  requireAdmin,
  requireLivreurOrAdmin
};
