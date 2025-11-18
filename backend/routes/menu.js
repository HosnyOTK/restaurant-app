const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const upload = require('../config/upload');

// Obtenir tous les plats d'un restaurant
router.get('/restaurant/:restaurantId/plats', async (req, res) => {
  try {
    const plats = await db.all(`
      SELECT p.*, c.nom as categorie_nom 
      FROM plats p 
      LEFT JOIN categories c ON p.categorie_id = c.id 
      WHERE p.restaurant_id = ? AND p.disponible = 1
      ORDER BY p.id ASC
    `, req.params.restaurantId);
    
    res.json(plats);
  } catch (error) {
    console.error('Erreur lors de la récupération des plats:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Obtenir un plat par ID
router.get('/plats/:id', async (req, res) => {
  try {
    const plat = await db.get(`
      SELECT p.*, c.nom as categorie_nom 
      FROM plats p 
      LEFT JOIN categories c ON p.categorie_id = c.id 
      WHERE p.id = ? AND p.disponible = 1
    `, req.params.id);
    
    if (!plat) {
      return res.status(404).json({ error: 'Plat non trouvé' });
    }
    
    res.json(plat);
  } catch (error) {
    console.error('Erreur lors de la récupération du plat:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Obtenir toutes les catégories d'un restaurant
router.get('/restaurant/:restaurantId/categories', async (req, res) => {
  try {
    const categories = await db.all(`
      SELECT * FROM categories 
      WHERE restaurant_id = ? 
      ORDER BY ordre, nom
    `, req.params.restaurantId);
    
    res.json(categories);
  } catch (error) {
    console.error('Erreur lors de la récupération des catégories:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Obtenir les plats par catégorie
router.get('/categories/:id/plats', async (req, res) => {
  try {
    const plats = await db.all(`
      SELECT p.*, c.nom as categorie_nom 
      FROM plats p 
      LEFT JOIN categories c ON p.categorie_id = c.id 
      WHERE p.categorie_id = ? AND p.disponible = 1
      ORDER BY p.id ASC
    `, req.params.id);
    
    res.json(plats);
  } catch (error) {
    console.error('Erreur lors de la récupération des plats:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// === Routes admin pour gestion du menu ===
router.use(authenticateToken);
router.use(requireAdmin);

// Obtenir TOUS les plats d'un restaurant (pour admin - inclut les non disponibles)
router.get('/restaurant/:restaurantId/plats/all', async (req, res) => {
  try {
    const plats = await db.all(`
      SELECT p.*, c.nom as categorie_nom 
      FROM plats p 
      LEFT JOIN categories c ON p.categorie_id = c.id 
      WHERE p.restaurant_id = ?
      ORDER BY p.id ASC
    `, req.params.restaurantId);
    
    res.json(plats);
  } catch (error) {
    console.error('Erreur lors de la récupération des plats:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Route pour uploader une image
router.post('/upload-image', upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Aucun fichier uploadé' });
    }
    // Retourner l'URL de l'image
    const imageUrl = `/uploads/${req.file.filename}`;
    res.json({ imageUrl });
  } catch (error) {
    console.error('Erreur lors de l\'upload:', error);
    res.status(500).json({ error: 'Erreur lors de l\'upload' });
  }
});

// Créer un plat
router.post('/plats', upload.single('image'), async (req, res) => {
  try {
    const { restaurant_id, nom, description, prix, categorie_id, disponible } = req.body;
    let image_url = req.body.image_url || null;

    // Si une image est uploadée, utiliser son URL
    if (req.file) {
      image_url = `/uploads/${req.file.filename}`;
    }

    if (!restaurant_id || !nom || !prix) {
      return res.status(400).json({ error: 'restaurant_id, nom et prix sont requis' });
    }

    // Convertir disponible en 1 ou 0
    const disponibleValue = disponible !== undefined 
      ? (disponible === true || disponible === 'true' || disponible === 1 || disponible === '1' ? 1 : 0)
      : 1;

    const result = await db.run(`
      INSERT INTO plats (restaurant_id, nom, description, prix, categorie_id, image_url, disponible)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, restaurant_id, nom, description || null, prix, categorie_id || null, image_url, disponibleValue);

    res.status(201).json({
      message: 'Plat créé avec succès',
      plat: { id: result.lastID, restaurant_id, nom, description, prix, categorie_id, image_url, disponible }
    });
  } catch (error) {
    console.error('Erreur lors de la création du plat:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Mettre à jour un plat
router.put('/plats/:id', upload.single('image'), async (req, res) => {
  try {
    const { nom, description, prix, categorie_id, disponible } = req.body;
    let image_url = req.body.image_url || null;

    // Si une nouvelle image est uploadée, utiliser son URL
    if (req.file) {
      image_url = `/uploads/${req.file.filename}`;
    }

    // Convertir disponible en 1 ou 0
    const disponibleValue = disponible !== undefined 
      ? (disponible === true || disponible === 'true' || disponible === 1 || disponible === '1' ? 1 : 0)
      : 1;

    await db.run(`
      UPDATE plats 
      SET nom = ?, description = ?, prix = ?, categorie_id = ?, image_url = ?, disponible = ?
      WHERE id = ?
    `, nom, description || null, prix, categorie_id || null, image_url, disponibleValue, req.params.id);

    res.json({ message: 'Plat mis à jour avec succès' });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du plat:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Supprimer un plat
router.delete('/plats/:id', async (req, res) => {
  try {
    await db.run('DELETE FROM plats WHERE id = ?', req.params.id);
    res.json({ message: 'Plat supprimé avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression du plat:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Créer une catégorie
router.post('/categories', upload.single('image'), async (req, res) => {
  try {
    const { restaurant_id, nom, description, ordre } = req.body;
    let image_url = req.body.image_url || null;

    // Si une image est uploadée, utiliser son URL
    if (req.file) {
      image_url = `/uploads/${req.file.filename}`;
    }

    if (!restaurant_id || !nom) {
      return res.status(400).json({ error: 'restaurant_id et nom sont requis' });
    }

    const result = await db.run(`
      INSERT INTO categories (restaurant_id, nom, description, image_url, ordre)
      VALUES (?, ?, ?, ?, ?)
    `, restaurant_id, nom, description || null, image_url, ordre || 0);

    res.status(201).json({
      message: 'Catégorie créée avec succès',
      categorie: { id: result.lastID, restaurant_id, nom, description, image_url, ordre }
    });
  } catch (error) {
    console.error('Erreur lors de la création de la catégorie:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Mettre à jour une catégorie
router.put('/categories/:id', upload.single('image'), async (req, res) => {
  try {
    const { nom, description, ordre } = req.body;
    let image_url = req.body.image_url || null;

    // Si une nouvelle image est uploadée, utiliser son URL
    if (req.file) {
      image_url = `/uploads/${req.file.filename}`;
    }

    await db.run(`
      UPDATE categories 
      SET nom = ?, description = ?, image_url = ?, ordre = ?
      WHERE id = ?
    `, nom, description || null, image_url, ordre || 0, req.params.id);

    res.json({ message: 'Catégorie mise à jour avec succès' });
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la catégorie:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Supprimer une catégorie
router.delete('/categories/:id', async (req, res) => {
  try {
    await db.run('DELETE FROM categories WHERE id = ?', req.params.id);
    res.json({ message: 'Catégorie supprimée avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression de la catégorie:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
