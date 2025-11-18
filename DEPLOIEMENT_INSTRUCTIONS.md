# 🚀 Instructions de Déploiement - Restaurant App

## ✅ Prérequis

- ✅ Compte Netlify créé et connecté à GitHub
- ✅ Compte Railway créé et connecté à GitHub
- ✅ Repository GitHub avec votre code

## 📋 Étapes de Déploiement

### Étape 1 : Déployer le Backend sur Railway

1. **Aller sur Railway** : https://railway.app
2. **Créer un nouveau projet** :
   - Cliquez sur "New Project"
   - Sélectionnez "Deploy from GitHub repo"
   - Choisissez votre repository
3. **Configurer le service** :
   - Railway détectera automatiquement le dossier `backend/`
   - Si ce n'est pas le cas, dans "Settings" → "Root Directory" : mettez `backend`
4. **Configurer les variables d'environnement** :
   - Allez dans "Variables"
   - Ajoutez les variables suivantes :

```
NODE_ENV=production
PORT=5000
JWT_SECRET=votre_secret_jwt_tres_securise_et_long
STRIPE_SECRET_KEY=sk_live_votre_cle_secrete_stripe
FRONTEND_URL=https://votre-site.netlify.app
NETLIFY_URL=https://votre-site.netlify.app
```

5. **Obtenir l'URL de votre backend** :
   - Une fois déployé, Railway génère une URL (ex: `https://restaurant-backend-production.up.railway.app`)
   - Copiez cette URL, vous en aurez besoin pour le frontend

### Étape 2 : Déployer le Frontend sur Netlify

1. **Aller sur Netlify** : https://app.netlify.com
2. **Créer un nouveau site** :
   - Cliquez sur "Add new site" → "Import an existing project"
   - Connectez votre repository GitHub
3. **Configurer le build** :
   - Netlify détectera automatiquement le fichier `netlify.toml`
   - Si ce n'est pas le cas, configurez manuellement :
     - **Base directory** : `frontend`
     - **Build command** : `npm install && npm run build`
     - **Publish directory** : `frontend/build`
4. **Configurer les variables d'environnement** :
   - Allez dans "Site settings" → "Environment variables"
   - Ajoutez les variables suivantes :

```
REACT_APP_API_URL=https://votre-backend.railway.app/api
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_live_votre_cle_publique_stripe
```

⚠️ **Important** : Remplacez `https://votre-backend.railway.app` par l'URL réelle de votre backend Railway !

5. **Déployer** :
   - Cliquez sur "Deploy site"
   - Attendez la fin du build
   - Votre site sera disponible à une URL comme `https://random-name-123.netlify.app`

### Étape 3 : Mettre à jour CORS sur Railway

Une fois que vous avez l'URL Netlify de votre frontend :

1. **Retourner sur Railway**
2. **Mettre à jour les variables d'environnement** :
   - `FRONTEND_URL` = URL complète de votre site Netlify
   - `NETLIFY_URL` = URL complète de votre site Netlify
3. **Redéployer** le backend (Railway redéploie automatiquement)

### Étape 4 : Vérifier le Déploiement

1. **Tester le backend** :
   - Ouvrez `https://votre-backend.railway.app/api` dans votre navigateur
   - Vous devriez voir : `{"message":"API Livraison Service Fastfood - Backend fonctionnel"}`

2. **Tester le frontend** :
   - Ouvrez votre site Netlify
   - Vérifiez que les requêtes API fonctionnent (ouvrez la console du navigateur)

## 🔧 Configuration de la Base de Données

⚠️ **Important** : SQLite n'est pas adapté pour la production sur Railway car les fichiers sont éphémères.

### Option 1 : Utiliser PostgreSQL (Recommandé)

1. **Sur Railway** :
   - Cliquez sur "New" → "Database" → "PostgreSQL"
   - Railway créera automatiquement une base de données
   - Les variables d'environnement seront automatiquement ajoutées :
     - `PGHOST`
     - `PGPORT`
     - `PGUSER`
     - `PGPASSWORD`
     - `PGDATABASE`

2. **Modifier le code backend** :
   - Vous devrez adapter `backend/config/database.js` pour utiliser PostgreSQL au lieu de SQLite
   - Utilisez `pg` (node-postgres) au lieu de `sqlite3`

### Option 2 : Garder SQLite (Temporaire)

- SQLite fonctionnera mais les données seront perdues à chaque redéploiement
- Utilisez uniquement pour tester

## 📝 Checklist de Déploiement

### Backend (Railway)
- [ ] Projet créé sur Railway
- [ ] Repository GitHub connecté
- [ ] Root directory configuré : `backend`
- [ ] Variables d'environnement configurées :
  - [ ] `NODE_ENV=production`
  - [ ] `JWT_SECRET` (secret long et sécurisé)
  - [ ] `STRIPE_SECRET_KEY` (clé Stripe en production)
  - [ ] `FRONTEND_URL` (URL Netlify)
  - [ ] `NETLIFY_URL` (URL Netlify)
- [ ] Backend déployé et accessible
- [ ] URL du backend copiée

### Frontend (Netlify)
- [ ] Site créé sur Netlify
- [ ] Repository GitHub connecté
- [ ] Fichier `netlify.toml` détecté
- [ ] Variables d'environnement configurées :
  - [ ] `REACT_APP_API_URL` (URL du backend Railway + `/api`)
  - [ ] `REACT_APP_STRIPE_PUBLISHABLE_KEY` (clé publique Stripe)
- [ ] Build réussi
- [ ] Site accessible

### Vérifications
- [ ] Backend répond à `/api`
- [ ] Frontend charge correctement
- [ ] Connexion/Inscription fonctionne
- [ ] CORS configuré correctement (pas d'erreurs dans la console)
- [ ] Les images se chargent correctement

## 🐛 Dépannage

### Erreur CORS
- Vérifiez que `FRONTEND_URL` et `NETLIFY_URL` dans Railway correspondent exactement à l'URL Netlify
- Vérifiez que l'URL commence par `https://`

### Erreur 404 sur les routes React
- Vérifiez que le fichier `netlify.toml` contient les redirects
- Redéployez le site

### Variables d'environnement non chargées
- Les variables React doivent commencer par `REACT_APP_`
- Redéployez après modification des variables

### Backend ne démarre pas
- Vérifiez les logs sur Railway
- Vérifiez que toutes les variables d'environnement sont configurées
- Vérifiez que `PORT` est bien défini (Railway le définit automatiquement)

## 🔒 Sécurité

1. **Ne jamais commiter** :
   - Fichiers `.env`
   - Clés secrètes
   - Mots de passe

2. **Utiliser des clés Stripe en production** :
   - Pas de clés de test (`sk_test_`, `pk_test_`)
   - Utilisez des clés live (`sk_live_`, `pk_live_`)

3. **JWT_SECRET** :
   - Utilisez un secret long et aléatoire
   - Générez-le avec : `openssl rand -base64 32`

## 📞 Support

Si vous rencontrez des problèmes :
1. Vérifiez les logs sur Railway et Netlify
2. Vérifiez la console du navigateur
3. Vérifiez que toutes les variables d'environnement sont correctement configurées

