# 📦 Guide : Ajouter votre projet sur GitHub

## 🎯 Vue d'ensemble

Ce guide vous explique comment :
1. Initialiser un dépôt Git local
2. Créer un dépôt sur GitHub
3. Connecter votre projet local à GitHub
4. Pousser votre code sur GitHub

## 📋 Prérequis

- ✅ Compte GitHub créé (https://github.com)
- ✅ Git installé sur votre ordinateur

### Vérifier si Git est installé

Ouvrez PowerShell ou Terminal et tapez :
```bash
git --version
```

Si Git n'est pas installé, téléchargez-le : https://git-scm.com/downloads

## 🚀 Étapes détaillées

### Étape 1 : Initialiser Git dans votre projet

1. **Ouvrez PowerShell** (ou Terminal)
2. **Naviguez vers votre projet** :
```powershell
cd "C:\Users\DELL\Restaurant final"
```

3. **Initialisez Git** :
```bash
git init
```

### Étape 2 : Créer un fichier .gitignore (si pas déjà créé)

Le fichier `.gitignore` empêche Git de suivre certains fichiers (node_modules, .env, etc.).

Vérifiez que vous avez un fichier `.gitignore` à la racine. S'il n'existe pas, créez-le avec ce contenu :

```
# Dependencies
node_modules/
frontend/node_modules/
backend/node_modules/

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local
frontend/.env.production
backend/.env

# Build outputs
frontend/build/
frontend/dist/
backend/dist/

# Logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Database
*.db
*.db-shm
*.db-wal
backend/database/*.db
backend/database/*.db-shm
backend/database/*.db-wal

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db

# Uploads (optionnel)
backend/uploads/
```

### Étape 3 : Ajouter tous les fichiers au dépôt

```bash
git add .
```

### Étape 4 : Créer le premier commit

```bash
git commit -m "Initial commit: Restaurant app avec React et Express"
```

### Étape 5 : Créer un dépôt sur GitHub

1. **Allez sur GitHub** : https://github.com
2. **Connectez-vous** à votre compte
3. **Cliquez sur le "+" en haut à droite** → "New repository"
4. **Remplissez les informations** :
   - **Repository name** : `restaurant-app` (ou le nom que vous voulez)
   - **Description** : "Application de commande en ligne pour restaurant"
   - **Visibilité** : 
     - ✅ **Public** (gratuit, visible par tous)
     - 🔒 **Private** (gratuit, visible uniquement par vous)
   - ⚠️ **NE COCHEZ PAS** "Add a README file" (vous avez déjà des fichiers)
   - ⚠️ **NE COCHEZ PAS** "Add .gitignore" (vous en avez déjà un)
   - ⚠️ **NE COCHEZ PAS** "Choose a license"
5. **Cliquez sur "Create repository"**

### Étape 6 : Connecter votre projet local à GitHub

GitHub vous affichera des instructions. Choisissez "push an existing repository from the command line".

**Copiez et exécutez ces commandes** (remplacez `VOTRE_USERNAME` par votre nom d'utilisateur GitHub) :

```bash
git remote add origin https://github.com/VOTRE_USERNAME/restaurant-app.git
git branch -M main
git push -u origin main
```

**Exemple** : Si votre username est `john-doe` et votre repo `restaurant-app` :
```bash
git remote add origin https://github.com/john-doe/restaurant-app.git
git branch -M main
git push -u origin main
```

### Étape 7 : Authentification GitHub

Lors du `git push`, GitHub vous demandera de vous authentifier :

**Option 1 : Personal Access Token (Recommandé)**
1. Allez sur GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Cliquez sur "Generate new token (classic)"
3. Donnez un nom (ex: "Restaurant App")
4. Cochez `repo` (accès complet aux dépôts)
5. Cliquez sur "Generate token"
6. **Copiez le token** (vous ne le reverrez plus !)
7. Quand Git vous demande le mot de passe, **collez le token** (pas votre mot de passe)

**Option 2 : GitHub CLI**
```bash
gh auth login
```

## ✅ Vérification

Après le push, allez sur votre dépôt GitHub. Vous devriez voir tous vos fichiers !

## 📝 Commandes Git utiles

### Voir l'état des fichiers
```bash
git status
```

### Ajouter des fichiers modifiés
```bash
git add .
```

### Créer un commit
```bash
git commit -m "Description des modifications"
```

### Pousser vers GitHub
```bash
git push
```

### Voir l'historique des commits
```bash
git log
```

## 🔄 Mettre à jour votre dépôt GitHub

Chaque fois que vous modifiez votre code :

```bash
git add .
git commit -m "Description de vos modifications"
git push
```

## 🐛 Dépannage

### Erreur : "remote origin already exists"
```bash
git remote remove origin
git remote add origin https://github.com/VOTRE_USERNAME/restaurant-app.git
```

### Erreur : "failed to push some refs"
```bash
git pull origin main --allow-unrelated-histories
git push -u origin main
```

### Oublier d'ajouter un fichier
```bash
git add nom-du-fichier
git commit -m "Ajout du fichier oublié"
git push
```

## 🔒 Sécurité

⚠️ **IMPORTANT** : Ne jamais commiter :
- Fichiers `.env` contenant des secrets
- Clés API
- Mots de passe
- Fichiers de base de données sensibles

Le fichier `.gitignore` que nous avons créé protège déjà ces fichiers.

## 📚 Ressources

- Documentation Git : https://git-scm.com/doc
- Documentation GitHub : https://docs.github.com
- Guide Git en français : https://git-scm.com/book/fr/v2

