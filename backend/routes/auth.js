const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');

// Inscription
router.post('/register', async (req, res) => {
  try {
    const { nom, prenom, email, telephone, adresse, password } = req.body;

    if (!nom || !prenom || !email || !password) {
      return res.status(400).json({ error: 'Tous les champs sont requis' });
    }

    // Vérifier si l'email existe déjà
    const existing = await db.get('SELECT id FROM clients WHERE email = ?', email);
    if (existing) {
      return res.status(400).json({ error: 'Cet email est déjà utilisé' });
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // Créer le client
    const result = await db.run(
      'INSERT INTO clients (nom, prenom, email, telephone, adresse, password) VALUES (?, ?, ?, ?, ?, ?)',
      nom, prenom, email, telephone || null, adresse || null, hashedPassword
    );

    const clientId = result.lastID;

    // Générer un token JWT
    const token = jwt.sign(
      { id: clientId, email },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Inscription réussie',
      token,
      client: { id: clientId, nom, prenom, email, role: 'client' }
    });
  } catch (error) {
    console.error('Erreur lors de l\'inscription:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Connexion
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email et mot de passe requis' });
    }

    // Trouver le client
    const client = await db.get('SELECT * FROM clients WHERE email = ?', email);
    if (!client) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }

    // Vérifier le mot de passe
    const isValid = await bcrypt.compare(password, client.password);
    if (!isValid) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }

    // Générer un token JWT
    const token = jwt.sign(
      { id: client.id, email: client.email },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Connexion réussie',
      token,
      client: {
        id: client.id,
        nom: client.nom,
        prenom: client.prenom,
        email: client.email,
        role: client.role || 'client'
      }
    });
  } catch (error) {
    console.error('Erreur lors de la connexion:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
