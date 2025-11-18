const db = require('../config/database');

async function limiterPlats() {
  try {
    console.log('Limitation des plats à 10...');
    
    // Récupérer tous les plats triés par ID
    const plats = await db.all('SELECT id FROM plats ORDER BY id ASC');
    
    console.log(`Total de plats actuellement: ${plats.length}`);
    
    if (plats.length <= 10) {
      console.log('Il y a déjà 10 plats ou moins. Aucune suppression nécessaire.');
      return;
    }
    
    // Garder les 10 premiers (IDs les plus petits)
    const platsAGarder = plats.slice(0, 10);
    const idsAGarder = platsAGarder.map(p => p.id);
    
    // Supprimer les autres
    const platsASupprimer = plats.slice(10);
    const idsASupprimer = platsASupprimer.map(p => p.id);
    
    console.log(`Plats à garder (IDs): ${idsAGarder.join(', ')}`);
    console.log(`Plats à supprimer (IDs): ${idsASupprimer.join(', ')}`);
    
    // Supprimer les plats
    for (const id of idsASupprimer) {
      await db.run('DELETE FROM plats WHERE id = ?', id);
      console.log(`Plat ${id} supprimé`);
    }
    
    console.log(`✅ ${platsASupprimer.length} plat(s) supprimé(s). Il reste ${idsAGarder.length} plat(s).`);
    
    // Vérification finale
    const platsRestants = await db.all('SELECT id, nom FROM plats ORDER BY id ASC');
    console.log('\nPlats restants:');
    platsRestants.forEach(plat => {
      console.log(`  - ID ${plat.id}: ${plat.nom}`);
    });
    
  } catch (error) {
    console.error('Erreur lors de la limitation des plats:', error);
  } finally {
    // Fermer la connexion
    process.exit(0);
  }
}

limiterPlats();









