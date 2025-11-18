# Documentation Technique Détaillée
## Analyse technique des réalisations importantes

**Projet BTS Génie Informatique - Restaurant en ligne**

---

## 📋 Table des matières

1. [Architecture technique détaillée](#architecture-technique-détaillée)
2. [Analyse des algorithmes](#analyse-des-algorithmes)
3. [Flux de données](#flux-de-données)
4. [Gestion des erreurs](#gestion-des-erreurs)
5. [Performance et optimisation](#performance-et-optimisation)
6. [Sécurité approfondie](#sécurité-approfondie)

---

## Architecture technique détaillée

### 1.1 Pattern MVC dans le backend

Le backend suit une architecture **Model-View-Controller** simplifiée :

**Model (Modèle) :**
- Représenté par la base de données MySQL
- Tables normalisées avec relations
- Pas de couche ORM (Object-Relational Mapping) pour plus de contrôle

**View (Vue) :**
- Format JSON pour les réponses API
- Structure standardisée pour toutes les réponses

**Controller (Contrôleur) :**
- Fichiers dans `routes/` : `menu.js`, `commandes.js`, `auth.js`, `clients.js`
- Chaque route gère la logique métier
- Interaction directe avec la base de données

**Exemple de structure MVC :**

```javascript
// Controller (routes/menu.js)
router.get('/plats', async (req, res) => {
  try {
    // Accès au Model (base de données)
    const [plats] = await db.query('SELECT * FROM plats');
    
    // View (réponse JSON)
    res.json(plats);
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});
```

### 1.2 Architecture des composants React

**Pattern : Composants fonctionnels avec Hooks**

Chaque composant suit le pattern suivant :

```javascript
// 1. Import des dépendances
import React, { useState, useEffect } from 'react';

// 2. Définition du composant
function NomComposant({ props }) {
  // 3. État local
  const [state, setState] = useState(initialValue);
  
  // 4. Effets de bord
  useEffect(() => {
    // Logique d'initialisation
  }, [dependencies]);
  
  // 5. Gestionnaires d'événements
  const handleEvent = () => {
    // Logique
  };
  
  // 6. Rendu
  return (
    <div>
      {/* JSX */}
    </div>
  );
}

export default NomComposant;
```

**Hiérarchie des composants :**

```
App (État global)
  ├── Header (Stateless - reçoit props)
  ├── Menu (Stateful - charge les données)
  ├── Panier (Stateless - affiche props)
  ├── Connexion (Stateful - formulaire)
  ├── Inscription (Stateful - formulaire)
  └── MesCommandes (Stateful - charge les données)
```

### 1.3 Communication client-serveur

**Protocole HTTP/HTTPS :**

```
Client (React)                    Serveur (Node.js)
    │                                  │
    │  GET /api/menu/plats             │
    │─────────────────────────────────>│
    │                                  │ Requête SQL
    │                                  │─────────────> MySQL
    │                                  │<─────────────
    │  JSON Response                   │
    │<─────────────────────────────────│
    │                                  │
```

**Format des requêtes :**

**GET (Lecture) :**
```http
GET /api/menu/plats HTTP/1.1
Host: localhost:5000
```

**POST (Création) :**
```http
POST /api/commandes HTTP/1.1
Host: localhost:5000
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...

{
  "items": [
    {"plat_id": 1, "quantite": 2}
  ],
  "client_id": 1
}
```

**Format des réponses :**

**Succès (200 OK) :**
```json
{
  "id": 1,
  "nom": "Salade César",
  "prix": "12.50"
}
```

**Erreur (400 Bad Request) :**
```json
{
  "error": "La commande doit contenir au moins un plat"
}
```

---

## Analyse des algorithmes

### 2.1 Calcul du total d'une commande

**Complexité : O(n)** où n = nombre d'items

```javascript
// Algorithme côté backend
router.post('/commandes', async (req, res) => {
  const { items } = req.body;
  let total = 0;
  
  // Boucle linéaire : O(n)
  for (const item of items) {
    // Requête SQL : O(1) avec index
    const [plats] = await db.query(
      'SELECT prix FROM plats WHERE id = ?', 
      [item.plat_id]
    );
    
    const prix = parseFloat(plats[0].prix);
    const quantite = parseInt(item.quantite) || 1;
    total += prix * quantite;  // Opération arithmétique : O(1)
  }
  
  // Total : O(n) avec n = nombre d'items
});
```

**Optimisation possible :**
```javascript
// Version optimisée : une seule requête SQL
const platIds = items.map(item => item.plat_id);
const [plats] = await db.query(
  'SELECT id, prix FROM plats WHERE id IN (?)',
  [platIds]
);

const prixMap = new Map(plats.map(p => [p.id, p.prix]));
let total = 0;
for (const item of items) {
  total += parseFloat(prixMap.get(item.plat_id)) * item.quantite;
}
```

**Complexité optimisée : O(1) pour les requêtes + O(n) pour le calcul**

### 2.2 Gestion du panier (Frontend)

**Structure de données : Tableau d'objets**

```javascript
const panier = [
  { id: 1, nom: "Salade", prix: 12.50, quantite: 2 },
  { id: 3, nom: "Burger", prix: 15.90, quantite: 1 }
];
```

**Ajout d'un plat :**
```javascript
const ajouterAuPanier = (plat) => {
  setPanier(prevPanier => {
    // Recherche : O(n)
    const existe = prevPanier.find(item => item.id === plat.id);
    
    if (existe) {
      // Mise à jour : O(n)
      return prevPanier.map(item =>
        item.id === plat.id
          ? { ...item, quantite: item.quantite + 1 }
          : item
      );
    }
    // Ajout : O(1)
    return [...prevPanier, { ...plat, quantite: 1 }];
  });
};
```

**Complexité globale : O(n)** où n = nombre d'items dans le panier

**Optimisation possible avec Map :**
```javascript
const [panierMap, setPanierMap] = useState(new Map());

const ajouterAuPanier = (plat) => {
  setPanierMap(prev => {
    const newMap = new Map(prev);
    const existing = newMap.get(plat.id);
    newMap.set(plat.id, {
      ...plat,
      quantite: existing ? existing.quantite + 1 : 1
    });
    return newMap;
  });
};
// Complexité : O(1) avec Map
```

### 2.3 Hachage de mot de passe (bcrypt)

**Algorithme : bcrypt avec salt rounds = 10**

```javascript
const bcrypt = require('bcryptjs');

// Hachage
const hashedPassword = await bcrypt.hash(password, 10);
// Complexité : O(2^10) = O(1024) opérations
// Temps : ~100ms pour un mot de passe

// Vérification
const isValid = await bcrypt.compare(password, hashedPassword);
// Complexité : O(2^10)
```

**Sécurité :**
- Salt automatique (unique par hash)
- 10 rounds = 1024 itérations
- Protection contre les attaques par force brute
- Temps constant pour la vérification (protection timing attack)

### 2.4 Génération de token JWT

**Structure d'un JWT :**

```
Header.Payload.Signature

Header (base64) :
{
  "alg": "HS256",
  "typ": "JWT"
}

Payload (base64) :
{
  "id": 1,
  "email": "user@example.com",
  "iat": 1234567890,
  "exp": 1235173890
}

Signature :
HMACSHA256(
  base64UrlEncode(header) + "." + base64UrlEncode(payload),
  secret
)
```

**Implémentation :**
```javascript
const jwt = require('jsonwebtoken');

// Génération
const token = jwt.sign(
  { id: userId, email: userEmail },
  process.env.JWT_SECRET,
  { expiresIn: '7d' }
);
// Complexité : O(1) - opération de hachage

// Vérification
const decoded = jwt.verify(token, process.env.JWT_SECRET);
// Complexité : O(1) - vérification de signature
```

---

## Flux de données

### 3.1 Flux de création d'une commande

```
┌─────────┐
│ Utilisateur clique sur "Passer la commande"
└────┬────┘
     │
     ▼
┌─────────────────────────────────────────┐
│ Frontend : passerCommande()             │
│ - Vérification panier non vide          │
│ - Vérification utilisateur connecté     │
│ - Préparation des données               │
└────┬────────────────────────────────────┘
     │
     │ POST /api/commandes
     │ { items, client_id, ... }
     ▼
┌─────────────────────────────────────────┐
│ Backend : routes/commandes.js           │
│ - Validation des données                │
│ - Calcul du total                       │
│ - Création de la commande               │
│ - Création des détails                  │
└────┬────────────────────────────────────┘
     │
     │ INSERT INTO commandes
     │ INSERT INTO commande_details
     ▼
┌─────────────────────────────────────────┐
│ Base de données MySQL                   │
│ - Enregistrement de la commande         │
│ - Enregistrement des détails            │
│ - Retour de l'ID de commande            │
└────┬────────────────────────────────────┘
     │
     │ { message, commande: { id, ... } }
     ▼
┌─────────────────────────────────────────┐
│ Backend : Réponse JSON                  │
└────┬────────────────────────────────────┘
     │
     │ Response JSON
     ▼
┌─────────────────────────────────────────┐
│ Frontend : Traitement de la réponse     │
│ - Affichage du message de succès        │
│ - Vidage du panier                      │
│ - Redirection vers Mes Commandes        │
└─────────────────────────────────────────┘
```

### 3.2 Flux d'authentification

```
┌─────────┐
│ Utilisateur saisit email/mot de passe
└────┬────┘
     │
     ▼
┌─────────────────────────────────────────┐
│ Frontend : handleSubmit()               │
│ - Validation des champs                 │
│ - Préparation des données               │
└────┬────────────────────────────────────┘
     │
     │ POST /api/auth/login
     │ { email, password }
     ▼
┌─────────────────────────────────────────┐
│ Backend : routes/auth.js                │
│ - Recherche du client par email         │
└────┬────────────────────────────────────┘
     │
     │ SELECT * FROM clients WHERE email = ?
     ▼
┌─────────────────────────────────────────┐
│ Base de données MySQL                   │
│ - Retour des données client             │
│ - Inclut le hash du mot de passe        │
└────┬────────────────────────────────────┘
     │
     │ { id, email, password_hash, ... }
     ▼
┌─────────────────────────────────────────┐
│ Backend : Vérification                  │
│ - Comparaison bcrypt.compare()          │
│ - Génération du token JWT               │
└────┬────────────────────────────────────┘
     │
     │ { token, client: { id, nom, ... } }
     ▼
┌─────────────────────────────────────────┐
│ Frontend : Stockage                     │
│ - localStorage.setItem('token', token)  │
│ - localStorage.setItem('user', user)    │
│ - Mise à jour de l'état React           │
│ - Fermeture de la modal                 │
└─────────────────────────────────────────┘
```

### 3.3 Flux de chargement du menu

```
┌─────────────────────────────────────────┐
│ Composant Menu monte (componentDidMount)
└────┬────────────────────────────────────┘
     │
     │ useEffect(() => { ... }, [])
     ▼
┌─────────────────────────────────────────┐
│ Frontend : chargerCategories()          │
│ GET /api/menu/categories                │
└────┬────────────────────────────────────┘
     │
     │
     ▼
┌─────────────────────────────────────────┐
│ Frontend : chargerPlats()               │
│ GET /api/menu/plats                     │
└────┬────────────────────────────────────┘
     │
     │ Requête HTTP
     ▼
┌─────────────────────────────────────────┐
│ Backend : routes/menu.js                │
│ GET /api/menu/plats                     │
└────┬────────────────────────────────────┘
     │
     │ SELECT avec JOIN
     ▼
┌─────────────────────────────────────────┐
│ Base de données MySQL                   │
│ SELECT p.*, c.nom as categorie_nom ...  │
└────┬────────────────────────────────────┘
     │
     │ Résultats SQL
     ▼
┌─────────────────────────────────────────┐
│ Backend : Formatage JSON                │
│ res.json(plats)                         │
└────┬────────────────────────────────────┘
     │
     │ Response JSON
     ▼
┌─────────────────────────────────────────┐
│ Frontend : Mise à jour de l'état        │
│ setPlats(data)                          │
│ setLoading(false)                       │
└────┬────────────────────────────────────┘
     │
     │ Re-render
     ▼
┌─────────────────────────────────────────┐
│ Affichage des plats dans l'interface    │
│ {plats.map(plat => <PlatCard ... />)}   │
└─────────────────────────────────────────┘
```

---

## Gestion des erreurs

### 4.1 Backend - Stratégie de gestion d'erreurs

**Pattern try/catch avec codes HTTP appropriés :**

```javascript
router.get('/plats/:id', async (req, res) => {
  try {
    const [plats] = await db.query(
      'SELECT * FROM plats WHERE id = ?', 
      [req.params.id]
    );
    
    if (plats.length === 0) {
      // Erreur client : ressource non trouvée
      return res.status(404).json({ error: 'Plat non trouvé' });
    }
    
    // Succès
    res.json(plats[0]);
    
  } catch (error) {
    // Erreur serveur
    console.error('Erreur lors de la récupération du plat:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});
```

**Codes HTTP utilisés :**

| Code | Signification | Utilisation |
|------|---------------|-------------|
| 200 | OK | Succès, données retournées |
| 201 | Created | Ressource créée avec succès |
| 400 | Bad Request | Données invalides |
| 401 | Unauthorized | Authentification requise/échouée |
| 404 | Not Found | Ressource non trouvée |
| 500 | Internal Server Error | Erreur serveur |

### 4.2 Frontend - Gestion des erreurs utilisateur

**Gestion dans les composants :**

```javascript
const [error, setError] = useState('');

const handleSubmit = async (e) => {
  e.preventDefault();
  setError('');
  setLoading(true);

  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (response.ok) {
      // Succès
      onLogin(data.client, data.token);
    } else {
      // Erreur retournée par le serveur
      setError(data.error || 'Erreur de connexion');
    }
  } catch (error) {
    // Erreur réseau ou autre
    console.error('Erreur:', error);
    setError('Erreur de connexion au serveur');
  } finally {
    setLoading(false);
  }
};
```

**Affichage des erreurs :**

```jsx
{error && (
  <div className="error-message">
    {error}
  </div>
)}
```

### 4.3 Validation des données

**Validation côté client :**

```javascript
// Avant l'envoi
if (!email || !password) {
  setError('Email et mot de passe requis');
  return;
}

if (password.length < 6) {
  setError('Le mot de passe doit contenir au moins 6 caractères');
  return;
}
```

**Validation côté serveur :**

```javascript
const { nom, prenom, email, password } = req.body;

if (!nom || !prenom || !email || !password) {
  return res.status(400).json({ error: 'Tous les champs sont requis' });
}

// Vérification de l'unicité
const [existing] = await db.query(
  'SELECT id FROM clients WHERE email = ?', 
  [email]
);
if (existing.length > 0) {
  return res.status(400).json({ error: 'Cet email est déjà utilisé' });
}
```

---

## Performance et optimisation

### 5.1 Optimisations backend

**Requêtes préparées :**
- Cache des plans d'exécution MySQL
- Protection contre les injections SQL
- Meilleure performance pour requêtes répétées

```javascript
// Préparé une fois, exécuté plusieurs fois
const [result] = await db.query(
  'SELECT * FROM plats WHERE categorie_id = ?',
  [categorieId]
);
```

**Index de base de données :**

```sql
-- Index sur les clés étrangères (améliore les JOIN)
CREATE INDEX idx_plats_categorie ON plats(categorie_id);
CREATE INDEX idx_commande_client ON commandes(client_id);

-- Index sur les recherches fréquentes
CREATE INDEX idx_clients_email ON clients(email);
```

**Limitation des résultats :**

```javascript
// Pour éviter de charger trop de données
const [plats] = await db.query(
  'SELECT * FROM plats WHERE disponible = 1 LIMIT 50'
);
```

### 5.2 Optimisations frontend

**Lazy loading des composants :**

```javascript
// Chargement à la demande
const MesCommandes = React.lazy(() => import('./components/MesCommandes'));

<Suspense fallback={<div>Chargement...</div>}>
  <MesCommandes />
</Suspense>
```

**Mémorisation des calculs :**

```javascript
// Utiliser useMemo pour éviter les recalculs
const total = useMemo(() => {
  return panier.reduce(
    (sum, item) => sum + (parseFloat(item.prix) * item.quantite), 
    0
  );
}, [panier]);
```

**Débouncing des recherches :**

```javascript
// Éviter trop de requêtes API
const [searchTerm, setSearchTerm] = useState('');
const debouncedSearch = useMemo(
  () => debounce((term) => {
    chargerPlats(term);
  }, 300),
  []
);
```

### 5.3 Optimisations réseau

**Compression HTTP :**
```javascript
const compression = require('compression');
app.use(compression());
```

**Cache des réponses statiques :**
```javascript
app.use(express.static('public', {
  maxAge: '1d' // Cache pendant 1 jour
}));
```

**Pagination pour les grandes listes :**
```javascript
// Au lieu de charger tous les plats
router.get('/plats', async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const offset = (page - 1) * limit;
  
  const [plats] = await db.query(
    'SELECT * FROM plats LIMIT ? OFFSET ?',
    [limit, offset]
  );
  
  res.json(plats);
});
```

---

## Sécurité approfondie

### 6.1 Protection contre les attaques courantes

**1. Injection SQL :**
✅ **Protection** : Requêtes préparées avec placeholders
```javascript
// ✅ Sécurisé
await db.query('SELECT * FROM clients WHERE email = ?', [email]);

// ❌ Vulnérable
await db.query(`SELECT * FROM clients WHERE email = '${email}'`);
```

**2. Cross-Site Scripting (XSS) :**
✅ **Protection** : React échappe automatiquement les valeurs
```jsx
// ✅ Sécurisé (React échappe automatiquement)
<div>{userInput}</div>

// ⚠️ Attention si vous utilisez dangerouslySetInnerHTML
```

**3. Cross-Site Request Forgery (CSRF) :**
⚠️ **À implémenter** : Tokens CSRF pour les formulaires sensibles

**4. Brute Force :**
⚠️ **À implémenter** : Limitation du nombre de tentatives de connexion
```javascript
// Exemple d'implémentation
const attempts = await redis.get(`login:attempts:${email}`);
if (attempts > 5) {
  return res.status(429).json({ error: 'Trop de tentatives' });
}
```

### 6.2 Sécurisation des mots de passe

**Hachage bcrypt :**
- Salt automatique (unique par mot de passe)
- 10 rounds (1024 itérations)
- Temps de hachage ~100ms (ralentit les attaques)

```javascript
const bcrypt = require('bcryptjs');
const saltRounds = 10;

// Hachage
const hash = await bcrypt.hash(password, saltRounds);
// Résultat : $2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy

// Vérification
const isValid = await bcrypt.compare(password, hash);
```

### 6.3 Tokens JWT

**Structure sécurisée :**
```javascript
const token = jwt.sign(
  {
    id: user.id,
    email: user.email
    // Ne JAMAIS inclure le mot de passe
  },
  process.env.JWT_SECRET, // Secret fort et unique
  {
    expiresIn: '7d', // Expiration
    issuer: 'restaurant-app' // Optionnel : émetteur
  }
);
```

**Vérification :**
```javascript
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token manquant' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Token invalide' });
    }
    req.user = user;
    next();
  });
};
```

### 6.4 Variables d'environnement

**Fichier .env (NE JAMAIS COMMITER) :**
```
DB_PASSWORD=mon_mot_de_passe_secret
JWT_SECRET=une_cle_secrete_tres_longue_et_aleatoire_minimum_32_caracteres
```

**Génération d'un secret JWT fort :**
```javascript
const crypto = require('crypto');
const secret = crypto.randomBytes(64).toString('hex');
console.log(secret);
```

---

## Métriques et monitoring

### 7.1 Métriques à surveiller

**Backend :**
- Temps de réponse des endpoints
- Taux d'erreur (4xx, 5xx)
- Utilisation CPU/RAM
- Connexions base de données

**Base de données :**
- Temps d'exécution des requêtes
- Nombre de connexions actives
- Taille de la base de données

**Frontend :**
- Temps de chargement des pages
- Taux d'erreur JavaScript
- Requêtes réseau échouées

### 7.2 Logging

**Backend :**
```javascript
// Logs structurés
console.log('Commande créée:', {
  commandeId: commande.id,
  clientId: commande.client_id,
  total: commande.total,
  timestamp: new Date().toISOString()
});
```

**Bibliothèque recommandée :**
- Winston (logging structuré)
- Morgan (logs HTTP)

---

## Conclusion technique

Cette application démontre :

✅ **Architecture solide** : Client-serveur, MVC
✅ **Algorithmes optimisés** : Complexité maîtrisée
✅ **Sécurité** : Protection contre les vulnérabilités courantes
✅ **Gestion d'erreurs** : Codes HTTP appropriés, messages clairs
✅ **Performance** : Requêtes optimisées, index base de données

**Points forts techniques :**
- API REST bien structurée
- React avec hooks modernes
- Base de données normalisée
- Authentification sécurisée
- Code modulaire et maintenable

---

**Version :** 1.0.0  
**Date :** 2025











