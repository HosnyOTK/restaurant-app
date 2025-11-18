const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Obtenir tous les restaurants actifs
router.get('/', async (req, res) => {
  try {
    const restaurants = await db.all('SELECT * FROM restaurants WHERE actif = 1 ORDER BY nom');
    res.json(restaurants);
  } catch (error) {
    console.error('Erreur lors de la récupération des restaurants:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Obtenir un restaurant par ID
router.get('/:id', async (req, res) => {
  try {
    const restaurant = await db.get('SELECT * FROM restaurants WHERE id = ? AND actif = 1', req.params.id);
    
    if (!restaurant) {
      return res.status(404).json({ error: 'Restaurant non trouvé' });
    }
    
    res.json(restaurant);
  } catch (error) {
    console.error('Erreur lors de la récupération du restaurant:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
