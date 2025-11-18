const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Obtenir un client par ID
router.get('/:id', async (req, res) => {
  try {
    const client = await db.get(
      'SELECT id, nom, prenom, email, telephone, adresse, created_at FROM clients WHERE id = ?',
      req.params.id
    );

    if (!client) {
      return res.status(404).json({ error: 'Client non trouvé' });
    }

    res.json(client);
  } catch (error) {
    console.error('Erreur lors de la récupération du client:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Mettre à jour un client
router.put('/:id', async (req, res) => {
  try {
    const { nom, prenom, telephone, adresse } = req.body;

    await db.run(
      'UPDATE clients SET nom = ?, prenom = ?, telephone = ?, adresse = ? WHERE id = ?',
      nom, prenom, telephone, adresse, req.params.id
    );

    res.json({ message: 'Profil mis à jour avec succès' });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du client:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
