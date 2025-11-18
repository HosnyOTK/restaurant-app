const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// Fonction helper pour obtenir l'instance io
function getIO(req) {
  return req.app.get('io');
}

// Fonction pour attribuer automatiquement une commande au livreur le moins chargé
async function attribuerCommandeAuto(commandeId) {
  try {
    // Récupérer tous les livreurs actifs
    const livreurs = await db.all(`
      SELECT id, nom, prenom, email
      FROM clients
      WHERE role = 'livreur'
    `);

    if (livreurs.length === 0) {
      console.log('Aucun livreur disponible pour l\'attribution automatique');
      return null;
    }

    // Pour chaque livreur, compter le nombre de commandes en cours (ready)
    const livreursAvecCharge = await Promise.all(livreurs.map(async (livreur) => {
      const charge = await db.get(`
        SELECT COUNT(*) as total
        FROM commandes
        WHERE livreur_id = ? AND statut = 'ready'
      `, livreur.id);
      
      return {
        ...livreur,
        charge: charge.total || 0
      };
    }));

    // Trouver le livreur avec la charge la plus faible
    livreursAvecCharge.sort((a, b) => a.charge - b.charge);
    const livreurSelectionne = livreursAvecCharge[0];

    // Attribuer la commande au livreur sélectionné
    await db.run(`
      UPDATE commandes
      SET livreur_id = ?
      WHERE id = ?
    `, livreurSelectionne.id, commandeId);

    console.log(`Commande #${commandeId} attribuée automatiquement à ${livreurSelectionne.prenom} ${livreurSelectionne.nom} (charge: ${livreurSelectionne.charge})`);
    
    return livreurSelectionne;
  } catch (error) {
    console.error('Erreur lors de l\'attribution automatique:', error);
    return null;
  }
}

// Créer une commande
router.post('/', async (req, res) => {
  try {
    const { items, adresse_livraison, telephone, notes, client_id, restaurant_id } = req.body;

    // Validation des données
    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'La commande doit contenir au moins un plat' });
    }

    if (!restaurant_id) {
      return res.status(400).json({ error: 'Le restaurant est requis' });
    }

    // Vérifier que la base de données est accessible
    try {
      await db.get('SELECT 1');
    } catch (dbError) {
      console.error('Erreur de connexion à la base de données:', dbError);
      return res.status(500).json({ error: 'Erreur de connexion à la base de données' });
    }

    // Calculer le total et vérifier les plats
    let total = 0;
    const platsVerifies = [];
    
    for (const item of items) {
      if (!item.plat_id || !item.quantite) {
        return res.status(400).json({ error: 'Données de plat invalides' });
      }

      const plat = await db.get('SELECT prix, restaurant_id, disponible FROM plats WHERE id = ?', item.plat_id);
      if (!plat) {
        return res.status(400).json({ error: `Plat avec ID ${item.plat_id} non trouvé` });
      }

      // Vérifier que le plat est disponible
      if (plat.disponible !== 1) {
        return res.status(400).json({ error: `Le plat "${item.plat_id}" n'est pas disponible` });
      }
      
      // Vérifier que tous les plats sont du même restaurant
      if (plat.restaurant_id != restaurant_id) {
        return res.status(400).json({ error: 'Tous les plats doivent être du même restaurant' });
      }
      
      const prix = parseFloat(plat.prix);
      const quantite = parseInt(item.quantite) || 1;
      if (quantite <= 0) {
        return res.status(400).json({ error: 'La quantité doit être supérieure à 0' });
      }
      
      total += prix * quantite;
      platsVerifies.push({ ...item, prix, plat });
    }

    // Créer la commande dans une transaction
    let commandeId;
    try {
      // Démarrer la transaction
      await db.run('BEGIN TRANSACTION');
      
      // Créer la commande
      const result = await db.run(`
        INSERT INTO commandes (client_id, restaurant_id, total, adresse_livraison, telephone, notes, statut) 
        VALUES (?, ?, ?, ?, ?, ?, 'pending')
      `, client_id || null, restaurant_id, total, adresse_livraison || null, telephone || null, notes || null);
      
      commandeId = result.lastID;

      // Ajouter les détails de la commande
      for (const item of platsVerifies) {
        const prix = parseFloat(item.prix);
        const quantite = parseInt(item.quantite) || 1;
        const sousTotal = prix * quantite;

        await db.run(`
          INSERT INTO commande_details (commande_id, plat_id, quantite, prix_unitaire, sous_total) 
          VALUES (?, ?, ?, ?, ?)
        `, commandeId, item.plat_id, quantite, prix, sousTotal);
      }

      // Commit de la transaction
      await db.run('COMMIT');
    } catch (error) {
      // Rollback en cas d'erreur
      try {
        await db.run('ROLLBACK');
      } catch (rollbackError) {
        console.error('Erreur lors du rollback:', rollbackError);
      }
      throw error;
    }

    // Récupérer la commande complète avec les informations du client et du restaurant
    const commande = await db.get(`
      SELECT c.*, 
             cl.nom as client_nom, cl.prenom as client_prenom, cl.email as client_email,
             r.nom as restaurant_nom
      FROM commandes c
      LEFT JOIN clients cl ON c.client_id = cl.id
      LEFT JOIN restaurants r ON c.restaurant_id = r.id
      WHERE c.id = ?
    `, commandeId);

    if (!commande) {
      return res.status(500).json({ error: 'Erreur lors de la récupération de la commande' });
    }

    // Récupérer les détails de la commande
    const details = await db.all(`
      SELECT cd.*, p.nom as plat_nom, p.image_url as plat_image
      FROM commande_details cd
      JOIN plats p ON cd.plat_id = p.id
      WHERE cd.commande_id = ?
    `, commandeId);

    // Émettre une notification à l'admin
    const io = getIO(req);
    if (io) {
      io.to('admin').emit('nouvelle-commande', {
        type: 'nouvelle-commande',
        message: `Nouvelle commande #${commandeId} de ${commande.client_prenom || 'Client'} ${commande.client_nom || ''}`,
        commande: {
          id: commandeId,
          client_nom: commande.client_nom,
          client_prenom: commande.client_prenom,
          total: commande.total,
          restaurant_nom: commande.restaurant_nom,
          statut: 'pending'
        }
      });

      // Émettre une notification au client si connecté
      if (client_id) {
        io.to(`client-${client_id}`).emit('commande-creee', {
          type: 'commande-creee',
          message: `Votre commande #${commandeId} a été créée avec succès`,
          commandeId: commandeId,
          total: commande.total
        });
      }
    }

    console.log(`✅ Commande #${commandeId} créée avec succès - Total: ${total} FCFA`);

    res.status(201).json({
      message: 'Commande créée avec succès',
      commande: {
        ...commande,
        details: details
      },
      commandeId: commandeId
    });
  } catch (error) {
    console.error('Erreur lors de la création de la commande:', error);
    res.status(500).json({ error: error.message || 'Erreur serveur' });
  }
});

// Obtenir toutes les commandes d'un client
router.get('/client/:clientId', authenticateToken, async (req, res) => {
  try {
    // Vérifier que l'utilisateur est le propriétaire ou un admin
    const user = req.user;
    const clientId = parseInt(req.params.clientId);
    
    if (user.role !== 'admin' && user.id !== clientId) {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    const commandes = await db.all(`
      SELECT c.*, r.nom as restaurant_nom
      FROM commandes c
      LEFT JOIN restaurants r ON c.restaurant_id = r.id
      WHERE c.client_id = ?
      ORDER BY c.date_commande DESC
    `, req.params.clientId);

    // Les détails sont uniquement envoyés aux admins
    const commandesAvecDetails = await Promise.all(commandes.map(async (commande) => {
      // Seuls les admins reçoivent les détails complets
      if (user.role === 'admin') {
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
        // Les clients ne reçoivent pas les détails
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

// Obtenir une commande par ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const user = req.user;
    
    const commande = await db.get(`
      SELECT c.*, 
             cl.nom as client_nom, cl.prenom as client_prenom, cl.email as client_email,
             r.nom as restaurant_nom
      FROM commandes c
      LEFT JOIN clients cl ON c.client_id = cl.id
      LEFT JOIN restaurants r ON c.restaurant_id = r.id
      WHERE c.id = ?
    `, req.params.id);

    if (!commande) {
      return res.status(404).json({ error: 'Commande non trouvée' });
    }

    // Vérifier que l'utilisateur est le propriétaire ou un admin
    if (user.role !== 'admin' && user.id !== commande.client_id) {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    // Les détails sont uniquement envoyés aux admins
    let details = null;
    if (user.role === 'admin') {
      details = await db.all(`
        SELECT cd.*, p.nom as plat_nom, p.image_url as plat_image
        FROM commande_details cd
        JOIN plats p ON cd.plat_id = p.id
        WHERE cd.commande_id = ?
      `, req.params.id);
    }

    res.json({
      commande,
      details
    });
  } catch (error) {
    console.error('Erreur lors de la récupération de la commande:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Mettre à jour le statut d'une commande
router.patch('/:id/statut', authenticateToken, async (req, res) => {
  try {
    const { statut } = req.body;
    const statutsValides = ['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'annulee'];

    if (!statutsValides.includes(statut)) {
      return res.status(400).json({ error: 'Statut invalide' });
    }

    await db.run('UPDATE commandes SET statut = ? WHERE id = ?', statut, req.params.id);

    // Récupérer les informations de la commande pour les notifications
    const commande = await db.get(`
      SELECT c.*, 
             cl.nom as client_nom, cl.prenom as client_prenom,
             r.nom as restaurant_nom
      FROM commandes c
      LEFT JOIN clients cl ON c.client_id = cl.id
      LEFT JOIN restaurants r ON c.restaurant_id = r.id
      WHERE c.id = ?
    `, req.params.id);

    const io = getIO(req);

    // Si la commande passe à 'ready', attribuer automatiquement à un livreur
    if (statut === 'ready') {
      if (!commande.livreur_id) {
        const livreurAttribue = await attribuerCommandeAuto(req.params.id);
        if (livreurAttribue && io) {
          // Notification au livreur
          io.to(`livreur-${livreurAttribue.id}`).emit('commande-attribuee', {
            type: 'commande-attribuee',
            message: `Une nouvelle commande #${req.params.id} vous a été attribuée`,
            commandeId: req.params.id,
            commande: commande
          });
        }
        if (livreurAttribue) {
          // Recharger les infos de la commande pour avoir le livreur_id
          const commandeUpdated = await db.get('SELECT livreur_id FROM commandes WHERE id = ?', req.params.id);
          commande.livreur_id = commandeUpdated.livreur_id;
        }
      }
    }

    // Émettre des notifications selon le statut
    if (io && commande) {
      // Notification au client pour les changements de statut
      if (commande.client_id) {
        io.to(`client-${commande.client_id}`).emit('statut-commande-change', {
          type: 'statut-commande-change',
          message: `Le statut de votre commande #${req.params.id} a été mis à jour: ${statut}`,
          commandeId: req.params.id,
          statut: statut
        });
      }

      // Notification à l'admin pour les changements de statut
      io.to('admin').emit('statut-commande-change', {
        type: 'statut-commande-change',
        message: `Le statut de la commande #${req.params.id} a été mis à jour: ${statut}`,
        commandeId: req.params.id,
        statut: statut
      });
    }

    if (statut === 'ready' && commande.livreur_id) {
      return res.json({ 
        message: 'Statut de la commande mis à jour et attribuée automatiquement',
        livreur: { id: commande.livreur_id }
      });
    }

    res.json({ message: 'Statut de la commande mis à jour' });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du statut:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
