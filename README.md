# Livraison Service Food
## Application Web de Restaurant en Ligne - Phase 1
## Application avec plusieurs restaurants

**Projet BTS Génie Informatique**

---

## 📋 Description

Application web complète permettant aux clients de :
- Consulter une liste de restaurants disponibles
- Parcourir le menu d'un restaurant (par catégories)
- Ajouter des plats au panier
- Passer des commandes en ligne
- Suivre l'état de leurs commandes
- S'inscrire et se connecter

---

## 🏗️ Architecture

### Backend
- **Node.js** avec **Express.js**
- API REST pour gérer les requêtes
- **SQLite** comme base de données
- Authentification avec JWT
- Routes pour : restaurants, menu, commandes, authentification, clients

### Frontend
- **React.js** pour l'interface utilisateur
- Design moderne et responsive
- Gestion d'état avec React Hooks
- Pages principales :
  - Page d'accueil avec liste des restaurants
  - Page menu par restaurant avec catégories
  - Page panier d'achat
  - Page de commande

### Base de données
- **SQLite** (fichier local)
- Tables : restaurants, categories, plats, clients, commandes, commande_details

---

## 📦 Installation

### Prérequis
- Node.js (v14 ou supérieur)
- npm ou yarn

### 1. Installation des dépendances

```bash
# Installer toutes les dépendances (racine, backend, frontend)
npm run install-all

# Ou manuellement :
npm install
cd backend && npm install
cd ../frontend && npm install
```

### 2. Initialisation de la base de données

La base de données SQLite sera créée automatiquement au premier démarrage du serveur.

Le schéma SQL avec données d'exemple est dans `backend/database/schema.sql` et sera exécuté automatiquement.

### 3. Configuration

Le fichier `.env` dans le backend contient les variables d'environnement :
```
PORT=5000
JWT_SECRET=votre_secret_jwt_tres_securise_changez_moi
NODE_ENV=development
```

### 4. Démarrer l'application

#### Option 1 : Démarrer tout en même temps
```bash
npm run dev
```

#### Option 2 : Démarrer séparément

Terminal 1 - Backend :
```bash
cd backend
npm run dev
```

Terminal 2 - Frontend :
```bash
cd frontend
npm start
```

---

## 🚀 Utilisation

1. **Backend** : Accessible sur `http://localhost:5000`
2. **Frontend** : Accessible sur `http://localhost:3000`
3. **API** : Les endpoints sont disponibles sous `http://localhost:5000/api`

### Pages principales

1. **Page d'accueil** (`/`) : Liste de tous les restaurants disponibles
2. **Page menu** : Menu d'un restaurant avec catégories de plats
3. **Panier** : Gestion du panier d'achat (modal)
4. **Page de commande** : Finalisation et confirmation de la commande
5. **Mes commandes** : Historique des commandes (si connecté)

---

## 🔌 Endpoints API

### Restaurants
- `GET /api/restaurants` - Obtenir tous les restaurants
- `GET /api/restaurants/:id` - Obtenir un restaurant par ID

### Menu
- `GET /api/menu/restaurant/:restaurantId/plats` - Obtenir tous les plats d'un restaurant
- `GET /api/menu/restaurant/:restaurantId/categories` - Obtenir les catégories d'un restaurant
- `GET /api/menu/categories/:id/plats` - Obtenir les plats d'une catégorie
- `GET /api/menu/plats/:id` - Obtenir un plat par ID

### Authentification
- `POST /api/auth/register` - Inscription
- `POST /api/auth/login` - Connexion

### Commandes
- `POST /api/commandes` - Créer une commande
- `GET /api/commandes/client/:clientId` - Obtenir les commandes d'un client
- `GET /api/commandes/:id` - Obtenir une commande par ID
- `PATCH /api/commandes/:id/statut` - Mettre à jour le statut

### Clients
- `GET /api/clients/:id` - Obtenir un client
- `PUT /api/clients/:id` - Mettre à jour un client

---

## 📁 Structure du projet

```
Restaurant final/
├── backend/
│   ├── config/
│   │   └── database.js          # Configuration SQLite
│   ├── database/
│   │   ├── schema.sql           # Schéma de base de données
│   │   ├── init.js              # Script d'initialisation
│   │   └── restaurant.db        # Base SQLite (créée automatiquement)
│   ├── routes/
│   │   ├── restaurants.js       # Routes pour les restaurants
│   │   ├── menu.js              # Routes pour le menu
│   │   ├── commandes.js         # Routes pour les commandes
│   │   ├── auth.js              # Routes d'authentification
│   │   └── clients.js           # Routes pour les clients
│   ├── server.js                # Point d'entrée du serveur
│   ├── package.json
│   └── .env                     # Variables d'environnement
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Accueil.js       # Page d'accueil avec restaurants
│   │   │   ├── Header.js        # En-tête de l'application
│   │   │   ├── Menu.js          # Page menu du restaurant
│   │   │   ├── Panier.js        # Composant panier
│   │   │   ├── Commande.js      # Page de commande
│   │   │   ├── Connexion.js     # Formulaire de connexion
│   │   │   ├── Inscription.js   # Formulaire d'inscription
│   │   │   └── MesCommandes.js  # Liste des commandes
│   │   ├── App.js               # Composant principal
│   │   ├── App.css              # Styles principaux
│   │   └── index.js             # Point d'entrée React
│   └── package.json
├── package.json                 # Scripts globaux
└── README.md                    # Ce fichier
```

---

## 🎯 Fonctionnalités

### Phase 1 - Réalisé ✅

- ✅ Page d'accueil avec liste des restaurants
- ✅ Page menu par restaurant avec catégories
- ✅ Page panier d'achat (modal)
- ✅ Page de commande
- ✅ Gestion multi-restaurants
- ✅ Authentification et inscription
- ✅ Suivi des commandes

---

## 🗄️ Base de données

### Tables principales

- **restaurants** : Informations des restaurants
- **categories** : Catégories de plats (par restaurant)
- **plats** : Plats du menu (par restaurant)
- **clients** : Comptes clients
- **commandes** : Commandes passées
- **commande_details** : Détails des commandes

### Données d'exemple

Le schéma inclut le restaurant principal :
- **Livraison Service Fastfood** - Service de livraison rapide
  - Localisation: Quartier Louis, Libreville, Gabon
  - Téléphone: 062998295
  - Menu avec plats traditionnels gabonais et fastfood

---

## 🔒 Sécurité

- Mots de passe hashés avec bcrypt
- Tokens JWT pour l'authentification
- Validation des entrées utilisateur
- Protection contre les injections SQL (requêtes préparées)

---

## 📚 Technologies utilisées

- **Backend** : Node.js, Express.js, SQLite (better-sqlite3)
- **Frontend** : React.js, CSS3
- **Base de données** : SQLite
- **Authentification** : JWT, bcryptjs
- **Outils** : npm, nodemon

---

## 🛠️ Commandes utiles

```bash
# Démarrer le backend
cd backend && npm run dev

# Démarrer le frontend
cd frontend && npm start

# Démarrer les deux
npm run dev

# Réinitialiser la base de données
# Supprimer backend/database/restaurant.db et redémarrer le serveur
```

---

## 📝 Notes

- La base de données SQLite est créée automatiquement au démarrage
- Le fichier `restaurant.db` est dans `backend/database/`
- Pour réinitialiser : supprimer le fichier `.db` et redémarrer

---

**Bonne chance pour votre projet ! 🎓**
