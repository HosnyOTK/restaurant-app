# Documentation de la Base de Données

## 📊 Modèle Conceptuel de Données (MCD)

### Entités principales

1. **CATEGORIES** : Catégorisation des plats (Entrées, Plats principaux, Desserts, Boissons)
2. **PLATS** : Les plats disponibles au menu
3. **CLIENTS** : Les utilisateurs de l'application
4. **COMMANDES** : Les commandes passées par les clients
5. **COMMANDE_DETAILS** : Détails des plats dans chaque commande

### Relations

- CATEGORIES (1) ────< (N) PLATS
- CLIENTS (1) ────< (N) COMMANDES
- COMMANDES (1) ────< (N) COMMANDE_DETAILS
- PLATS (1) ────< (N) COMMANDE_DETAILS

## 📋 Structure des tables

### Table CATEGORIES

| Colonne      | Type         | Contraintes        | Description                    |
|--------------|--------------|--------------------|--------------------------------|
| id           | INT          | PRIMARY KEY, AUTO  | Identifiant unique             |
| nom          | VARCHAR(100) | NOT NULL           | Nom de la catégorie            |
| description  | TEXT         |                    | Description de la catégorie    |
| image_url    | VARCHAR(255) |                    | URL de l'image                 |
| created_at   | TIMESTAMP    | DEFAULT CURRENT    | Date de création               |

### Table PLATS

| Colonne      | Type         | Contraintes                    | Description                    |
|--------------|--------------|--------------------------------|--------------------------------|
| id           | INT          | PRIMARY KEY, AUTO              | Identifiant unique             |
| nom          | VARCHAR(100) | NOT NULL                       | Nom du plat                    |
| description  | TEXT         |                                | Description du plat            |
| prix         | DECIMAL(10,2)| NOT NULL                       | Prix en euros                  |
| categorie_id | INT          | FOREIGN KEY → categories(id)   | Catégorie du plat              |
| image_url    | VARCHAR(255) |                                | URL de l'image                 |
| disponible   | BOOLEAN      | DEFAULT TRUE                   | Disponibilité du plat          |
| created_at   | TIMESTAMP    | DEFAULT CURRENT                | Date de création               |

### Table CLIENTS

| Colonne      | Type         | Contraintes        | Description                    |
|--------------|--------------|--------------------|--------------------------------|
| id           | INT          | PRIMARY KEY, AUTO  | Identifiant unique             |
| nom          | VARCHAR(100) | NOT NULL           | Nom du client                  |
| prenom       | VARCHAR(100) | NOT NULL           | Prénom du client               |
| email        | VARCHAR(100) | UNIQUE, NOT NULL   | Email (identifiant connexion)  |
| telephone    | VARCHAR(20)  |                    | Numéro de téléphone            |
| adresse      | TEXT         |                    | Adresse de livraison           |
| password     | VARCHAR(255) | NOT NULL           | Mot de passe hashé (bcrypt)    |
| created_at   | TIMESTAMP    | DEFAULT CURRENT    | Date d'inscription             |

### Table COMMANDES

| Colonne           | Type      | Contraintes                    | Description                    |
|-------------------|-----------|--------------------------------|--------------------------------|
| id                | INT       | PRIMARY KEY, AUTO              | Identifiant unique             |
| client_id         | INT       | FOREIGN KEY → clients(id)      | Client ayant passé la commande |
| statut            | ENUM      | DEFAULT 'en_attente'           | Statut de la commande          |
| date_commande     | TIMESTAMP | DEFAULT CURRENT                | Date de la commande            |
| date_livraison    | TIMESTAMP | NULL                           | Date de livraison              |
| total             | DECIMAL   | NOT NULL                       | Montant total en euros         |
| adresse_livraison | TEXT      |                                | Adresse de livraison           |
| telephone         | VARCHAR   |                                | Téléphone de contact           |
| notes             | TEXT      |                                | Notes spéciales                |

**Statuts possibles :**
- `en_attente` : Commande en attente de traitement
- `en_preparation` : Commande en cours de préparation
- `prete` : Commande prête à être livrée
- `livree` : Commande livrée
- `annulee` : Commande annulée

### Table COMMANDE_DETAILS

| Colonne        | Type         | Contraintes                    | Description                    |
|----------------|--------------|--------------------------------|--------------------------------|
| id             | INT          | PRIMARY KEY, AUTO              | Identifiant unique             |
| commande_id    | INT          | FOREIGN KEY → commandes(id)    | Commande associée              |
| plat_id        | INT          | FOREIGN KEY → plats(id)        | Plat commandé                  |
| quantite       | INT          | NOT NULL, DEFAULT 1            | Quantité commandée             |
| prix_unitaire  | DECIMAL(10,2)| NOT NULL                       | Prix au moment de la commande  |
| sous_total     | DECIMAL(10,2)| NOT NULL                       | Total pour cette ligne         |

## 🔍 Requêtes SQL importantes

### Requête pour obtenir une commande complète
```sql
SELECT 
    c.*,
    cl.nom as client_nom,
    cl.prenom as client_prenom,
    GROUP_CONCAT(
        CONCAT(cd.quantite, 'x ', p.nom, ' (', cd.prix_unitaire, '€)') 
        SEPARATOR ', '
    ) as items_detail
FROM commandes c
LEFT JOIN clients cl ON c.client_id = cl.id
LEFT JOIN commande_details cd ON c.id = cd.commande_id
LEFT JOIN plats p ON cd.plat_id = p.id
WHERE c.id = ?
GROUP BY c.id;
```

### Requête pour obtenir le menu avec catégories
```sql
SELECT 
    p.*, 
    c.nom as categorie_nom 
FROM plats p 
LEFT JOIN categories c ON p.categorie_id = c.id 
WHERE p.disponible = 1
ORDER BY c.nom, p.nom;
```

### Calcul du total d'une commande
```sql
SELECT SUM(sous_total) as total
FROM commande_details
WHERE commande_id = ?;
```

## 📈 Index recommandés

Pour optimiser les performances, on pourrait ajouter :

```sql
CREATE INDEX idx_plats_categorie ON plats(categorie_id);
CREATE INDEX idx_commande_client ON commandes(client_id);
CREATE INDEX idx_commande_statut ON commandes(statut);
CREATE INDEX idx_commande_details_commande ON commande_details(commande_id);
CREATE INDEX idx_clients_email ON clients(email);
```

## 🔐 Sécurité

- Les mots de passe sont hashés avec **bcrypt** (10 rounds)
- Utilisation de requêtes préparées pour éviter les injections SQL
- Contrainte UNIQUE sur l'email des clients
- Clés étrangères pour maintenir l'intégrité référentielle

## 📝 Données d'exemple

Le fichier `schema.sql` contient :
- 4 catégories
- 9 plats répartis dans les catégories
- Structure prête pour les commandes

Ces données permettent de tester l'application immédiatement après l'installation.

## 🎯 Points pour votre rapport

Pour votre rapport de BTS, vous pouvez mentionner :

1. **Normalisation** : Base de données en 3NF (troisième forme normale)
2. **Intégrité référentielle** : Utilisation des clés étrangères avec ON DELETE CASCADE
3. **Performance** : Décimal pour les prix, index sur les clés étrangères
4. **Sécurité** : Hashage des mots de passe, validation des données
5. **Traçabilité** : Champ `created_at` pour l'historique











