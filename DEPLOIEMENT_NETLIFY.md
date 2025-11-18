# Guide de Déploiement sur Netlify

## 📋 Vue d'ensemble

Votre projet a deux parties :
- **Frontend React** → Déployable sur **Netlify** ✅
- **Backend Express/Node.js** → Nécessite un autre hébergeur (Railway, Render, Heroku)

## 🎯 Option 1 : Netlify pour le Frontend (Recommandé)

### Étape 1 : Préparer le Frontend

#### 1.1 Créer un fichier de configuration Netlify

Créez `netlify.toml` à la racine du projet :

```toml
[build]
  base = "frontend"
  publish = "frontend/build"
  command = "npm run build"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

#### 1.2 Créer un fichier `.env.production` dans `frontend/`

Créez `frontend/.env.production` avec l'URL de votre backend en production :

```env
REACT_APP_API_URL=https://votre-backend.railway.app/api
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_live_votre_cle_stripe
```

#### 1.3 Modifier les fichiers pour utiliser la variable d'environnement

Vous devrez remplacer tous les `const API_URL = 'http://localhost:5000/api'` par :
```javascript
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
```

### Étape 2 : Déployer le Backend (Railway - Gratuit)

1. **Créer un compte sur Railway** : https://railway.app
2. **Connecter votre repository GitHub**
3. **Créer un nouveau projet** → "Deploy from GitHub repo"
4. **Sélectionner le dossier `backend/`**
5. **Configurer les variables d'environnement** :
   ```
   NODE_ENV=production
   PORT=5000
   JWT_SECRET=votre_secret_jwt
   STRIPE_SECRET_KEY=sk_live_votre_cle_stripe
   ```
6. **Railway génère automatiquement une URL** (ex: `https://votre-app.railway.app`)

### Étape 3 : Déployer le Frontend sur Netlify

#### Méthode 1 : Via l'interface Netlify (Recommandé)

1. **Créer un compte** : https://app.netlify.com
2. **Cliquer sur "Add new site" → "Import an existing project"**
3. **Connecter votre repository GitHub**
4. **Configurer le build** :
   - **Base directory** : `frontend`
   - **Build command** : `npm install && npm run build`
   - **Publish directory** : `frontend/build`
5. **Ajouter les variables d'environnement** :
   - `REACT_APP_API_URL` = URL de votre backend Railway
   - `REACT_APP_STRIPE_PUBLISHABLE_KEY` = Votre clé publique Stripe
6. **Cliquer sur "Deploy site"**

#### Méthode 2 : Via Netlify CLI

```bash
# Installer Netlify CLI
npm install -g netlify-cli

# Se connecter
netlify login

# Dans le dossier frontend
cd frontend
npm run build

# Déployer
netlify deploy --prod
```

### Étape 4 : Configurer CORS sur le Backend

Dans `backend/server.js`, assurez-vous que CORS autorise votre domaine Netlify :

```javascript
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://votre-site.netlify.app',
    'https://votre-domaine-personnalise.com'
  ],
  credentials: true
}));
```

## 🔧 Modifications nécessaires dans le code

### 1. Créer un fichier de configuration API

Créez `frontend/src/config/api.js` :

```javascript
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
export default API_URL;
```

### 2. Remplacer les API_URL dans tous les fichiers

Remplacez dans tous les fichiers :
- `App.js`
- `Paiement.js`
- `Accueil.js`
- `Connexion.js`
- `Inscription.js`
- `AdminMenu.js`
- `DashboardAdmin.js`
- `MesCommandes.js`
- `Commande.js`
- `DashboardLivreur.js`
- `NotificationSystem.js`
- `Avis.js`
- `StatistiquesVentes.js`

**Ancien code** :
```javascript
const API_URL = 'http://localhost:5000/api';
```

**Nouveau code** :
```javascript
import API_URL from '../config/api';
// ou
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
```

## 📦 Alternative : Déployer le Backend sur Render

### Render (Alternative à Railway)

1. **Créer un compte** : https://render.com
2. **Nouveau → Web Service**
3. **Connecter votre repo GitHub**
4. **Configurer** :
   - **Name** : restaurant-backend
   - **Environment** : Node
   - **Build Command** : `cd backend && npm install`
   - **Start Command** : `cd backend && npm start`
   - **Root Directory** : `backend`
5. **Variables d'environnement** : Ajoutez les mêmes que Railway
6. **Render génère une URL** : `https://restaurant-backend.onrender.com`

## 🚀 Checklist de déploiement

### Backend
- [ ] Déployer sur Railway ou Render
- [ ] Configurer toutes les variables d'environnement
- [ ] Tester l'API avec Postman/Thunder Client
- [ ] Vérifier que CORS autorise votre domaine Netlify
- [ ] Tester la connexion à la base de données

### Frontend
- [ ] Créer le fichier `netlify.toml`
- [ ] Créer `frontend/.env.production`
- [ ] Remplacer tous les `API_URL` codés en dur
- [ ] Tester le build localement : `npm run build`
- [ ] Déployer sur Netlify
- [ ] Configurer les variables d'environnement sur Netlify
- [ ] Tester le site déployé

## 🔒 Sécurité

1. **Ne jamais commiter les fichiers `.env`**
2. **Utiliser des clés Stripe en production** (pas de test)
3. **Configurer HTTPS** (automatique sur Netlify et Railway)
4. **Limiter les origines CORS** aux domaines autorisés

## 🌐 Domaine personnalisé (Optionnel)

### Sur Netlify
1. **Site settings** → **Domain management**
2. **Add custom domain**
3. **Suivre les instructions DNS**

### Sur Railway
1. **Settings** → **Networking**
2. **Custom Domain**
3. **Configurer les enregistrements DNS**

## 📊 Monitoring

- **Netlify Analytics** : Statistiques de visite
- **Railway Metrics** : Performance du backend
- **Sentry** : Gestion des erreurs (optionnel)

## 🆘 Dépannage

### Erreur CORS
- Vérifier que l'URL du backend est correcte dans CORS
- Vérifier que les credentials sont autorisés

### Erreur 404 sur les routes React
- Vérifier la configuration des redirects dans `netlify.toml`

### Variables d'environnement non chargées
- Vérifier le préfixe `REACT_APP_` pour React
- Redéployer après modification des variables

### Base de données SQLite
- SQLite ne fonctionne pas bien en production
- Considérez PostgreSQL (Railway propose PostgreSQL gratuitement)

## 💰 Coûts

- **Netlify** : Gratuit jusqu'à 100 GB de bande passante/mois
- **Railway** : Gratuit avec $5 de crédit/mois
- **Render** : Gratuit avec limitations (s'endort après 15 min d'inactivité)

## 📝 Notes importantes

1. **SQLite en production** : SQLite n'est pas recommandé pour la production. Considérez PostgreSQL.
2. **Base de données persistante** : Sur Railway, vous pouvez ajouter PostgreSQL facilement.
3. **Uploads de fichiers** : Les fichiers uploadés doivent être stockés sur un service cloud (Cloudinary, AWS S3) car les serveurs sont éphémères.

