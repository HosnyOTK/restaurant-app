# 🔐 Guide : Authentification GitHub avec Personal Access Token

## ⚠️ Problème

GitHub a supprimé le support des mots de passe pour Git en août 2021. Vous devez maintenant utiliser un **Personal Access Token (PAT)**.

## 🎯 Solution : Créer un Personal Access Token

### Étape 1 : Créer le Token sur GitHub

1. **Allez sur GitHub** : https://github.com
2. **Connectez-vous** à votre compte
3. **Cliquez sur votre photo de profil** (en haut à droite) → **Settings**
4. **Dans le menu de gauche**, allez dans **Developer settings** (tout en bas)
5. **Cliquez sur "Personal access tokens"** → **"Tokens (classic)"**
6. **Cliquez sur "Generate new token"** → **"Generate new token (classic)"**
7. **Remplissez le formulaire** :
   - **Note** : `Restaurant App - Git Access` (ou un nom de votre choix)
   - **Expiration** : 
     - `90 days` (recommandé pour la sécurité)
     - `No expiration` (si vous voulez qu'il ne expire jamais)
   - **Scopes** : Cochez au minimum :
     - ✅ **`repo`** (accès complet aux dépôts privés)
     - ✅ **`workflow`** (si vous utilisez GitHub Actions)
8. **Cliquez sur "Generate token"** (tout en bas)
9. **⚠️ IMPORTANT** : **Copiez le token immédiatement** ! Il ressemble à : `ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
   - Vous ne pourrez plus le voir après avoir quitté la page
   - Si vous le perdez, vous devrez en créer un nouveau

### Étape 2 : Utiliser le Token avec Git

#### Option A : Utiliser le Token lors du push (Recommandé)

Quand Git vous demande votre nom d'utilisateur et mot de passe :

1. **Username** : Votre nom d'utilisateur GitHub (ex: `HosnyOTK`)
2. **Password** : **Collez le token** (pas votre mot de passe GitHub !)

#### Option B : Stocker le Token dans Git Credential Manager

**Sur Windows**, Git utilise le Credential Manager. Vous pouvez stocker le token :

1. **Lors du premier push**, Git vous demandera vos identifiants
2. **Username** : Votre nom d'utilisateur GitHub
3. **Password** : Collez le token
4. **Cochez "Remember my credentials"** si proposé

#### Option C : Utiliser GitHub CLI (Plus simple)

Installez GitHub CLI et authentifiez-vous :

```powershell
# Installer GitHub CLI (si pas déjà installé)
winget install --id GitHub.cli

# S'authentifier
gh auth login
```

Suivez les instructions à l'écran.

### Étape 3 : Nettoyer les anciennes credentials (si nécessaire)

Si vous avez des credentials en cache qui ne fonctionnent plus :

**Sur Windows (PowerShell)** :
```powershell
# Voir les credentials stockées
cmdkey /list

# Supprimer les credentials GitHub
cmdkey /delete:git:https://github.com
```

**Ou via Git** :
```powershell
git credential-manager erase
```

Puis entrez :
```
protocol=https
host=github.com
```

Appuyez sur Entrée deux fois.

## 🚀 Pousser votre code maintenant

Une fois le token créé, essayez de pousser :

```powershell
git push -u origin main
```

Quand Git demande :
- **Username** : `HosnyOTK` (votre username GitHub)
- **Password** : `ghp_votre_token_ici` (le token que vous avez copié)

## 🔒 Sécurité

1. **Ne partagez jamais votre token** avec qui que ce soit
2. **Ne commitez jamais le token** dans votre code
3. **Révocation** : Si vous pensez que votre token est compromis :
   - Allez sur GitHub → Settings → Developer settings → Personal access tokens
   - Cliquez sur le token → "Revoke"
   - Créez un nouveau token

## 🐛 Dépannage

### Erreur : "remote: Support for password authentication was removed"

➡️ Vous utilisez encore un mot de passe. Utilisez un Personal Access Token.

### Erreur : "Authentication failed"

➡️ Vérifiez que :
- Vous utilisez le token (pas le mot de passe)
- Le token n'a pas expiré
- Le token a les permissions `repo`

### Erreur : "Permission denied"

➡️ Vérifiez que le token a la permission `repo` cochée.

### Le token ne fonctionne plus après un certain temps

➡️ Le token a probablement expiré. Créez-en un nouveau.

## 📝 Alternative : Utiliser SSH au lieu de HTTPS

Si vous préférez, vous pouvez utiliser SSH au lieu de HTTPS :

1. **Générer une clé SSH** :
```powershell
ssh-keygen -t ed25519 -C "hosnyhologram@gmail.com"
```

2. **Ajouter la clé à GitHub** :
   - Copiez le contenu de `~/.ssh/id_ed25519.pub`
   - GitHub → Settings → SSH and GPG keys → New SSH key

3. **Changer l'URL du remote** :
```powershell
git remote set-url origin git@github.com:HosnyOTK/restaurant-app.git
```

## ✅ Vérification

Pour vérifier que tout fonctionne :

```powershell
git push -u origin main
```

Si ça fonctionne, vous verrez vos fichiers apparaître sur GitHub !

