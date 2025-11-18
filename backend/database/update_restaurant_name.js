// Script pour mettre à jour le nom du restaurant
const db = require('../config/database');

async function updateRestaurantName() {
  try {
    await db.run(
      'UPDATE restaurants SET nom = ?, description = ? WHERE id = 1',
      'Livraison Service Food',
      'Service de livraison rapide de fastfood et cuisine traditionnelle gabonaise'
    );
    console.log('Nom du restaurant mis à jour avec succès: Livraison Service Food');
  } catch (error) {
    console.error('Erreur lors de la mise à jour:', error);
  }
  process.exit(0);
}

updateRestaurantName();






