-- Migration pour ajouter la table avis
-- Table des avis et évaluations

CREATE TABLE IF NOT EXISTS avis (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    commande_id INTEGER NOT NULL,
    client_id INTEGER NOT NULL,
    restaurant_id INTEGER NOT NULL,
    note_restaurant INTEGER NOT NULL CHECK(note_restaurant >= 1 AND note_restaurant <= 5),
    note_livraison INTEGER CHECK(note_livraison >= 1 AND note_livraison <= 5),
    commentaire TEXT,
    date_avis DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (commande_id) REFERENCES commandes(id) ON DELETE CASCADE,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
    FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE,
    UNIQUE(commande_id) -- Un seul avis par commande
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_avis_restaurant ON avis(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_avis_client ON avis(client_id);
CREATE INDEX IF NOT EXISTS idx_avis_commande ON avis(commande_id);
CREATE INDEX IF NOT EXISTS idx_avis_date ON avis(date_avis);

