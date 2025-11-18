const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Récupérer tous les quartiers personnalisés
router.get('/', async (req, res) => {
  try {
    const quartiers = await db.all('SELECT nom FROM quartiers ORDER BY nom ASC');
    res.json({ quartiers: quartiers.map(q => q.nom) });
  } catch (error) {
    console.error('Erreur lors de la récupération des quartiers:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Ajouter un nouveau quartier personnalisé
router.post('/', async (req, res) => {
  try {
    const { nom } = req.body;

    if (!nom || nom.trim().length < 2) {
      return res.status(400).json({ error: 'Le nom du quartier doit contenir au moins 2 caractères' });
    }

    const nomTrimmed = nom.trim();

    // Vérifier si le quartier existe déjà
    const existing = await db.get('SELECT * FROM quartiers WHERE LOWER(nom) = LOWER(?)', nomTrimmed);
    
    if (existing) {
      return res.json({ 
        message: 'Quartier déjà existant',
        quartier: { nom: existing.nom, id: existing.id }
      });
    }

    // Insérer le nouveau quartier
    const result = await db.run(
      'INSERT INTO quartiers (nom) VALUES (?)',
      nomTrimmed
    );

    res.json({
      message: 'Quartier ajouté avec succès',
      quartier: { id: result.lastID, nom: nomTrimmed }
    });
  } catch (error) {
    console.error('Erreur lors de l\'ajout du quartier:', error);
    
    // Si c'est une erreur de contrainte unique, le quartier existe déjà
    if (error.message && error.message.includes('UNIQUE constraint')) {
      return res.status(400).json({ error: 'Ce quartier existe déjà' });
    }
    
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;


