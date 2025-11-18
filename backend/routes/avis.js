const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// Créer un avis
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { commande_id, note_restaurant, note_livraison, commentaire } = req.body;

    if (!commande_id || !note_restaurant) {
      return res.status(400).json({ error: 'commande_id et note_restaurant sont requis' });
    }

    // Vérifier que la note est entre 1 et 5
    if (note_restaurant < 1 || note_restaurant > 5) {
      return res.status(400).json({ error: 'La note du restaurant doit être entre 1 et 5' });
    }

    if (note_livraison && (note_livraison < 1 || note_livraison > 5)) {
      return res.status(400).json({ error: 'La note de livraison doit être entre 1 et 5' });
    }

    // Vérifier que la commande existe et appartient au client
    const commande = await db.get('SELECT * FROM commandes WHERE id = ?', commande_id);
    if (!commande) {
      return res.status(404).json({ error: 'Commande non trouvée' });
    }

    if (commande.client_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    // Vérifier si un avis existe déjà pour cette commande
    const avisExistant = await db.get('SELECT * FROM avis WHERE commande_id = ?', commande_id);
    if (avisExistant) {
      return res.status(400).json({ error: 'Un avis existe déjà pour cette commande' });
    }

    // Créer l'avis
    const result = await db.run(`
      INSERT INTO avis (
        commande_id, client_id, restaurant_id, 
        note_restaurant, note_livraison, 
        commentaire
      ) VALUES (?, ?, ?, ?, ?, ?)
    `,
      commande_id,
      req.user.id,
      commande.restaurant_id,
      note_restaurant,
      note_livraison || null,
      commentaire ? commentaire.trim() : null
    );

    const avisId = result.lastID;

    // Récupérer l'avis créé avec les informations du client
    const avis = await db.get(`
      SELECT a.*, 
             c.nom as client_nom, c.prenom as client_prenom, c.email as client_email,
             r.nom as restaurant_nom
      FROM avis a
      LEFT JOIN clients c ON a.client_id = c.id
      LEFT JOIN restaurants r ON a.restaurant_id = r.id
      WHERE a.id = ?
    `, avisId);

    res.status(201).json({
      message: 'Avis créé avec succès',
      avis: avis
    });
  } catch (error) {
    console.error('Erreur lors de la création de l\'avis:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Obtenir tous les avis d'un restaurant
router.get('/restaurant/:restaurantId', async (req, res) => {
  try {
    const restaurantId = parseInt(req.params.restaurantId);

    const avis = await db.all(`
      SELECT a.*, 
             c.nom as client_nom, c.prenom as client_prenom,
             r.nom as restaurant_nom
      FROM avis a
      LEFT JOIN clients c ON a.client_id = c.id
      LEFT JOIN restaurants r ON a.restaurant_id = r.id
      WHERE a.restaurant_id = ?
      ORDER BY a.date_avis DESC
    `, restaurantId);

    // Calculer les statistiques
    const totalAvis = avis.length;
    const moyenneRestaurant = totalAvis > 0 
      ? avis.reduce((sum, a) => sum + a.note_restaurant, 0) / totalAvis 
      : 0;
    const moyenneLivraison = avis.filter(a => a.note_livraison).length > 0
      ? avis.filter(a => a.note_livraison).reduce((sum, a) => sum + a.note_livraison, 0) / avis.filter(a => a.note_livraison).length
      : 0;

    res.json({
      avis: avis,
      statistiques: {
        total: totalAvis,
        moyenne_restaurant: moyenneRestaurant.toFixed(1),
        moyenne_livraison: moyenneLivraison.toFixed(1)
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des avis:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Obtenir les avis d'un client
router.get('/client/:clientId', authenticateToken, async (req, res) => {
  try {
    const clientId = parseInt(req.params.clientId);

    if (req.user.id !== clientId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    const avis = await db.all(`
      SELECT a.*, 
             r.nom as restaurant_nom,
             c.numero as commande_numero
      FROM avis a
      LEFT JOIN restaurants r ON a.restaurant_id = r.id
      LEFT JOIN commandes c ON a.commande_id = c.id
      WHERE a.client_id = ?
      ORDER BY a.date_avis DESC
    `, clientId);

    res.json(avis);
  } catch (error) {
    console.error('Erreur lors de la récupération des avis:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Obtenir l'avis d'une commande
router.get('/commande/:commandeId', authenticateToken, async (req, res) => {
  try {
    const commandeId = parseInt(req.params.commandeId);

    // Vérifier que la commande existe et appartient au client
    const commande = await db.get('SELECT * FROM commandes WHERE id = ?', commandeId);
    if (!commande) {
      return res.status(404).json({ error: 'Commande non trouvée' });
    }

    if (commande.client_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    const avis = await db.get(`
      SELECT a.*, 
             c.nom as client_nom, c.prenom as client_prenom,
             r.nom as restaurant_nom
      FROM avis a
      LEFT JOIN clients c ON a.client_id = c.id
      LEFT JOIN restaurants r ON a.restaurant_id = r.id
      WHERE a.commande_id = ?
    `, commandeId);

    res.json(avis || null);
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'avis:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Modifier un avis
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const avisId = parseInt(req.params.id);
    const { note_restaurant, note_livraison, commentaire } = req.body;

    // Vérifier que l'avis existe
    const avis = await db.get('SELECT * FROM avis WHERE id = ?', avisId);
    if (!avis) {
      return res.status(404).json({ error: 'Avis non trouvé' });
    }

    // Vérifier les permissions
    if (avis.client_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    // Vérifier les notes
    if (note_restaurant && (note_restaurant < 1 || note_restaurant > 5)) {
      return res.status(400).json({ error: 'La note du restaurant doit être entre 1 et 5' });
    }

    if (note_livraison && (note_livraison < 1 || note_livraison > 5)) {
      return res.status(400).json({ error: 'La note de livraison doit être entre 1 et 5' });
    }

    // Mettre à jour l'avis
    await db.run(`
      UPDATE avis 
      SET note_restaurant = COALESCE(?, note_restaurant),
          note_livraison = ?,
          commentaire = ?
      WHERE id = ?
    `,
      note_restaurant || avis.note_restaurant,
      note_livraison || null,
      commentaire ? commentaire.trim() : null,
      avisId
    );

    // Récupérer l'avis mis à jour
    const avisUpdated = await db.get(`
      SELECT a.*, 
             c.nom as client_nom, c.prenom as client_prenom,
             r.nom as restaurant_nom
      FROM avis a
      LEFT JOIN clients c ON a.client_id = c.id
      LEFT JOIN restaurants r ON a.restaurant_id = r.id
      WHERE a.id = ?
    `, avisId);

    res.json({
      message: 'Avis modifié avec succès',
      avis: avisUpdated
    });
  } catch (error) {
    console.error('Erreur lors de la modification de l\'avis:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Supprimer un avis (admin uniquement)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const avisId = parseInt(req.params.id);

    // Vérifier que l'avis existe
    const avis = await db.get('SELECT * FROM avis WHERE id = ?', avisId);
    if (!avis) {
      return res.status(404).json({ error: 'Avis non trouvé' });
    }

    // Seul l'admin peut supprimer un avis
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    await db.run('DELETE FROM avis WHERE id = ?', avisId);

    res.json({ message: 'Avis supprimé avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'avis:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;

