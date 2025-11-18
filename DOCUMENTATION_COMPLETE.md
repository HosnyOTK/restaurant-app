# Documentation Complète du Projet
## Application Web de Restaurant en Ligne

**Projet BTS Génie Informatique**

---

## 📑 Table des matières

1. [Vue d'ensemble du projet](#1-vue-densemble-du-projet)
2. [Architecture générale](#2-architecture-générale)
3. [Backend - API REST](#3-backend---api-rest)
4. [Base de données](#4-base-de-données)
5. [Frontend - Interface utilisateur](#5-frontend---interface-utilisateur)
6. [Fonctionnalités principales](#6-fonctionnalités-principales)
7. [Sécurité](#7-sécurité)
8. [Installation et déploiement](#8-installation-et-déploiement)

---

## 1. Vue d'ensemble du projet

### 1.1 Objectif

Créer une application web complète permettant aux clients d'un restaurant de :
- Consulter le menu en ligne
- Constituer un panier d'achat
- Passer des commandes
- Suivre l'état de leurs commandes
- Gérer leur compte client

### 1.2 Technologies utilisées

**Backend :**
- Node.js (v14+)
- Express.js (Framework web)
- MySQL (Base de données relationnelle)
- JWT (Authentification)
- bcryptjs (Hachage des mots de passe)

**Frontend :**
- React.js (Bibliothèque JavaScript)
- HTML5 / CSS3
- JavaScript ES6+

**Outils de développement :**
- npm (Gestionnaire de paquets)
- nodemon (Développement backend)
- Git (Contrôle de version)

---

## 2. Architecture générale

### 2.1 Architecture client-serveur

L'application suit une architecture **client-serveur** avec séparation claire des responsabilités :

```
┌─────────────────┐         HTTP/REST         ┌─────────────────┐
│                 │ ◄────────────────────────► │                 │
│   Frontend      │                            │    Backend      │
│   (React)       │         JSON               │   (Node.js)     │
│   Port 3000     │                            │   Port 5000     │
│                 │                            │                 │
└─────────────────┘                            └────────┬────────┘
                                                        │
                                                        │ SQL
                                                        │
                                                ┌───────▼────────┐
                                                │                │
                                                │   MySQL        │
                                                │   Database     │
                                                │                │
                                                └────────────────┘
```

### 2.2 Principe de fonctionnement

1. **Client (Navigateur)** : L'utilisateur interagit avec l'interface React
2. **Frontend** : Envoie des requêtes HTTP vers le backend
3. **Backend** : Traite les requêtes, interroge la base de données
4. **Base de données** : Stocke et retourne les données
5. **Backend** : Formate les réponses en JSON et les envoie au frontend
6. **Frontend** : Met à jour l'interface utilisateur

### 2.3 Structure des dossiers

```
Restaurant final/
├── backend/                    # Application serveur
│   ├── config/                # Configuration
│   │   └── database.js        # Connexion MySQL
│   ├── database/              # Scripts SQL
│   │   └── schema.sql         # Schéma de base de données
│   ├── routes/                # Routes API
│   │   ├── menu.js           # Gestion du menu
│   │   ├── commandes.js      # Gestion des commandes
│   │   ├── auth.js           # Authentification
│   │   └── clients.js        # Gestion des clients
│   ├── server.js             # Point d'entrée
│   ├── package.json          # Dépendances backend
│   └── .env                  # Variables d'environnement
│
├── frontend/                   # Application cliente
│   ├── public/               # Fichiers statiques
│   ├── src/                  # Code source React
│   │   ├── components/       # Composants React
│   │   ├── App.js           # Composant principal
│   │   ├── App.css          # Styles globaux
│   │   └── index.js         # Point d'entrée
│   └── package.json          # Dépendances frontend
│
└── package.json               # Scripts globaux
```

---

## 3. Backend - API REST

### 3.1 Présentation

Le backend est une **API REST** (Representational State Transfer) développée avec Node.js et Express.js. Elle expose des endpoints HTTP permettant au frontend d'interagir avec la base de données.

### 3.2 Configuration du serveur

**Fichier : `backend/server.js`**

```javascript
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());                    // Autorise les requêtes cross-origin
app.use(bodyParser.json());         // Parse les données JSON
app.use(bodyParser.urlencoded({ extended: true }));

// Routes
app.use('/api/menu', menuRoutes);
app.use('/api/commandes', commandeRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/clients', clientRoutes);
```

**Fonctionnalités principales :**
- **CORS** : Permet au frontend (port 3000) de communiquer avec le backend (port 5000)
- **Body Parser** : Convertit les données JSON en objets JavaScript
- **Routes modulaires** : Organisation par domaine fonctionnel

### 3.3 Connexion à la base de données

**Fichier : `backend/config/database.js`**

```javascript
const mysql = require('mysql2');
require('dotenv').config();

const connection = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'restaurant_db'
});

// Promisify pour utiliser async/await
const db = connection.promise();
```

**Caractéristiques :**
- Utilisation de **mysql2** avec support des Promises
- Configuration via variables d'environnement (.env)
- Gestion d'erreurs automatique

### 3.4 Routes API - Détail des endpoints

#### 3.4.1 Gestion du menu (`/api/menu`)

**GET /api/menu/plats**
- **Description** : Récupère tous les plats disponibles
- **Paramètres** : Aucun
- **Réponse** : Liste des plats avec leurs catégories
- **Exemple de réponse** :
```json
[
  {
    "id": 1,
    "nom": "Salade César",
    "description": "Salade fraîche avec poulet grillé",
    "prix": "12.50",
    "categorie_id": 1,
    "categorie_nom": "Entrées",
    "disponible": true
  }
]
```

**GET /api/menu/plats/:id**
- **Description** : Récupère un plat spécifique
- **Paramètres** : `id` (identifiant du plat)
- **Réponse** : Détails du plat

**GET /api/menu/categories**
- **Description** : Récupère toutes les catégories
- **Réponse** : Liste des catégories

**GET /api/menu/categories/:id/plats**
- **Description** : Récupère les plats d'une catégorie
- **Paramètres** : `id` (identifiant de la catégorie)

**Implémentation technique :**

```javascript
router.get('/plats', async (req, res) => {
  try {
    const [plats] = await db.query(`
      SELECT p.*, c.nom as categorie_nom 
      FROM plats p 
      LEFT JOIN categories c ON p.categorie_id = c.id 
      WHERE p.disponible = 1
      ORDER BY c.nom, p.nom
    `);
    res.json(plats);
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});
```

**Points techniques :**
- Utilisation de **async/await** pour gérer les opérations asynchrones
- **JOIN SQL** pour récupérer les informations de catégorie
- **Gestion d'erreurs** avec try/catch
- **Codes HTTP** appropriés (200 pour succès, 500 pour erreur serveur)

#### 3.4.2 Authentification (`/api/auth`)

**POST /api/auth/register**
- **Description** : Inscription d'un nouveau client
- **Body** :
```json
{
  "nom": "Dupont",
  "prenom": "Jean",
  "email": "jean@example.com",
  "password": "motdepasse123",
  "telephone": "0123456789",
  "adresse": "123 Rue Example"
}
```
- **Réponse** :
```json
{
  "message": "Inscription réussie",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "client": {
    "id": 1,
    "nom": "Dupont",
    "prenom": "Jean",
    "email": "jean@example.com"
  }
}
```

**POST /api/auth/login**
- **Description** : Connexion d'un client existant
- **Body** :
```json
{
  "email": "jean@example.com",
  "password": "motdepasse123"
}
```

**Implémentation technique :**

```javascript
// Inscription
router.post('/register', async (req, res) => {
  const { nom, prenom, email, password } = req.body;
  
  // Vérifier si l'email existe déjà
  const [existing] = await db.query(
    'SELECT id FROM clients WHERE email = ?', 
    [email]
  );
  
  if (existing.length > 0) {
    return res.status(400).json({ error: 'Cet email est déjà utilisé' });
  }
  
  // Hasher le mot de passe
  const hashedPassword = await bcrypt.hash(password, 10);
  
  // Créer le client
  const [result] = await db.query(
    'INSERT INTO clients (...) VALUES (...)',
    [nom, prenom, email, hashedPassword, ...]
  );
  
  // Générer un token JWT
  const token = jwt.sign(
    { id: result.insertId, email },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
  
  res.status(201).json({ message: 'Inscription réussie', token, client });
});
```

**Sécurité implémentée :**
- **Validation des données** : Vérification des champs obligatoires
- **Hachage bcrypt** : Mots de passe hashés avec 10 rounds
- **JWT** : Tokens d'authentification avec expiration (7 jours)
- **Vérification d'unicité** : Contrôle des emails existants

#### 3.4.3 Gestion des commandes (`/api/commandes`)

**POST /api/commandes**
- **Description** : Créer une nouvelle commande
- **Body** :
```json
{
  "client_id": 1,
  "items": [
    { "plat_id": 1, "quantite": 2 },
    { "plat_id": 3, "quantite": 1 }
  ],
  "adresse_livraison": "123 Rue Example",
  "telephone": "0123456789"
}
```
- **Processus** :
  1. Validation des plats existants
  2. Calcul du total
  3. Création de la commande
  4. Création des détails de commande

**GET /api/commandes/client/:clientId**
- **Description** : Récupère toutes les commandes d'un client
- **Authentification** : Requise (token JWT)

**GET /api/commandes/:id**
- **Description** : Récupère une commande spécifique avec ses détails

**PATCH /api/commandes/:id/statut**
- **Description** : Met à jour le statut d'une commande
- **Body** :
```json
{
  "statut": "en_preparation"
}
```

**Implémentation technique :**

```javascript
router.post('/', async (req, res) => {
  const { items, client_id } = req.body;
  
  // Calculer le total
  let total = 0;
  for (const item of items) {
    const [plats] = await db.query(
      'SELECT prix FROM plats WHERE id = ?', 
      [item.plat_id]
    );
    total += parseFloat(plats[0].prix) * item.quantite;
  }
  
  // Créer la commande
  const [commandeResult] = await db.query(
    'INSERT INTO commandes (client_id, total, statut) VALUES (?, ?, ?)',
    [client_id, total, 'en_attente']
  );
  
  // Créer les détails
  for (const item of items) {
    await db.query(
      'INSERT INTO commande_details (...) VALUES (...)',
      [commandeResult.insertId, item.plat_id, item.quantite, ...]
    );
  }
  
  res.status(201).json({ message: 'Commande créée', commande });
});
```

**Points techniques :**
- **Transactions implicites** : Utilisation de requêtes préparées
- **Calcul du total** : Agrégation côté serveur
- **Validation** : Vérification de l'existence des plats
- **Gestion des statuts** : Workflow de commande

#### 3.4.4 Gestion des clients (`/api/clients`)

**GET /api/clients/:id**
- **Description** : Récupère les informations d'un client
- **Sécurité** : Ne retourne pas le mot de passe

**PUT /api/clients/:id**
- **Description** : Met à jour les informations d'un client

---

## 4. Base de données

### 4.1 Modèle conceptuel

Le modèle de données suit une **approche relationnelle** avec 5 tables principales :

```
┌─────────────┐         ┌─────────────┐
│ CATEGORIES  │◄────────┤    PLATS    │
│             │   1:N   │             │
└─────────────┘         └──────┬──────┘
                               │
                               │ N:1
                               │
                      ┌────────▼────────┐
                      │ COMMANDE_DETAILS│
                      │                 │
                      └────────┬────────┘
                               │
                               │ N:1
                               │
                      ┌────────▼────────┐
                      │   COMMANDES     │
                      │                 │
                      └────────┬────────┘
                               │
                               │ N:1
                               │
                      ┌────────▼────────┐
                      │    CLIENTS      │
                      │                 │
                      └─────────────────┘
```

### 4.2 Détail des tables

#### Table CATEGORIES

**Objectif** : Catégoriser les plats du menu

| Colonne      | Type         | Contraintes      | Description                    |
|--------------|--------------|------------------|--------------------------------|
| id           | INT          | PK, AUTO_INCREMENT| Identifiant unique            |
| nom          | VARCHAR(100) | NOT NULL         | Nom de la catégorie           |
| description  | TEXT         |                  | Description                    |
| image_url    | VARCHAR(255) |                  | URL de l'image                 |
| created_at   | TIMESTAMP    | DEFAULT CURRENT  | Date de création              |

**Exemples de données :**
- Entrées
- Plats principaux
- Desserts
- Boissons

#### Table PLATS

**Objectif** : Stocker les informations des plats du menu

| Colonne      | Type         | Contraintes              | Description                    |
|--------------|--------------|--------------------------|--------------------------------|
| id           | INT          | PK, AUTO_INCREMENT       | Identifiant unique            |
| nom          | VARCHAR(100) | NOT NULL                 | Nom du plat                    |
| description  | TEXT         |                          | Description détaillée          |
| prix         | DECIMAL(10,2)| NOT NULL                 | Prix en euros (max 99999999.99)|
| categorie_id | INT          | FK → categories(id)      | Catégorie du plat              |
| image_url    | VARCHAR(255) |                          | URL de l'image                 |
| disponible   | BOOLEAN      | DEFAULT TRUE             | Disponibilité                  |
| created_at   | TIMESTAMP    | DEFAULT CURRENT          | Date d'ajout                   |

**Contrainte de clé étrangère :**
```sql
FOREIGN KEY (categorie_id) REFERENCES categories(id) ON DELETE SET NULL
```
- Si une catégorie est supprimée, `categorie_id` devient NULL (pas de suppression en cascade)

#### Table CLIENTS

**Objectif** : Gérer les comptes clients

| Colonne      | Type         | Contraintes      | Description                    |
|--------------|--------------|------------------|--------------------------------|
| id           | INT          | PK, AUTO_INCREMENT| Identifiant unique            |
| nom          | VARCHAR(100) | NOT NULL         | Nom de famille                 |
| prenom       | VARCHAR(100) | NOT NULL         | Prénom                         |
| email        | VARCHAR(100) | UNIQUE, NOT NULL | Email (identifiant)            |
| telephone    | VARCHAR(20)  |                  | Téléphone                      |
| adresse      | TEXT         |                  | Adresse complète               |
| password     | VARCHAR(255) | NOT NULL         | Mot de passe hashé (bcrypt)    |
| created_at   | TIMESTAMP    | DEFAULT CURRENT  | Date d'inscription             |

**Sécurité :**
- **UNIQUE** sur email : Un seul compte par email
- **VARCHAR(255)** pour password : Stocke le hash bcrypt (60 caractères)
- **NOT NULL** sur les champs essentiels

#### Table COMMANDES

**Objectif** : Enregistrer les commandes passées

| Colonne           | Type      | Contraintes              | Description                    |
|-------------------|-----------|--------------------------|--------------------------------|
| id                | INT       | PK, AUTO_INCREMENT       | Identifiant unique            |
| client_id         | INT       | FK → clients(id)         | Client                         |
| statut            | ENUM      | DEFAULT 'en_attente'     | Statut de la commande         |
| date_commande     | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP| Date/heure de commande        |
| date_livraison    | TIMESTAMP | NULL                     | Date/heure de livraison       |
| total             | DECIMAL(10,2)| NOT NULL              | Montant total                 |
| adresse_livraison | TEXT      |                          | Adresse de livraison          |
| telephone         | VARCHAR(20)|                         | Téléphone de contact          |
| notes             | TEXT      |                          | Notes spéciales               |

**Statuts possibles (ENUM) :**
- `en_attente` : Commande reçue, en attente de traitement
- `en_preparation` : Commande en cours de préparation
- `prete` : Commande prête pour livraison
- `livree` : Commande livrée au client
- `annulee` : Commande annulée

**Workflow de statut :**
```
en_attente → en_preparation → prete → livree
                        ↓
                   annulee
```

#### Table COMMANDE_DETAILS

**Objectif** : Stocker les détails de chaque commande (lignes de commande)

| Colonne        | Type         | Contraintes              | Description                    |
|----------------|--------------|--------------------------|--------------------------------|
| id             | INT          | PK, AUTO_INCREMENT       | Identifiant unique            |
| commande_id    | INT          | FK → commandes(id)       | Commande associée              |
| plat_id        | INT          | FK → plats(id)           | Plat commandé                  |
| quantite       | INT          | NOT NULL, DEFAULT 1      | Quantité                       |
| prix_unitaire  | DECIMAL(10,2)| NOT NULL                 | Prix au moment de la commande  |
| sous_total     | DECIMAL(10,2)| NOT NULL                 | quantite × prix_unitaire       |

**Contraintes de clés étrangères :**
```sql
FOREIGN KEY (commande_id) REFERENCES commandes(id) ON DELETE CASCADE
FOREIGN KEY (plat_id) REFERENCES plats(id) ON DELETE CASCADE
```
- **CASCADE** : Si une commande est supprimée, ses détails le sont aussi
- **CASCADE** : Si un plat est supprimé, ses références dans les commandes aussi

**Principe d'historique :**
- Le `prix_unitaire` est sauvegardé au moment de la commande
- Si le prix du plat change, les anciennes commandes conservent le prix original

### 4.3 Requêtes SQL importantes

#### Récupérer une commande complète avec détails

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

**Explication :**
- **JOIN** : Jointure entre commandes, clients, détails et plats
- **GROUP_CONCAT** : Agrège les détails en une seule chaîne
- **Paramètre ?** : Requête préparée pour sécurité

#### Calculer le total d'une commande

```sql
SELECT SUM(sous_total) as total
FROM commande_details
WHERE commande_id = ?;
```

### 4.4 Normalisation

La base de données respecte la **troisième forme normale (3NF)** :

1. **1NF** : Chaque colonne contient une valeur atomique
2. **2NF** : Dépendances fonctionnelles complètes
3. **3NF** : Pas de dépendances transitives

**Exemple de normalisation :**
- Le prix est dans `commande_details`, pas dans `commandes`
- Les détails sont dans une table séparée (`commande_details`)

---

## 5. Frontend - Interface utilisateur

### 5.1 Architecture React

L'application frontend utilise **React** avec une architecture composants :

```
App.js (Composant principal)
├── Header (En-tête avec navigation)
├── Menu (Affichage du menu)
├── Panier (Modal du panier)
├── Connexion (Modal de connexion)
├── Inscription (Modal d'inscription)
└── MesCommandes (Liste des commandes)
```

### 5.2 Gestion d'état

**Approche** : Utilisation de **React Hooks** (useState, useEffect)

**État principal dans App.js :**
```javascript
const [panier, setPanier] = useState([]);          // Panier d'achat
const [user, setUser] = useState(null);            // Utilisateur connecté
const [isPanierOpen, setIsPanierOpen] = useState(false);
const [showConnexion, setShowConnexion] = useState(false);
const [activeView, setActiveView] = useState('menu');
```

**Persistance** : Stockage dans `localStorage`
```javascript
localStorage.setItem('user', JSON.stringify(user));
localStorage.setItem('token', token);
```

### 5.3 Composants détaillés

#### 5.3.1 Composant Header

**Fichier : `frontend/src/components/Header.js`**

**Fonctionnalités :**
- Affichage du logo
- Navigation (Menu, Mes Commandes)
- Compteur du panier avec badge
- Bouton de connexion/déconnexion
- Affichage du nom de l'utilisateur connecté

**Props reçues :**
- `panierCount` : Nombre d'items dans le panier
- `onPanierClick` : Fonction pour ouvrir le panier
- `user` : Objet utilisateur ou null
- `onLoginClick` : Fonction pour ouvrir la modal de connexion
- `onLogout` : Fonction pour déconnecter

#### 5.3.2 Composant Menu

**Fichier : `frontend/src/components/Menu.js`**

**Fonctionnalités :**
- Affichage des catégories avec filtrage
- Affichage des plats en grille
- Filtrage par catégorie
- Ajout de plats au panier

**Cycle de vie :**
```javascript
useEffect(() => {
  chargerCategories();
  chargerPlats();
}, []);

useEffect(() => {
  chargerPlats();
}, [selectedCategory]);
```

**Appel API :**
```javascript
const chargerPlats = async () => {
  const response = await fetch(`${API_URL}/menu/plats`);
  const data = await response.json();
  setPlats(data);
};
```

**Affichage :**
- Grille responsive avec CSS Grid
- Cartes de plats avec image, nom, description, prix
- Bouton "Ajouter" pour chaque plat

#### 5.3.3 Composant Panier

**Fichier : `frontend/src/components/Panier.js`**

**Fonctionnalités :**
- Affichage modal (overlay)
- Liste des items avec quantités
- Modification des quantités (+/-)
- Suppression d'items
- Calcul et affichage du total
- Bouton de commande

**Gestion des quantités :**
```javascript
const modifierQuantite = (platId, changement) => {
  setPanier(prevPanier => {
    const item = prevPanier.find(i => i.id === platId);
    if (item.quantite + changement <= 0) {
      return prevPanier.filter(i => i.id !== platId);
    }
    return prevPanier.map(item =>
      item.id === platId
        ? { ...item, quantite: item.quantite + changement }
        : item
    );
  });
};
```

**Calcul du total :**
```javascript
const total = panier.reduce(
  (sum, item) => sum + (parseFloat(item.prix) * item.quantite), 
  0
);
```

**Passage de commande :**
```javascript
const passerCommande = async () => {
  const items = panier.map(item => ({
    plat_id: item.id,
    quantite: item.quantite
  }));
  
  const response = await fetch(`${API_URL}/commandes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ items, client_id: user.id })
  });
};
```

#### 5.3.4 Composant Connexion

**Fichier : `frontend/src/components/Connexion.js`**

**Fonctionnalités :**
- Formulaire de connexion (email, mot de passe)
- Validation côté client
- Appel API `/api/auth/login`
- Gestion d'erreurs
- Lien vers inscription

**Validation :**
```javascript
if (!email || !password) {
  setError('Email et mot de passe requis');
  return;
}
```

**Gestion de la réponse :**
```javascript
if (response.ok) {
  const data = await response.json();
  onLogin(data.client, data.token);
  onClose();
} else {
  const error = await response.json();
  setError(error.error || 'Erreur de connexion');
}
```

#### 5.3.5 Composant Inscription

**Fichier : `frontend/src/components/Inscription.js`**

**Fonctionnalités :**
- Formulaire complet (nom, prénom, email, téléphone, adresse, mot de passe)
- Validation des mots de passe (confirmation, longueur minimale)
- Appel API `/api/auth/register`
- Gestion d'erreurs spécifiques

**Validation :**
```javascript
if (formData.password !== formData.confirmPassword) {
  setError('Les mots de passe ne correspondent pas');
  return;
}

if (formData.password.length < 6) {
  setError('Le mot de passe doit contenir au moins 6 caractères');
  return;
}
```

#### 5.3.6 Composant MesCommandes

**Fichier : `frontend/src/components/MesCommandes.js`**

**Fonctionnalités :**
- Liste des commandes de l'utilisateur
- Affichage du statut avec badges colorés
- Détails de chaque commande (items, total, date)
- Tri par date (plus récentes en premier)

**Appel API :**
```javascript
const response = await fetch(`${API_URL}/commandes/client/${userId}`, {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

**Affichage du statut :**
```javascript
const getStatutLabel = (statut) => {
  const labels = {
    'en_attente': 'En attente',
    'en_preparation': 'En préparation',
    'prete': 'Prête',
    'livree': 'Livrée',
    'annulee': 'Annulée'
  };
  return labels[statut] || statut;
};
```

### 5.4 Design et CSS

**Architecture CSS :**
- Styles globaux dans `App.css`
- Design moderne avec dégradés et ombres
- Responsive design avec CSS Grid et Flexbox
- Animations et transitions

**Couleurs principales :**
- Primaire : `#667eea` (bleu/violet)
- Secondaire : `#764ba2` (violet)
- Succès : Vert
- Erreur : `#ff4444` (rouge)

**Responsive :**
```css
.plats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 2rem;
}
```

---

## 6. Fonctionnalités principales

### 6.1 Consultation du menu

**Description** : Les utilisateurs peuvent parcourir le menu par catégories

**Processus :**
1. Chargement automatique des catégories au démarrage
2. Affichage de tous les plats ou filtrage par catégorie
3. Affichage des informations (nom, description, prix)
4. Possibilité d'ajouter au panier

**Technologies :**
- React useEffect pour le chargement
- Fetch API pour les requêtes HTTP
- CSS Grid pour l'affichage responsive

### 6.2 Gestion du panier

**Description** : Panier d'achat persistant dans la session

**Fonctionnalités :**
- Ajout de plats
- Modification des quantités
- Suppression d'items
- Calcul automatique du total
- Persistance dans l'état React

**Implémentation :**
```javascript
const ajouterAuPanier = (plat) => {
  setPanier(prevPanier => {
    const existe = prevPanier.find(item => item.id === plat.id);
    if (existe) {
      return prevPanier.map(item =>
        item.id === plat.id
          ? { ...item, quantite: item.quantite + 1 }
          : item
      );
    }
    return [...prevPanier, { ...plat, quantite: 1 }];
  });
};
```

### 6.3 Authentification

**Description** : Système d'inscription et de connexion sécurisé

**Processus d'inscription :**
1. Saisie des informations (nom, prénom, email, mot de passe)
2. Validation côté client (mots de passe identiques, longueur)
3. Envoi au backend
4. Vérification de l'unicité de l'email
5. Hachage du mot de passe
6. Création du compte
7. Génération d'un token JWT
8. Connexion automatique

**Processus de connexion :**
1. Saisie de l'email et du mot de passe
2. Vérification dans la base de données
3. Comparaison du mot de passe hashé
4. Génération d'un token JWT
5. Stockage du token et des informations utilisateur

### 6.4 Passage de commande

**Description** : Transformation du panier en commande

**Processus :**
1. Vérification de l'authentification (redirection vers connexion si nécessaire)
2. Validation du panier (non vide)
3. Envoi des items au backend
4. Calcul du total côté serveur
5. Création de la commande et des détails
6. Confirmation et vidage du panier
7. Redirection vers la liste des commandes

**Sécurité :**
- Authentification requise
- Validation des données
- Calcul du total côté serveur (sécurité)

### 6.5 Suivi des commandes

**Description** : Consultation de l'historique et du statut des commandes

**Fonctionnalités :**
- Liste de toutes les commandes de l'utilisateur
- Affichage du statut avec badges colorés
- Détails de chaque commande (items, total, date, adresse)
- Tri par date (plus récentes en premier)

**Statuts possibles :**
- **En attente** : Commande reçue
- **En préparation** : En cours de préparation
- **Prête** : Prête pour livraison
- **Livrée** : Commande livrée
- **Annulée** : Commande annulée

---

## 7. Sécurité

### 7.1 Authentification et autorisation

**JWT (JSON Web Tokens) :**
- Tokens signés avec secret
- Expiration de 7 jours
- Stockage côté client (localStorage)
- Envoi dans l'en-tête Authorization

**Hachage des mots de passe :**
- Bibliothèque : bcryptjs
- Salt rounds : 10
- Stockage : Hash uniquement (jamais en clair)

```javascript
const hashedPassword = await bcrypt.hash(password, 10);
const isValid = await bcrypt.compare(password, storedHash);
```

### 7.2 Protection contre les injections SQL

**Requêtes préparées :**
Toutes les requêtes utilisent des placeholders `?` :

```javascript
await db.query(
  'SELECT * FROM clients WHERE email = ?', 
  [email]
);
```

**Avantages :**
- Échappement automatique des caractères spéciaux
- Protection contre les injections SQL
- Performance améliorée (cache des requêtes)

### 7.3 Validation des données

**Côté client :**
- Validation des formulaires
- Vérification des types
- Messages d'erreur clairs

**Côté serveur :**
- Vérification des champs obligatoires
- Validation des types de données
- Contrôle de l'unicité (email)

### 7.4 CORS (Cross-Origin Resource Sharing)

**Configuration :**
```javascript
app.use(cors());
```

Permet au frontend (port 3000) de communiquer avec le backend (port 5000).

**Pour la production :**
```javascript
app.use(cors({
  origin: 'https://votre-domaine.com',
  credentials: true
}));
```

### 7.5 Variables d'environnement

**Fichier .env :**
- Ne pas commiter dans Git
- Stocke les secrets (JWT_SECRET, mots de passe DB)
- Configuration par environnement

**Fichier .gitignore :**
```
backend/.env
```

---

## 8. Installation et déploiement

### 8.1 Prérequis

- **Node.js** : Version 14 ou supérieure
- **MySQL** : Version 8.0 ou supérieure
- **npm** : Gestionnaire de paquets Node.js

### 8.2 Installation locale

**Étape 1 : Cloner/obtenir le projet**

**Étape 2 : Installer les dépendances**
```bash
npm run install-all
```

**Étape 3 : Configurer la base de données**
```sql
CREATE DATABASE restaurant_db;
```
```bash
mysql -u root -p restaurant_db < backend/database/schema.sql
```

**Étape 4 : Configurer l'environnement**
```bash
cd backend
cp .env.example .env
# Éditer .env avec vos paramètres
```

**Étape 5 : Démarrer l'application**
```bash
npm run dev
```

### 8.3 Configuration de production

**Backend :**
- Utiliser un serveur Node.js (PM2)
- Configurer HTTPS
- Variables d'environnement sécurisées
- Limiter les CORS

**Frontend :**
- Build de production : `npm run build`
- Servir les fichiers statiques (Nginx, Apache)
- Configuration de proxy pour l'API

**Base de données :**
- Sauvegardes régulières
- Utilisateur dédié avec permissions limitées
- Index optimisés

### 8.4 Déploiement

**Options :**
- **Heroku** : Déploiement simple
- **AWS** : Éc2 + RDS
- **DigitalOcean** : Droplets
- **VPS** : Serveur dédié

**Checklist de production :**
- [ ] Variables d'environnement configurées
- [ ] Base de données sécurisée
- [ ] HTTPS activé
- [ ] CORS configuré correctement
- [ ] Logs configurés
- [ ] Monitoring en place
- [ ] Sauvegardes automatiques

---

## 9. Tests et débogage

### 9.1 Test des endpoints API

**Outils recommandés :**
- **Postman** : Tests d'API
- **curl** : Ligne de commande
- **Thunder Client** : Extension VSCode

**Exemple de test avec curl :**
```bash
# Test GET
curl http://localhost:5000/api/menu/plats

# Test POST
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'
```

### 9.2 Débogage frontend

**React DevTools :**
- Extension navigateur
- Inspection des composants
- État et props

**Console du navigateur :**
- Erreurs JavaScript
- Requêtes réseau
- Logs personnalisés

### 9.3 Débogage backend

**Console Node.js :**
```javascript
console.log('Variable:', variable);
console.error('Erreur:', error);
```

**Nodemon :**
- Redémarrage automatique
- Surveillance des fichiers

---

## 10. Améliorations futures

### 10.1 Fonctionnalités à ajouter

- **Interface administrateur** : Gestion du menu et des commandes
- **Paiement en ligne** : Intégration Stripe/PayPal
- **Notifications** : Email/SMS pour les commandes
- **Recherche** : Recherche de plats
- **Avis clients** : Système de notation
- **Promotions** : Codes promo, offres spéciales

### 10.2 Améliorations techniques

- **Tests unitaires** : Jest pour React, Mocha pour Node.js
- **Tests d'intégration** : Tests end-to-end
- **Optimisation** : Cache, compression
- **PWA** : Progressive Web App
- **Mobile** : Application React Native

---

## Conclusion

Cette application démontre une maîtrise complète du développement web full-stack :

✅ **Backend** : API REST avec Node.js/Express
✅ **Frontend** : Interface moderne avec React
✅ **Base de données** : Architecture relationnelle MySQL
✅ **Sécurité** : Authentification JWT, hashage bcrypt
✅ **Architecture** : Client-serveur bien structurée

**Compétences démontrées :**
- Développement backend et frontend
- Gestion de base de données
- Sécurité web
- Architecture logicielle
- API REST

---

**Documentation créée le :** 2025
**Version :** 1.0.0











