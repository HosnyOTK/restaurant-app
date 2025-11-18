const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken, requireLivreurOrAdmin } = require('../middleware/auth');

// Fonction helper pour obtenir l'instance io
function getIO(req) {
  return req.app.get('io');
}

// Toutes les routes livreur nécessitent l'authentification
router.use(authenticateToken);
router.use(requireLivreurOrAdmin);

// Obtenir les commandes attribuées au livreur connecté (tous statuts pour les livreurs)
router.get('/commandes', async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Les livreurs voient uniquement leurs commandes attribuées (tous statuts)
    // Les admins ne doivent pas utiliser cet endpoint
    if (req.user.role !== 'livreur') {
      return res.status(403).json({ error: 'Accès réservé aux livreurs' });
    }
    
    let query = `
      SELECT c.*, 
             cl.nom as client_nom, cl.prenom as client_prenom, cl.telephone as client_telephone,
             r.nom as restaurant_nom, r.adresse as restaurant_adresse
      FROM commandes c
      LEFT JOIN clients cl ON c.client_id = cl.id
      LEFT JOIN restaurants r ON c.restaurant_id = r.id
      WHERE c.livreur_id = ?
      ORDER BY 
        CASE c.statut
          WHEN 'ready' THEN 1
          WHEN 'preparing' THEN 2
          WHEN 'confirmed' THEN 3
          WHEN 'pending' THEN 4
          WHEN 'delivered' THEN 5
          WHEN 'annulee' THEN 6
          ELSE 7
        END,
        c.date_commande ASC
    `;
    
    const commandes = await db.all(query, userId);

    res.json(commandes);
  } catch (error) {
    console.error('Erreur lors de la récupération des commandes:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Obtenir les commandes attribuées au livreur connecté (ancien endpoint pour compatibilité admin)
router.get('/commandes/ready', async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Si c'est un admin, il voit toutes les commandes ready
    // Sinon, le livreur ne voit que ses commandes attribuées
    let query = `
      SELECT c.*, 
             cl.nom as client_nom, cl.prenom as client_prenom, cl.telephone as client_telephone,
             r.nom as restaurant_nom, r.adresse as restaurant_adresse
      FROM commandes c
      LEFT JOIN clients cl ON c.client_id = cl.id
      LEFT JOIN restaurants r ON c.restaurant_id = r.id
      WHERE c.statut = 'ready'
    `;
    
    if (req.user.role === 'livreur') {
      query += ` AND c.livreur_id = ?`;
    }
    
    query += ` ORDER BY c.date_commande ASC`;
    
    const params = req.user.role === 'livreur' ? [userId] : [];
    const commandes = await db.all(query, ...params);

    // Les détails sont uniquement envoyés aux admins, pas aux livreurs
    const commandesAvecDetails = await Promise.all(commandes.map(async (commande) => {
      // Seuls les admins reçoivent les détails complets
      if (req.user.role === 'admin') {
        const details = await db.all(`
          SELECT cd.*, p.nom as plat_nom
          FROM commande_details cd
          JOIN plats p ON cd.plat_id = p.id
          WHERE cd.commande_id = ?
        `, commande.id);

        return {
          ...commande,
          details
        };
      } else {
        // Les livreurs ne reçoivent pas les détails
        return {
          ...commande,
          details: null
        };
      }
    }));

    res.json(commandesAvecDetails);
  } catch (error) {
    console.error('Erreur lors de la récupération des commandes:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Marquer une commande comme livrée (seulement pour les livreurs)
router.patch('/commandes/:id/delivered', async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Vérifier que la commande existe et est attribuée au livreur
    const commande = await db.get('SELECT statut, livreur_id FROM commandes WHERE id = ?', req.params.id);
    
    if (!commande) {
      return res.status(404).json({ error: 'Commande non trouvée' });
    }

    if (commande.statut !== 'ready' && commande.statut !== 'preparing') {
      return res.status(400).json({ error: 'La commande doit être en statut "ready" ou "preparing" pour être livrée' });
    }

    // Vérifier que la commande est attribuée au livreur connecté (sauf pour les admins)
    if (req.user.role === 'livreur' && commande.livreur_id !== userId) {
      return res.status(403).json({ error: 'Cette commande n\'est pas attribuée à vous' });
    }

    // Seuls les livreurs peuvent passer de 'ready' à 'delivered'
    // Les admins peuvent faire n'importe quelle transition via /api/admin
    if (req.user.role === 'livreur') {
      await db.run('UPDATE commandes SET statut = ?, date_livraison = datetime("now") WHERE id = ?', 'delivered', req.params.id);
      
      // Récupérer les informations de la commande pour les notifications
      const commandeComplete = await db.get(`
        SELECT c.*, 
               cl.nom as client_nom, cl.prenom as client_prenom
        FROM commandes c
        LEFT JOIN clients cl ON c.client_id = cl.id
        WHERE c.id = ?
      `, req.params.id);

      // Émettre des notifications
      const io = getIO(req);
      if (io && commandeComplete) {
        // Notification au client
        if (commandeComplete.client_id) {
          io.to(`client-${commandeComplete.client_id}`).emit('commande-livree', {
            type: 'commande-livree',
            message: `Votre commande #${req.params.id} a été livrée !`,
            commandeId: req.params.id
          });
        }

        // Notification à l'admin
        io.to('admin').emit('commande-livree', {
          type: 'commande-livree',
          message: `La commande #${req.params.id} a été livrée par le livreur`,
          commandeId: req.params.id,
          livreur: req.user.prenom + ' ' + req.user.nom
        });
      }
    } else {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    res.json({ message: 'Commande marquée comme livrée' });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du statut:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
