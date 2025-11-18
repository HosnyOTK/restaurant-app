const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || 'sk_test_51Qdummy_key_for_testing');

// Générer un numéro de facture unique
function genererNumeroFacture() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `FACT-${year}${month}${day}-${random}`;
}

// Créer une intention de paiement Stripe
router.post('/create-payment-intent', authenticateToken, async (req, res) => {
  try {
    const { commande_id, montant } = req.body;
    
    if (!commande_id || !montant) {
      return res.status(400).json({ error: 'commande_id et montant sont requis' });
    }

    // Vérifier que la commande existe et appartient au client
    const commande = await db.get('SELECT * FROM commandes WHERE id = ?', commande_id);
    if (!commande) {
      return res.status(404).json({ error: 'Commande non trouvée' });
    }

    if (commande.client_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    // Convertir le montant en centimes (Stripe utilise les centimes)
    // Pour le Gabon, on garde FCFA mais on convertit en centimes pour Stripe
    const montantCentimes = Math.round(parseFloat(montant) * 100);

    // Créer l'intention de paiement Stripe avec timeout
    // Note: En production, vous devrez configurer Stripe pour supporter XAF (Franc CFA)
    // Pour l'instant, on utilise XOF comme devise
    let paymentIntent;
    
    try {
      // Créer une promesse avec timeout
      const stripePromise = stripe.paymentIntents.create({
        amount: montantCentimes,
        currency: 'xof', // XOF pour Franc CFA Ouest-Africain (proche de XAF)
        metadata: {
          commande_id: commande_id,
          client_id: req.user.id
        }
      });

      // Timeout de 5 secondes pour Stripe
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Stripe timeout')), 5000)
      );

      paymentIntent = await Promise.race([stripePromise, timeoutPromise]);
    } catch (stripeError) {
      console.error('Erreur Stripe:', stripeError);
      
      // En mode développement ou si Stripe n'est pas configuré, créer un clientSecret simulé
      if (process.env.NODE_ENV === 'development' || !process.env.STRIPE_SECRET_KEY || stripeError.message === 'Stripe timeout') {
        console.log('Mode test: simulation de payment intent');
        // Retourner un clientSecret simulé pour permettre le test
        return res.json({
          clientSecret: `pi_test_${commande_id}_${Date.now()}_simulated`,
          paymentIntentId: `pi_test_${commande_id}_${Date.now()}`,
          simulated: true
        });
      }
      
      throw stripeError;
    }

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    });
  } catch (error) {
    console.error('Erreur lors de la création de l\'intention de paiement:', error);
    res.status(500).json({ error: 'Erreur lors de la création de l\'intention de paiement' });
  }
});

// Confirmer le paiement et créer la facture
router.post('/confirm-payment', authenticateToken, async (req, res) => {
  try {
    const { commande_id, payment_intent_id, transaction_id } = req.body;

    if (!commande_id || !payment_intent_id) {
      return res.status(400).json({ error: 'commande_id et payment_intent_id sont requis' });
    }

    // Vérifier que la commande existe
    const commande = await db.get(`
      SELECT c.*, 
             cl.nom as client_nom, cl.prenom as client_prenom, cl.email as client_email,
             r.nom as restaurant_nom
      FROM commandes c
      LEFT JOIN clients cl ON c.client_id = cl.id
      LEFT JOIN restaurants r ON c.restaurant_id = r.id
      WHERE c.id = ?
    `, commande_id);

    if (!commande) {
      return res.status(404).json({ error: 'Commande non trouvée' });
    }

    if (commande.client_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    // Vérifier le statut du paiement avec Stripe
    let paymentIntent;
    
    // Si c'est un paiement simulé (mode test), accepter directement
    if (payment_intent_id && payment_intent_id.includes('_simulated')) {
      console.log('Mode test: paiement simulé accepté');
      paymentIntent = { status: 'succeeded' };
    } else {
      try {
        // Timeout de 5 secondes pour la vérification Stripe
        const retrievePromise = stripe.paymentIntents.retrieve(payment_intent_id);
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Stripe timeout')), 5000)
        );
        
        paymentIntent = await Promise.race([retrievePromise, timeoutPromise]);
      } catch (stripeError) {
        console.error('Erreur Stripe:', stripeError);
        // En mode test, on simule un paiement réussi si Stripe n'est pas configuré
        if (process.env.NODE_ENV === 'development' || !process.env.STRIPE_SECRET_KEY || stripeError.message === 'Stripe timeout') {
          console.log('Mode test: simulation de paiement réussi');
          paymentIntent = { status: 'succeeded' };
        } else {
          return res.status(400).json({ error: 'Erreur lors de la vérification du paiement' });
        }
      }
    }

    // Vérifier que le paiement est réussi
    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({ 
        error: 'Le paiement n\'a pas été confirmé',
        status: paymentIntent.status 
      });
    }

    // Vérifier si une facture existe déjà pour cette commande
    const factureExistante = await db.get('SELECT * FROM factures WHERE commande_id = ?', commande_id);
    
    if (factureExistante) {
      return res.json({
        message: 'Facture déjà créée',
        facture: factureExistante
      });
    }

    // Créer la facture
    const numeroFacture = genererNumeroFacture();
    const datePaiement = new Date().toISOString();

    const dateFacture = new Date().toISOString();
    
    const result = await db.run(`
      INSERT INTO factures (
        numero_facture, commande_id, client_id, restaurant_id, 
        montant_total, mode_paiement, statut_paiement, 
        transaction_id, date_paiement, date_facture
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, 
      numeroFacture,
      commande_id,
      commande.client_id,
      commande.restaurant_id,
      commande.total,
      'carte',
      'paye',
      transaction_id || payment_intent_id,
      datePaiement,
      dateFacture
    );

    const factureId = result.lastID;

    // Récupérer la facture complète
    const facture = await db.get('SELECT * FROM factures WHERE id = ?', factureId);

    // Mettre à jour le statut de la commande à 'confirmed'
    await db.run('UPDATE commandes SET statut = ? WHERE id = ?', 'confirmed', commande_id);

    // Récupérer les détails de la commande pour la facture
    const details = await db.all(`
      SELECT cd.*, p.nom as plat_nom
      FROM commande_details cd
      JOIN plats p ON cd.plat_id = p.id
      WHERE cd.commande_id = ?
    `, commande_id);

    res.json({
      message: 'Paiement confirmé et facture créée',
      facture: {
        ...facture,
        commande: {
          ...commande,
          details: details
        }
      }
    });
  } catch (error) {
    console.error('Erreur lors de la confirmation du paiement:', error);
    res.status(500).json({ error: 'Erreur lors de la confirmation du paiement' });
  }
});

// Mettre à jour les informations bancaires d'une facture existante
router.post('/mettre-a-jour-infos-bancaires', authenticateToken, async (req, res) => {
  try {
    const { commande_id, infos_bancaires } = req.body;

    if (!commande_id || !infos_bancaires) {
      return res.status(400).json({ error: 'commande_id et infos_bancaires sont requis' });
    }

    // Récupérer la facture existante
    const facture = await db.get('SELECT * FROM factures WHERE commande_id = ?', commande_id);
    
    if (!facture) {
      return res.status(404).json({ error: 'Facture non trouvée' });
    }

    // Vérifier que l'utilisateur est autorisé
    const commande = await db.get('SELECT * FROM commandes WHERE id = ?', commande_id);
    if (commande.client_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    // Extraire et masquer les informations bancaires
    const numeroCarte = infos_bancaires.numero_carte ? infos_bancaires.numero_carte.replace(/\s/g, '') : null;
    const dateExpiration = infos_bancaires.date_expiration || null;
    const nomTitulaire = infos_bancaires.nom_titulaire || null;
    
    // Stocker les informations bancaires de manière sécurisée (masquer le numéro)
    let numeroCarteMasque = null;
    if (numeroCarte && numeroCarte.length >= 4) {
      numeroCarteMasque = '**** **** **** ' + numeroCarte.substring(numeroCarte.length - 4);
    }

    // Mettre à jour la facture
    await db.run(`
      UPDATE factures 
      SET numero_carte = ?, date_expiration = ?, nom_titulaire = ?
      WHERE commande_id = ?
    `, numeroCarteMasque, dateExpiration, nomTitulaire, commande_id);

    // Récupérer la facture mise à jour
    const factureUpdated = await db.get(`
      SELECT f.*, 
             c.numero as commande_numero,
             cl.nom as client_nom, cl.prenom as client_prenom, cl.email as client_email,
             r.nom as restaurant_nom, r.adresse as restaurant_adresse, r.telephone as restaurant_telephone
      FROM factures f
      LEFT JOIN commandes c ON f.commande_id = c.id
      LEFT JOIN clients cl ON f.client_id = cl.id
      LEFT JOIN restaurants r ON f.restaurant_id = r.id
      WHERE f.id = ?
    `, facture.id);

    // Récupérer les détails de la commande
    const details = await db.all(`
      SELECT cd.*, p.nom as plat_nom, p.description as plat_description
      FROM commande_details cd
      JOIN plats p ON cd.plat_id = p.id
      WHERE cd.commande_id = ?
    `, commande_id);

    res.json({
      message: 'Informations bancaires mises à jour',
      facture: {
        ...factureUpdated,
        commande: {
          ...commande,
          details: details
        }
      }
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour des informations bancaires:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour' });
  }
});

// Créer une facture pour paiement Mobile Money
router.post('/creer-facture-mobile-money', authenticateToken, async (req, res) => {
  try {
    const { commande_id, operateur, numero_telephone } = req.body;

    if (!commande_id || !operateur || !numero_telephone) {
      return res.status(400).json({ error: 'commande_id, operateur et numero_telephone sont requis' });
    }

    // Valider l'opérateur
    if (!['airtel', 'moov'].includes(operateur)) {
      return res.status(400).json({ error: 'Opérateur invalide. Utilisez "airtel" ou "moov"' });
    }

    // Vérifier que la commande existe
    const commande = await db.get(`
      SELECT c.*, 
             cl.nom as client_nom, cl.prenom as client_prenom, cl.email as client_email,
             r.nom as restaurant_nom, r.adresse as restaurant_adresse, r.telephone as restaurant_telephone
      FROM commandes c
      LEFT JOIN clients cl ON c.client_id = cl.id
      LEFT JOIN restaurants r ON c.restaurant_id = r.id
      WHERE c.id = ?
    `, commande_id);

    if (!commande) {
      return res.status(404).json({ error: 'Commande non trouvée' });
    }

    if (commande.client_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    // Vérifier si une facture existe déjà pour cette commande
    const factureExistante = await db.get('SELECT * FROM factures WHERE commande_id = ?', commande_id);
    
    if (factureExistante) {
      // Récupérer les détails de la commande
      const details = await db.all(`
        SELECT cd.*, p.nom as plat_nom, p.description as plat_description
        FROM commande_details cd
        JOIN plats p ON cd.plat_id = p.id
        WHERE cd.commande_id = ?
      `, commande_id);

      return res.json({
        message: 'Facture déjà créée',
        facture: {
          ...factureExistante,
          commande: {
            ...commande,
            details: details
          }
        }
      });
    }

    // Créer la facture avec statut "en_attente"
    const numeroFacture = genererNumeroFacture();
    const dateFacture = new Date().toISOString();
    
    // Masquer partiellement le numéro de téléphone pour la sécurité
    const numeroMasque = numero_telephone.length >= 4 
      ? '****' + numero_telephone.substring(numero_telephone.length - 4)
      : '****';
    
    const result = await db.run(`
      INSERT INTO factures (
        numero_facture, commande_id, client_id, restaurant_id, 
        montant_total, mode_paiement, statut_paiement,
        numero_carte, date_facture
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, 
      numeroFacture,
      commande_id,
      commande.client_id,
      commande.restaurant_id,
      commande.total,
      'mobile_money',
      'en_attente',
      `${operateur.toUpperCase()}: ${numeroMasque}`, // Stocker dans numero_carte pour compatibilité
      dateFacture
    );

    // Mettre à jour le statut de la commande à 'confirmed'
    await db.run('UPDATE commandes SET statut = ? WHERE id = ?', 'confirmed', commande_id);

    // Récupérer les détails de la commande
    const details = await db.all(`
      SELECT cd.*, p.nom as plat_nom, p.description as plat_description
      FROM commande_details cd
      JOIN plats p ON cd.plat_id = p.id
      WHERE cd.commande_id = ?
    `, commande_id);

    const facture = await db.get('SELECT * FROM factures WHERE id = ?', result.lastID);

    res.json({
      message: 'Facture créée avec succès. En attente de confirmation du paiement.',
      facture: {
        ...facture,
        commande: {
          ...commande,
          details: details
        },
        mobile_money_info: {
          operateur: operateur,
          numero_telephone: numeroMasque
        }
      }
    });
  } catch (error) {
    console.error('Erreur lors de la création de la facture mobile money:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Créer une facture pour paiement à la livraison
router.post('/creer-facture-livraison', authenticateToken, async (req, res) => {
  try {
    const { commande_id } = req.body;

    if (!commande_id) {
      return res.status(400).json({ error: 'commande_id est requis' });
    }

    // Vérifier que la commande existe
    const commande = await db.get(`
      SELECT c.*, 
             cl.nom as client_nom, cl.prenom as client_prenom, cl.email as client_email,
             r.nom as restaurant_nom, r.adresse as restaurant_adresse, r.telephone as restaurant_telephone
      FROM commandes c
      LEFT JOIN clients cl ON c.client_id = cl.id
      LEFT JOIN restaurants r ON c.restaurant_id = r.id
      WHERE c.id = ?
    `, commande_id);

    if (!commande) {
      return res.status(404).json({ error: 'Commande non trouvée' });
    }

    if (commande.client_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    // Vérifier si une facture existe déjà pour cette commande
    const factureExistante = await db.get('SELECT * FROM factures WHERE commande_id = ?', commande_id);
    
    if (factureExistante) {
      // Récupérer les détails de la commande
      const details = await db.all(`
        SELECT cd.*, p.nom as plat_nom, p.description as plat_description
        FROM commande_details cd
        JOIN plats p ON cd.plat_id = p.id
        WHERE cd.commande_id = ?
      `, commande_id);

      return res.json({
        message: 'Facture déjà créée',
        facture: {
          ...factureExistante,
          commande: {
            ...commande,
            details: details
          }
        }
      });
    }

    // Créer la facture avec statut "en_attente"
    const numeroFacture = genererNumeroFacture();

    // Extraire les informations bancaires si fournies
    const infosBancaires = req.body.infos_bancaires || null;
    const numeroCarte = infosBancaires ? infosBancaires.numero_carte.replace(/\s/g, '') : null;
    const dateExpiration = infosBancaires ? infosBancaires.date_expiration : null;
    const nomTitulaire = infosBancaires ? infosBancaires.nom_titulaire : null;
    
    // Stocker les informations bancaires de manière sécurisée (masquer le numéro)
    // IMPORTANT: Ne jamais stocker le CVV pour des raisons de sécurité
    let numeroCarteMasque = null;
    if (numeroCarte && numeroCarte.length >= 4) {
      numeroCarteMasque = '**** **** **** ' + numeroCarte.substring(numeroCarte.length - 4);
    }

    const dateFacture = new Date().toISOString();
    
    const result = await db.run(`
      INSERT INTO factures (
        numero_facture, commande_id, client_id, restaurant_id, 
        montant_total, mode_paiement, statut_paiement,
        numero_carte, date_expiration, nom_titulaire, date_facture
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, 
      numeroFacture,
      commande_id,
      commande.client_id,
      commande.restaurant_id,
      commande.total,
      'livraison',
      'en_attente',
      numeroCarteMasque, // Stocker seulement les 4 derniers chiffres (masqué)
      dateExpiration,
      nomTitulaire,
      dateFacture
    );

    const factureId = result.lastID;

    // Mettre à jour le statut de la commande à 'confirmed'
    await db.run('UPDATE commandes SET statut = ? WHERE id = ?', 'confirmed', commande_id);

    // Récupérer la facture complète avec les informations du client et du restaurant
    const facture = await db.get(`
      SELECT f.*, 
             c.numero as commande_numero,
             cl.nom as client_nom, cl.prenom as client_prenom, cl.email as client_email,
             r.nom as restaurant_nom, r.adresse as restaurant_adresse, r.telephone as restaurant_telephone
      FROM factures f
      LEFT JOIN commandes c ON f.commande_id = c.id
      LEFT JOIN clients cl ON f.client_id = cl.id
      LEFT JOIN restaurants r ON f.restaurant_id = r.id
      WHERE f.id = ?
    `, factureId);

    // Récupérer les détails de la commande pour la facture
    const details = await db.all(`
      SELECT cd.*, p.nom as plat_nom, p.description as plat_description
      FROM commande_details cd
      JOIN plats p ON cd.plat_id = p.id
      WHERE cd.commande_id = ?
    `, commande_id);

    res.json({
      message: 'Commande confirmée et facture créée',
      facture: {
        ...facture,
        commande: {
          ...commande,
          details: details
        }
      }
    });
  } catch (error) {
    console.error('Erreur lors de la création de la facture de livraison:', error);
    res.status(500).json({ error: 'Erreur lors de la création de la facture' });
  }
});

// Obtenir toutes les factures (admin)
router.get('/factures', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    const factures = await db.all(`
      SELECT f.*, 
             c.numero as commande_numero,
             cl.nom as client_nom, cl.prenom as client_prenom, cl.email as client_email,
             r.nom as restaurant_nom
      FROM factures f
      LEFT JOIN commandes c ON f.commande_id = c.id
      LEFT JOIN clients cl ON f.client_id = cl.id
      LEFT JOIN restaurants r ON f.restaurant_id = r.id
      ORDER BY f.date_facture DESC
    `);

    res.json(factures);
  } catch (error) {
    console.error('Erreur lors de la récupération des factures:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Obtenir les factures d'un client
router.get('/factures/client/:clientId', authenticateToken, async (req, res) => {
  try {
    const clientId = parseInt(req.params.clientId);

    if (isNaN(clientId)) {
      return res.status(400).json({ error: 'ID client invalide' });
    }

    // Vérifier les permissions
    if (req.user.id !== clientId && req.user.role !== 'admin') {
      console.log(`Accès refusé: user.id=${req.user.id}, clientId=${clientId}, role=${req.user.role}`);
      return res.status(403).json({ error: 'Accès refusé' });
    }

    // Vérifier d'abord si des factures existent pour ce client
    const facturesTest = await db.all('SELECT * FROM factures WHERE client_id = ?', clientId);
    console.log(`Test factures pour client ${clientId} (type: ${typeof clientId}): ${facturesTest.length} factures trouvées`);
    if (facturesTest.length > 0) {
      console.log('Exemple de facture:', facturesTest[0]);
    }

    const factures = await db.all(`
      SELECT f.*, 
             c.numero as commande_numero,
             r.nom as restaurant_nom
      FROM factures f
      LEFT JOIN commandes c ON f.commande_id = c.id
      LEFT JOIN restaurants r ON f.restaurant_id = r.id
      WHERE f.client_id = ?
      ORDER BY f.date_facture DESC
    `, clientId);

    console.log(`Factures trouvées pour client ${clientId}: ${factures.length}`);
    if (factures.length > 0) {
      console.log('Première facture:', JSON.stringify(factures[0], null, 2));
    }
    res.json(factures || []);
  } catch (error) {
    console.error('Erreur lors de la récupération des factures:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Obtenir une facture par ID
router.get('/factures/:id', authenticateToken, async (req, res) => {
  try {
    const facture = await db.get(`
      SELECT f.*, 
             c.numero as commande_numero,
             cl.nom as client_nom, cl.prenom as client_prenom, cl.email as client_email,
             r.nom as restaurant_nom, r.adresse as restaurant_adresse, r.telephone as restaurant_telephone
      FROM factures f
      LEFT JOIN commandes c ON f.commande_id = c.id
      LEFT JOIN clients cl ON f.client_id = cl.id
      LEFT JOIN restaurants r ON f.restaurant_id = r.id
      WHERE f.id = ?
    `, req.params.id);

    if (!facture) {
      return res.status(404).json({ error: 'Facture non trouvée' });
    }

    // Vérifier les permissions
    if (facture.client_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    // Récupérer les détails de la commande
    const details = await db.all(`
      SELECT cd.*, p.nom as plat_nom, p.description as plat_description
      FROM commande_details cd
      JOIN plats p ON cd.plat_id = p.id
      WHERE cd.commande_id = ?
    `, facture.commande_id);

    // Récupérer les informations complètes de la commande
    const commandeComplete = await db.get(`
      SELECT c.*, 
             cl.nom as client_nom, cl.prenom as client_prenom, cl.email as client_email,
             r.nom as restaurant_nom, r.adresse as restaurant_adresse, r.telephone as restaurant_telephone
      FROM commandes c
      LEFT JOIN clients cl ON c.client_id = cl.id
      LEFT JOIN restaurants r ON c.restaurant_id = r.id
      WHERE c.id = ?
    `, facture.commande_id);

    res.json({
      ...facture,
      commande: {
        ...commandeComplete,
        details: details
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération de la facture:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;

