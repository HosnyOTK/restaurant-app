# Instructions de démarrage rapide

## 🚀 Démarrage en 5 étapes

### 1. Installer les dépendances
```bash
npm run install-all
```

### 2. Configurer MySQL
1. Ouvrir MySQL (via XAMPP, WAMP, ou MySQL directement)
2. Créer la base de données :
```sql
CREATE DATABASE restaurant_db;
```

3. Importer le schéma :
```bash
mysql -u root -p restaurant_db < backend/database/schema.sql
```

Ou via phpMyAdmin :
- Sélectionner la base `restaurant_db`
- Aller dans l'onglet "Importer"
- Choisir le fichier `backend/database/schema.sql`

### 3. Configurer le backend
1. Aller dans le dossier backend :
```bash
cd backend
```

2. Créer/copier le fichier .env :
```bash
copy .env.example .env
```

3. Éditer `.env` et modifier :
```
DB_PASSWORD=votre_mot_de_passe_mysql
JWT_SECRET=changez_ce_secret_pour_la_production
```

### 4. Démarrer le backend
```bash
cd backend
npm run dev
```

Le serveur devrait démarrer sur `http://localhost:5000`

### 5. Démarrer le frontend (dans un nouveau terminal)
```bash
cd frontend
npm start
```

L'application devrait s'ouvrir dans votre navigateur sur `http://localhost:3000`

## ✅ Vérification

Pour vérifier que tout fonctionne :
1. Ouvrir `http://localhost:5000/api` → Devrait afficher un message JSON
2. Ouvrir `http://localhost:3000` → Devrait afficher l'interface du restaurant

## 🧪 Tester l'application

1. **Consulter le menu** : La page d'accueil affiche automatiquement les plats
2. **S'inscrire** : Cliquer sur "Connexion" puis "S'inscrire"
3. **Ajouter au panier** : Cliquer sur "Ajouter" pour n'importe quel plat
4. **Passer une commande** : Ouvrir le panier et cliquer sur "Passer la commande"

## 📝 Notes importantes

- Le backend doit être démarré avant le frontend
- Assurez-vous que MySQL est démarré
- Le port 5000 (backend) et 3000 (frontend) doivent être disponibles

## 🐛 En cas de problème

### Erreur de connexion à la base de données
- Vérifier que MySQL est démarré
- Vérifier les identifiants dans `.env`
- Vérifier que la base `restaurant_db` existe

### Erreur "Port already in use"
- Changer le port dans `backend/.env` (PORT=5001)
- Ou tuer le processus utilisant le port

### Les plats ne s'affichent pas
- Vérifier que le schéma SQL a été importé
- Vérifier la console du navigateur pour les erreurs
- Vérifier que le backend est bien démarré

## 💡 Pour votre rapport

Vous pouvez documenter :
- L'architecture client-serveur
- L'API REST et ses endpoints
- La structure de la base de données
- Les technologies utilisées
- Les captures d'écran de l'application











