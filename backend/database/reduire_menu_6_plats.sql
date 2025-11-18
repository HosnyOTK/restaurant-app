-- Script pour réduire le menu à seulement 6 plats
-- Supprime tous les plats et garde seulement 6 plats sélectionnés

-- Supprimer tous les plats existants
DELETE FROM plats WHERE restaurant_id = 1;

-- Réinsérer seulement 6 plats variés
INSERT INTO plats (restaurant_id, nom, description, prix, categorie_id, disponible) VALUES
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


