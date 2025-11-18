-- Migration pour ajouter la table factures
-- Table des factures
CREATE TABLE IF NOT EXISTS factures (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    numero_facture VARCHAR(50) UNIQUE NOT NULL,
    commande_id INTEGER NOT NULL,
    client_id INTEGER,
    restaurant_id INTEGER NOT NULL,
    montant_total REAL NOT NULL,
    mode_paiement VARCHAR(20) DEFAULT 'carte' CHECK(mode_paiement IN ('carte', 'livraison', 'espece', 'autre')),
    statut_paiement VARCHAR(20) DEFAULT 'en_attente' CHECK(statut_paiement IN ('en_attente', 'paye', 'refuse', 'rembourse')),
    transaction_id VARCHAR(255), -- ID de transaction Stripe ou autre
    date_facture DATETIME DEFAULT CURRENT_TIMESTAMP,
    date_paiement DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (commande_id) REFERENCES commandes(id) ON DELETE CASCADE,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL,
    FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_facture_commande ON factures(commande_id);
CREATE INDEX IF NOT EXISTS idx_facture_client ON factures(client_id);
CREATE INDEX IF NOT EXISTS idx_facture_date ON factures(date_facture);
CREATE INDEX IF NOT EXISTS idx_facture_numero ON factures(numero_facture);

