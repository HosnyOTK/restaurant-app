// Script pour mettre à jour le nom du restaurant de "Livraison Service Fastfood" à "Livraison Service Food"
const db = require('../config/database');

async function updateRestaurantName() {
  try {
    // Mettre à jour le nom du restaurant
    await db.run(
      'UPDATE restaurants SET nom = ? WHERE id = 1',
      'Livraison Service Food'
    );
    
    const restaurant = await db.get('SELECT nom FROM restaurants WHERE id = 1');
    console.log('✅ Nom du restaurant mis à jour avec succès!');
    console.log('Nouveau nom:', restaurant.nom);
  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour:', error);
  }
  process.exit(0);
}

updateRestaurantName();






