const db = require('../config/database');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

// Lire le fichier schema.sql
const schemaPath = path.join(__dirname, 'schema.sql');
const schema = fs.readFileSync(schemaPath, 'utf8');

// Exécuter le schéma
console.log('Initialisation de la base de données...');

// Fonction pour exécuter le schéma
async function initDatabase() {
  try {
    // Exécuter toutes les commandes SQL
    await db.exec(schema);
    
    // Ajouter la colonne livreur_id si elle n'existe pas déjà (migration)
    try {
      await db.run(`
        ALTER TABLE commandes 
        ADD COLUMN livreur_id INTEGER 
        REFERENCES clients(id) ON DELETE SET NULL
      `);
      console.log('Colonne livreur_id ajoutée à la table commandes');
    } catch (error) {
      // Ignorer si la colonne existe déjà
      if (!error.message.includes('duplicate column')) {
        console.log('Colonne livreur_id déjà présente ou erreur:', error.message);
      }
    }

    // Créer la table avis si elle n'existe pas déjà
    try {
      const migrationAvisPath = path.join(__dirname, 'migration_avis.sql');
      const migrationAvis = fs.readFileSync(migrationAvisPath, 'utf8');
      await db.exec(migrationAvis);
      console.log('Table avis créée avec succès');
      
      // Migration : Ajouter la colonne commentaire si elle n'existe pas et supprimer les anciennes colonnes
      try {
        // Vérifier si la colonne commentaire existe
        const tableInfo = await db.all("PRAGMA table_info(avis)");
        const hasCommentaire = tableInfo.some(col => col.name === 'commentaire');
        const hasCommentaireRestaurant = tableInfo.some(col => col.name === 'commentaire_restaurant');
        
        if (!hasCommentaire) {
          await db.run('ALTER TABLE avis ADD COLUMN commentaire TEXT');
          console.log('Colonne commentaire ajoutée à la table avis');
        }
        
        // Migrer les données des anciennes colonnes vers commentaire si nécessaire
        if (hasCommentaireRestaurant) {
          await db.run(`
            UPDATE avis 
            SET commentaire = COALESCE(commentaire_restaurant || CASE WHEN commentaire_livraison IS NOT NULL THEN ' | Livraison: ' || commentaire_livraison ELSE '' END, commentaire_livraison, commentaire)
            WHERE commentaire IS NULL AND (commentaire_restaurant IS NOT NULL OR commentaire_livraison IS NOT NULL)
          `);
          console.log('Données migrées vers la colonne commentaire');
        }
      } catch (migrationError) {
        // Ignorer les erreurs de migration si les colonnes n'existent pas
        if (!migrationError.message.includes('duplicate column') && !migrationError.message.includes('no such column')) {
          console.log('Erreur migration avis:', migrationError.message);
        }
      }
    } catch (error) {
      // Ignorer si la table existe déjà
      if (!error.message.includes('already exists') && !error.message.includes('duplicate')) {
        console.log('Table avis déjà présente ou erreur:', error.message);
      }
    }
    
    // Créer le mot de passe hashé pour l'admin
    const adminPassword = '062998295';
    const hashedPassword = bcrypt.hashSync(adminPassword, 10);
    
    // Vérifier si l'admin existe déjà avec le nouvel email
    let adminExists = await db.get('SELECT id FROM clients WHERE email = ?', 'ngwezinbe@gmail.com');
    
    if (adminExists) {
      // Mettre à jour le mot de passe et le téléphone de l'admin
      await db.run('UPDATE clients SET password = ?, role = ?, telephone = ? WHERE email = ?', hashedPassword, 'admin', '62998295', 'ngwezinbe@gmail.com');
      console.log('Compte admin mis à jour avec succès');
    } else {
      // Vérifier si l'admin existe avec l'ancien email ou l'ID 1 (migration)
      const oldAdmin = await db.get('SELECT id FROM clients WHERE email = ? OR id = ?', 'hosnyhologram@gmail.com', 1);
      
      if (oldAdmin) {
        // Migrer l'ancien compte admin vers le nouvel email
        await db.run('UPDATE clients SET email = ?, password = ?, role = ?, telephone = ? WHERE id = ?', 
          'ngwezinbe@gmail.com', hashedPassword, 'admin', '62998295', oldAdmin.id);
        console.log('Compte admin migré vers le nouvel email avec succès');
      } else {
        // Créer l'admin si il n'existe pas
        await db.run(
          'INSERT INTO clients (id, nom, prenom, email, telephone, password, role) VALUES (?, ?, ?, ?, ?, ?, ?)',
          1, 'Admin', 'Système', 'ngwezinbe@gmail.com', '62998295', hashedPassword, 'admin'
        );
        console.log('Compte admin créé avec succès');
      }
    }
    
    // Mettre à jour le numéro de téléphone du restaurant
    try {
      await db.run('UPDATE restaurants SET telephone = ? WHERE id = 1', '062998295');
      console.log('Numéro de téléphone du restaurant mis à jour');
    } catch (error) {
      // Ignorer si le restaurant n'existe pas encore
    }
    
    console.log('Email: ngwezinbe@gmail.com');
    console.log('Mot de passe: 062998295');
    console.log('Base de données initialisée avec succès!');
    console.log('Restaurant: Livraison Service Food');
    console.log('Localisation: Quartier Louis, Libreville, Gabon');
    console.log('Téléphone WhatsApp: 62998295');
  } catch (error) {
    // Ignorer les erreurs si les tables existent déjà
    if (!error.message.includes('already exists') && !error.message.includes('duplicate') && !error.message.includes('UNIQUE constraint')) {
      console.error('Erreur lors de l\'initialisation:', error.message);
      console.error(error);
    } else {
      console.log('Base de données déjà initialisée.');
      // S'assurer que le mot de passe admin est à jour
      try {
        const adminPassword = '062998295';
        const hashedPassword = bcrypt.hashSync(adminPassword, 10);
        let adminExists = await db.get('SELECT id FROM clients WHERE email = ?', 'ngwezinbe@gmail.com');
        
        if (adminExists) {
          await db.run('UPDATE clients SET password = ?, role = ?, telephone = ? WHERE email = ?', hashedPassword, 'admin', '62998295', 'ngwezinbe@gmail.com');
        } else {
          // Vérifier si l'admin existe avec l'ancien email ou l'ID 1 (migration)
          const oldAdmin = await db.get('SELECT id FROM clients WHERE email = ? OR id = ?', 'hosnyhologram@gmail.com', 1);
          if (oldAdmin) {
            // Migrer l'ancien compte admin vers le nouvel email
            await db.run('UPDATE clients SET email = ?, password = ?, role = ?, telephone = ? WHERE id = ?', 
              'ngwezinbe@gmail.com', hashedPassword, 'admin', '62998295', oldAdmin.id);
            console.log('Compte admin migré vers le nouvel email');
          }
        }
        
        // Mettre à jour le numéro de téléphone du restaurant
        try {
          await db.run('UPDATE restaurants SET telephone = ? WHERE id = 1', '062998295');
          console.log('Numéro de téléphone du restaurant mis à jour');
        } catch (updateRestaurantError) {
          // Ignorer les erreurs
        }
      } catch (updateError) {
        // Ignorer les erreurs de mise à jour
        console.log('Erreur lors de la mise à jour admin:', updateError.message);
      }
    }
  }
}

// Appeler la fonction d'initialisation après un petit délai pour laisser la DB s'initialiser
setTimeout(initDatabase, 100);

module.exports = db;
