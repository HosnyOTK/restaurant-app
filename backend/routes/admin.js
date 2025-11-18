const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

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

// Toutes les routes admin nécessitent l'authentification et le rôle admin
router.use(authenticateToken);
router.use(requireAdmin);

// Statistiques générales
router.get('/statistiques', async (req, res) => {
  try {
    // Nombre total de commandes
    const totalCommandes = await db.get('SELECT COUNT(*) as total FROM commandes');
    
    // Chiffre d'affaires total
    const chiffreAffaires = await db.get('SELECT SUM(total) as total FROM commandes WHERE statut != "annulee"');
    
    // Nombre de clients
    const totalClients = await db.get('SELECT COUNT(*) as total FROM clients');
    
    // Commandes par statut
    const commandesParStatut = await db.all(`
      SELECT statut, COUNT(*) as nombre 
      FROM commandes 
      GROUP BY statut
    `);
    
    // Chiffre d'affaires du mois
    const caMois = await db.get(`
      SELECT SUM(total) as total 
      FROM commandes 
      WHERE date_commande >= date('now', 'start of month')
      AND statut != 'annulee'
    `);
    
    res.json({
      totalCommandes: totalCommandes.total || 0,
      chiffreAffaires: chiffreAffaires.total || 0,
      chiffreAffairesMois: caMois.total || 0,
      totalClients: totalClients.total || 0,
      commandesParStatut
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Statistiques de ventes par période (jour/semaine/mois/année)
router.get('/statistiques/ventes', async (req, res) => {
  try {
    const { periode } = req.query; // 'jour', 'semaine', 'mois', 'annee'

    let query = '';
    let data = [];

    if (periode === 'jour') {
      // Ventes par heure du jour en cours
      query = `
        SELECT 
          strftime('%H:00', date_commande) as heure,
          COUNT(*) as nombre_commandes,
          SUM(total) as chiffre_affaires
        FROM commandes
        WHERE date(date_commande) = date('now')
          AND statut != 'annulee'
        GROUP BY strftime('%H', date_commande)
        ORDER BY heure ASC
      `;
    } else if (periode === 'semaine') {
      // Ventes par jour de la semaine dernière
      query = `
        SELECT 
          date(date_commande) as jour,
          COUNT(*) as nombre_commandes,
          SUM(total) as chiffre_affaires
        FROM commandes
        WHERE date_commande >= date('now', '-7 days')
          AND statut != 'annulee'
        GROUP BY date(date_commande)
        ORDER BY jour ASC
      `;
    } else if (periode === 'mois') {
      // Ventes par jour du mois en cours
      query = `
        SELECT 
          date(date_commande) as jour,
          COUNT(*) as nombre_commandes,
          SUM(total) as chiffre_affaires
        FROM commandes
        WHERE date_commande >= date('now', 'start of month')
          AND statut != 'annulee'
        GROUP BY date(date_commande)
        ORDER BY jour ASC
      `;
    } else if (periode === 'annee') {
      // Ventes par mois de l'année en cours
      query = `
        SELECT 
          strftime('%Y-%m', date_commande) as mois,
          COUNT(*) as nombre_commandes,
          SUM(total) as chiffre_affaires
        FROM commandes
        WHERE date_commande >= date('now', 'start of year')
          AND statut != 'annulee'
        GROUP BY strftime('%Y-%m', date_commande)
        ORDER BY mois ASC
      `;
    } else {
      return res.status(400).json({ error: 'Période invalide. Utilisez: jour, semaine, mois ou annee' });
    }

    const resultats = await db.all(query);

    // Formater les données selon la période
    if (periode === 'jour') {
      data = resultats.map(row => ({
        date: row.heure,
        commandes: row.nombre_commandes || 0,
        chiffreAffaires: parseFloat(row.chiffre_affaires || 0)
      }));
    } else if (periode === 'semaine' || periode === 'mois') {
      data = resultats.map(row => ({
        date: row.jour,
        commandes: row.nombre_commandes || 0,
        chiffreAffaires: parseFloat(row.chiffre_affaires || 0)
      }));
    } else if (periode === 'annee') {
      data = resultats.map(row => ({
        date: row.mois,
        commandes: row.nombre_commandes || 0,
        chiffreAffaires: parseFloat(row.chiffre_affaires || 0)
      }));
    }

    res.json({
      periode,
      data
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques de ventes:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Liste de toutes les commandes
router.get('/commandes', async (req, res) => {
  try {
    const commandes = await db.all(`
      SELECT c.*, 
             cl.nom as client_nom, cl.prenom as client_prenom, cl.email as client_email,
             r.nom as restaurant_nom
      FROM commandes c
      LEFT JOIN clients cl ON c.client_id = cl.id
      LEFT JOIN restaurants r ON c.restaurant_id = r.id
      ORDER BY c.date_commande DESC
    `);

    // Ajouter les détails et les informations du livreur pour chaque commande
    const commandesAvecDetails = await Promise.all(commandes.map(async (commande) => {
      const details = await db.all(`
        SELECT cd.*, p.nom as plat_nom
        FROM commande_details cd
        JOIN plats p ON cd.plat_id = p.id
        WHERE cd.commande_id = ?
      `, commande.id);

      // Récupérer les informations du livreur si attribué
      let livreurInfo = null;
      if (commande.livreur_id) {
        livreurInfo = await db.get(`
          SELECT id, nom, prenom, email, telephone
          FROM clients
          WHERE id = ?
        `, commande.livreur_id);
      }

      return {
        ...commande,
        details,
        livreur: livreurInfo
      };
    }));

    res.json(commandesAvecDetails);
  } catch (error) {
    console.error('Erreur lors de la récupération des commandes:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Mettre à jour le statut d'une commande
router.patch('/commandes/:id/statut', async (req, res) => {
  try {
    const { statut } = req.body;
    const statutsValides = ['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'annulee'];

    if (!statutsValides.includes(statut)) {
      return res.status(400).json({ error: 'Statut invalide' });
    }

    // Si la commande est marquée comme livrée, mettre à jour la date de livraison
    if (statut === 'delivered') {
      await db.run('UPDATE commandes SET statut = ?, date_livraison = datetime("now") WHERE id = ?', statut, req.params.id);
    } else {
      await db.run('UPDATE commandes SET statut = ? WHERE id = ?', statut, req.params.id);
    }

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

    // Si la commande passe à 'ready', attribuer automatiquement à un livreur (seulement si pas déjà attribuée)
    // L'admin peut attribuer manuellement via l'endpoint dédié
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

      // Notification aux livreurs pour les changements de statut
      if (commande.livreur_id) {
        io.to(`livreur-${commande.livreur_id}`).emit('statut-commande-change', {
          type: 'statut-commande-change',
          message: `Le statut de la commande #${req.params.id} a été mis à jour: ${statut}`,
          commandeId: req.params.id,
          statut: statut
        });
      }

      // Notification à tous les admins (déjà dans la room admin)
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

// Liste de tous les clients
router.get('/clients', async (req, res) => {
  try {
    const clients = await db.all(`
      SELECT id, nom, prenom, email, telephone, adresse, role, created_at
      FROM clients
      ORDER BY created_at DESC
    `);

    // Pour chaque client, compter le nombre de commandes
    const clientsAvecStats = await Promise.all(clients.map(async (client) => {
      const nbCommandes = await db.get('SELECT COUNT(*) as total FROM commandes WHERE client_id = ?', client.id);
      return {
        ...client,
        nbCommandes: nbCommandes.total || 0
      };
    }));

    res.json(clientsAvecStats);
  } catch (error) {
    console.error('Erreur lors de la récupération des clients:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Commandes d'un client spécifique
router.get('/clients/:id/commandes', async (req, res) => {
  try {
    const commandes = await db.all(`
      SELECT c.*, r.nom as restaurant_nom
      FROM commandes c
      LEFT JOIN restaurants r ON c.restaurant_id = r.id
      WHERE c.client_id = ?
      ORDER BY c.date_commande DESC
    `, req.params.id);

    res.json(commandes);
  } catch (error) {
    console.error('Erreur lors de la récupération des commandes:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ============================================
// GESTION DES LIVREURS
// ============================================

// Liste de tous les livreurs
router.get('/livreurs', async (req, res) => {
  try {
    const livreurs = await db.all(`
      SELECT id, nom, prenom, email, telephone, adresse, role, created_at
      FROM clients
      WHERE role = 'livreur'
      ORDER BY created_at DESC
    `);

    // Pour chaque livreur, compter le nombre de commandes livrées
    // Note: Pour l'instant, on compte toutes les commandes livrées
    // Dans une version future, on pourrait ajouter un champ livreur_id dans commandes
    const livreursAvecStats = await Promise.all(livreurs.map(async (livreur) => {
      const nbCommandesLivrees = await db.get(`
        SELECT COUNT(*) as total 
        FROM commandes 
        WHERE statut = 'delivered'
      `);
      return {
        ...livreur,
        nbCommandesLivrees: nbCommandesLivrees.total || 0
      };
    }));

    res.json(livreursAvecStats);
  } catch (error) {
    console.error('Erreur lors de la récupération des livreurs:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Attribuer une commande à un livreur spécifique
router.patch('/commandes/:id/livreur', async (req, res) => {
  try {
    const { livreur_id } = req.body;
    
    if (!livreur_id) {
      return res.status(400).json({ error: 'ID du livreur requis' });
    }

    // Vérifier que le livreur existe
    const livreur = await db.get('SELECT id, nom, prenom FROM clients WHERE id = ? AND role = ?', livreur_id, 'livreur');
    if (!livreur) {
      return res.status(404).json({ error: 'Livreur non trouvé' });
    }

    // Vérifier que la commande existe
    const commande = await db.get('SELECT id, statut FROM commandes WHERE id = ?', req.params.id);
    if (!commande) {
      return res.status(404).json({ error: 'Commande non trouvée' });
    }

    // Vérifier que la commande est dans un statut qui permet l'attribution
    if (!['preparing', 'ready'].includes(commande.statut)) {
      return res.status(400).json({ error: 'La commande doit être en préparation ou prête pour être attribuée' });
    }

    // Attribuer la commande au livreur
    await db.run('UPDATE commandes SET livreur_id = ? WHERE id = ?', livreur_id, req.params.id);

    // Notification au livreur via Socket.io
    const io = getIO(req);
    if (io) {
      io.to(`livreur-${livreur_id}`).emit('commande-attribuee', {
        type: 'commande-attribuee',
        message: `Une nouvelle commande #${req.params.id} vous a été attribuée`,
        commandeId: req.params.id,
        commande: commande
      });
    }

    res.json({ 
      message: 'Commande attribuée au livreur avec succès',
      livreur: {
        id: livreur.id,
        nom: livreur.nom,
        prenom: livreur.prenom
      }
    });
  } catch (error) {
    console.error('Erreur lors de l\'attribution de la commande:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Créer un livreur
router.post('/livreurs', async (req, res) => {
  try {
    const { nom, prenom, email, telephone, adresse, password } = req.body;

    if (!nom || !prenom || !email || !password) {
      return res.status(400).json({ error: 'nom, prenom, email et password sont requis' });
    }

    // Vérifier si l'email existe déjà
    const existing = await db.get('SELECT id FROM clients WHERE email = ?', email);
    if (existing) {
      return res.status(400).json({ error: 'Cet email est déjà utilisé' });
    }

    // Hasher le mot de passe
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(password, 10);

    // Créer le livreur
    const result = await db.run(`
      INSERT INTO clients (nom, prenom, email, telephone, adresse, password, role)
      VALUES (?, ?, ?, ?, ?, ?, 'livreur')
    `, nom, prenom, email, telephone || null, adresse || null, hashedPassword);

    const nouveauLivreur = await db.get('SELECT id, nom, prenom, email, telephone, adresse, role, created_at FROM clients WHERE id = ?', result.lastID);

    res.status(201).json({
      message: 'Livreur créé avec succès',
      livreur: nouveauLivreur
    });
  } catch (error) {
    console.error('Erreur lors de la création du livreur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Mettre à jour un livreur
router.put('/livreurs/:id', async (req, res) => {
  try {
    const { nom, prenom, email, telephone, adresse, password } = req.body;
    const livreurId = parseInt(req.params.id);

    // Vérifier que le livreur existe et est bien un livreur
    const livreur = await db.get('SELECT id, role FROM clients WHERE id = ?', livreurId);
    if (!livreur) {
      return res.status(404).json({ error: 'Livreur non trouvé' });
    }

    if (livreur.role !== 'livreur') {
      return res.status(400).json({ error: 'Cet utilisateur n\'est pas un livreur' });
    }

    // Vérifier si l'email est déjà utilisé par un autre utilisateur
    if (email) {
      const existing = await db.get('SELECT id FROM clients WHERE email = ? AND id != ?', email, livreurId);
      if (existing) {
        return res.status(400).json({ error: 'Cet email est déjà utilisé' });
      }
    }

    // Construire la requête de mise à jour
    let updateFields = [];
    let updateValues = [];

    if (nom) {
      updateFields.push('nom = ?');
      updateValues.push(nom);
    }
    if (prenom) {
      updateFields.push('prenom = ?');
      updateValues.push(prenom);
    }
    if (email) {
      updateFields.push('email = ?');
      updateValues.push(email);
    }
    if (telephone !== undefined) {
      updateFields.push('telephone = ?');
      updateValues.push(telephone);
    }
    if (adresse !== undefined) {
      updateFields.push('adresse = ?');
      updateValues.push(adresse);
    }
    if (password) {
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash(password, 10);
      updateFields.push('password = ?');
      updateValues.push(hashedPassword);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'Aucun champ à mettre à jour' });
    }

    updateValues.push(livreurId);
    await db.run(`UPDATE clients SET ${updateFields.join(', ')} WHERE id = ?`, ...updateValues);

    const livreurMisAJour = await db.get('SELECT id, nom, prenom, email, telephone, adresse, role, created_at FROM clients WHERE id = ?', livreurId);

    res.json({
      message: 'Livreur mis à jour avec succès',
      livreur: livreurMisAJour
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du livreur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Supprimer un livreur
router.delete('/livreurs/:id', async (req, res) => {
  try {
    const livreurId = parseInt(req.params.id);

    // Vérifier que le livreur existe et est bien un livreur
    const livreur = await db.get('SELECT id, role FROM clients WHERE id = ?', livreurId);
    if (!livreur) {
      return res.status(404).json({ error: 'Livreur non trouvé' });
    }

    if (livreur.role !== 'livreur') {
      return res.status(400).json({ error: 'Cet utilisateur n\'est pas un livreur' });
    }

    // Supprimer le livreur
    await db.run('DELETE FROM clients WHERE id = ?', livreurId);

    res.json({ message: 'Livreur supprimé avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression du livreur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Supprimer un utilisateur (tous les utilisateurs sauf l'admin qui supprime)
router.delete('/utilisateurs/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.user.id; // L'admin qui fait la suppression

    // Vérifier que l'utilisateur existe
    const utilisateur = await db.get('SELECT id, role FROM clients WHERE id = ?', id);
    
    if (!utilisateur) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    // Empêcher l'admin de se supprimer lui-même
    if (parseInt(id) === parseInt(adminId)) {
      return res.status(400).json({ error: 'Vous ne pouvez pas supprimer votre propre compte' });
    }

    // Supprimer l'utilisateur
    await db.run('DELETE FROM clients WHERE id = ?', id);

    res.json({ message: 'Utilisateur supprimé avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'utilisateur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
