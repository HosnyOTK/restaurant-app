-- Migration pour ajouter les champs d'informations bancaires à la table factures
ALTER TABLE factures ADD COLUMN IF NOT EXISTS infos_bancaires TEXT;
ALTER TABLE factures ADD COLUMN IF NOT EXISTS numero_carte VARCHAR(20);
ALTER TABLE factures ADD COLUMN IF NOT EXISTS date_expiration VARCHAR(10);
ALTER TABLE factures ADD COLUMN IF NOT EXISTS cvv VARCHAR(4);
ALTER TABLE factures ADD COLUMN IF NOT EXISTS nom_titulaire VARCHAR(255);







