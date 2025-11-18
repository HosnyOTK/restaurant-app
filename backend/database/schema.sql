-- Base de données SQLite pour application restaurant en ligne
-- Projet BTS Génie Informatique

-- Table des restaurants
CREATE TABLE IF NOT EXISTS restaurants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nom VARCHAR(100) NOT NULL,
    description TEXT,
    adresse TEXT,
    telephone VARCHAR(20),
    image_url VARCHAR(255),
    horaires VARCHAR(255),
    actif BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Table des catégories de plats (par restaurant)
CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    restaurant_id INTEGER NOT NULL,
    nom VARCHAR(100) NOT NULL,
    description TEXT,
    image_url VARCHAR(255),
    ordre INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE
);

-- Table des plats/menu
CREATE TABLE IF NOT EXISTS plats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    restaurant_id INTEGER NOT NULL,
    nom VARCHAR(100) NOT NULL,
    description TEXT,
    prix REAL NOT NULL,
    categorie_id INTEGER,
    image_url VARCHAR(255),
    disponible BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE,
    FOREIGN KEY (categorie_id) REFERENCES categories(id) ON DELETE SET NULL
);

-- Table des quartiers personnalisés
CREATE TABLE IF NOT EXISTS quartiers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nom VARCHAR(100) NOT NULL UNIQUE,
    commune VARCHAR(50),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Table des clients (utilisateurs)
CREATE TABLE IF NOT EXISTS clients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nom VARCHAR(100) NOT NULL,
    prenom VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    telephone VARCHAR(20),
    adresse TEXT,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'client' CHECK(role IN ('client', 'admin', 'livreur')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Table des commandes
CREATE TABLE IF NOT EXISTS commandes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id INTEGER,
    restaurant_id INTEGER NOT NULL,
    livreur_id INTEGER,
    statut VARCHAR(20) DEFAULT 'pending' CHECK(statut IN ('pending', 'confirmed', 'preparing', 'ready', 'delivered', 'annulee')),
    date_commande DATETIME DEFAULT CURRENT_TIMESTAMP,
    date_livraison DATETIME,
    total REAL NOT NULL,
    adresse_livraison TEXT,
    telephone VARCHAR(20),
    notes TEXT,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL,
    FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE,
    FOREIGN KEY (livreur_id) REFERENCES clients(id) ON DELETE SET NULL
);

-- Table des détails de commande
CREATE TABLE IF NOT EXISTS commande_details (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    commande_id INTEGER NOT NULL,
    plat_id INTEGER NOT NULL,
    quantite INTEGER NOT NULL DEFAULT 1,
    prix_unitaire REAL NOT NULL,
    sous_total REAL NOT NULL,
    FOREIGN KEY (commande_id) REFERENCES commandes(id) ON DELETE CASCADE,
    FOREIGN KEY (plat_id) REFERENCES plats(id) ON DELETE CASCADE
);

-- Configuration pour le Gabon
-- Restaurant principal localisé à Quartier Louis, Libreville
INSERT OR IGNORE INTO restaurants (id, nom, description, adresse, telephone, horaires) VALUES
(1, 'Livraison Service Food', 'Service de livraison rapide de fastfood et cuisine traditionnelle gabonaise', 'Quartier Louis, Libreville, Gabon', '062998295', 'Lun-Dim: 11h-23h');

-- Compte administrateur par défaut
-- Email: ngwezinbe@gmail.com
-- Mot de passe: 062998295 (sera hashé dans le code)
-- Le mot de passe sera hashé avec bcrypt lors de l'initialisation
INSERT OR IGNORE INTO clients (id, nom, prenom, email, telephone, role) VALUES
(1, 'Admin', 'Système', 'ngwezinbe@gmail.com', '62998295', 'admin');
-- Le mot de passe sera défini dans le script d'initialisation

-- Catégories gabonaises (restaurant_id = 1)
INSERT OR IGNORE INTO categories (id, restaurant_id, nom, description, ordre) VALUES
(1, 1, 'Plats Principaux', 'Nos plats traditionnels gabonais', 1),
(2, 1, 'Soupes & Ragoûts', 'Soupes et ragoûts savoureux', 2),
(3, 1, 'Accompagnements', 'Riz, plantain, igname et plus', 3),
(4, 1, 'Poissons & Fruits de Mer', 'Poissons et fruits de mer frais', 4),
(5, 1, 'Desserts', 'Desserts traditionnels et modernes', 5),
(6, 1, 'Boissons', 'Boissons rafraîchissantes', 6);

-- Plats traditionnels gabonais (6 plats seulement)
INSERT OR IGNORE INTO plats (restaurant_id, nom, description, prix, categorie_id, disponible) VALUES
-- Plats Principaux
(1, 'Nyembwé au Poulet', 'Poulet cuit dans une sauce à base de graines de palme, accompagné de riz ou plantain', 5500, 1, 1),
(1, 'Poulet DG', 'Poulet sauté avec plantain, légumes et épices', 6000, 1, 1),

-- Soupes & Ragoûts
(1, 'Soupe de Poisson', 'Soupe de poissons frais avec légumes et épices', 4500, 2, 1),

-- Accompagnements
(1, 'Riz Blanc', 'Riz blanc parfumé', 1000, 3, 1),

-- Poissons & Fruits de Mer
(1, 'Capitaine Braisé', 'Capitaine grillé avec accompagnements', 6500, 4, 1),

-- Boissons
(1, 'Jus de Bissap', 'Jus d''hibiscus traditionnel', 1500, 6, 1);
