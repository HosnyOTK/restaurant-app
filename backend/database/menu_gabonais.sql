-- Menu gabonais pour le restaurant
-- À exécuter après la création de la base de données

-- Supprimer les anciennes données de test
DELETE FROM plats WHERE restaurant_id = 1;
DELETE FROM categories WHERE restaurant_id = 1;

-- Catégories gabonaises
INSERT OR REPLACE INTO categories (id, restaurant_id, nom, description, ordre) VALUES
(1, 1, 'Plats Principaux', 'Nos plats traditionnels gabonais', 1),
(2, 1, 'Soupes & Ragoûts', 'Soupes et ragoûts savoureux', 2),
(3, 1, 'Accompagnements', 'Riz, plantain, igname et plus', 3),
(4, 1, 'Poissons & Fruits de Mer', 'Poissons et fruits de mer frais', 4),
(5, 1, 'Desserts', 'Desserts traditionnels et modernes', 5),
(6, 1, 'Boissons', 'Boissons rafraîchissantes', 6);

-- Plats traditionnels gabonais (6 plats seulement)
INSERT OR REPLACE INTO plats (restaurant_id, nom, description, prix, categorie_id, disponible) VALUES
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










