// Script pour réduire le menu à seulement 6 plats
const db = require('../config/database');
const fs = require('fs');
const path = require('path');

async function reduireMenu() {
  try {
    console.log('Réduction du menu à 6 plats...');
    
    // Supprimer tous les plats existants
    await db.run('DELETE FROM plats WHERE restaurant_id = 1');
    console.log('✅ Tous les plats supprimés');
    
    // Réinsérer seulement 6 plats variés
    const plats = [
      { nom: 'Nyembwé au Poulet', description: 'Poulet cuit dans une sauce à base de graines de palme, accompagné de riz ou plantain', prix: 5500, categorie_id: 1 },
      { nom: 'Poulet DG', description: 'Poulet sauté avec plantain, légumes et épices', prix: 6000, categorie_id: 1 },
      { nom: 'Soupe de Poisson', description: 'Soupe de poissons frais avec légumes et épices', prix: 4500, categorie_id: 2 },
      { nom: 'Riz Blanc', description: 'Riz blanc parfumé', prix: 1000, categorie_id: 3 },
      { nom: 'Capitaine Braisé', description: 'Capitaine grillé avec accompagnements', prix: 6500, categorie_id: 4 },
      { nom: 'Jus de Bissap', description: 'Jus d\'hibiscus traditionnel', prix: 1500, categorie_id: 6 }
    ];
    
    for (const plat of plats) {
      await db.run(
        'INSERT INTO plats (restaurant_id, nom, description, prix, categorie_id, disponible) VALUES (?, ?, ?, ?, ?, ?)',
        1, plat.nom, plat.description, plat.prix, plat.categorie_id, 1
      );
      console.log(`✅ Plat ajouté: ${plat.nom}`);
    }
    
    console.log('\n✅ Menu réduit à 6 plats avec succès!');
    console.log('Plats conservés:');
    plats.forEach((plat, index) => {
      console.log(`${index + 1}. ${plat.nom} - ${plat.prix} FCFA`);
    });
    
  } catch (error) {
    console.error('❌ Erreur lors de la réduction du menu:', error);
  } finally {
    process.exit(0);
  }
}

reduireMenu();


