// Script pour charger le menu gabonais
// À exécuter manuellement si nécessaire: node backend/database/charger_menu_gabonais.js

const db = require('../config/database');
const fs = require('fs');
const path = require('path');

const menuPath = path.join(__dirname, 'menu_gabonais.sql');
const menuSQL = fs.readFileSync(menuPath, 'utf8');

console.log('Chargement du menu gabonais...');

try {
  db.exec(menuSQL);
  console.log('Menu gabonais chargé avec succès!');
} catch (error) {
  console.error('Erreur lors du chargement:', error);
}

process.exit(0);











