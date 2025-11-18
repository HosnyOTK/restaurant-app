# Guide d'utilisation du schéma de base de données Draw.io

## Comment ouvrir le fichier

### Méthode 1 : Via le site web Draw.io (Recommandé)
1. Allez sur https://app.diagrams.net/ (ou https://draw.io)
2. Cliquez sur **"Open Existing Diagram"**
3. Sélectionnez le fichier `SCHEMA_BASE_DONNEES.drawio` depuis votre ordinateur
4. Le diagramme s'ouvrira automatiquement

### Méthode 2 : Via l'application desktop
1. Téléchargez Draw.io Desktop depuis https://github.com/jgraph/drawio-desktop/releases
2. Installez l'application
3. Ouvrez Draw.io
4. Fichier → Ouvrir → Sélectionnez `SCHEMA_BASE_DONNEES.drawio`

### Méthode 3 : Via Visual Studio Code
1. Installez l'extension "Draw.io Integration" dans VS Code
2. Ouvrez le fichier `SCHEMA_BASE_DONNEES.drawio` dans VS Code
3. Le diagramme s'affichera automatiquement

## Structure du schéma

Le diagramme contient **8 tables principales** :

### Tables bleues (Gestion des restaurants)
- **restaurants** : Informations sur les restaurants
- **categories** : Catégories de plats par restaurant
- **plats** : Menu et plats disponibles

### Table verte (Utilisateurs)
- **clients** : Clients, admins et livreurs

### Tables jaunes (Commandes)
- **commandes** : Commandes des clients
- **commande_details** : Détails de chaque commande (plats commandés)

### Table rouge (Facturation)
- **factures** : Factures générées pour les commandes

### Table violette (Avis)
- **avis** : Avis et évaluations des clients

## Relations entre les tables

- **restaurants** → **categories** (1:N) : Un restaurant a plusieurs catégories
- **restaurants** → **plats** (1:N) : Un restaurant a plusieurs plats
- **categories** → **plats** (1:N) : Une catégorie contient plusieurs plats
- **clients** → **commandes** (1:N) : Un client peut faire plusieurs commandes
- **restaurants** → **commandes** (1:N) : Un restaurant reçoit plusieurs commandes
- **clients** → **commandes** (livreur) (1:N) : Un livreur peut livrer plusieurs commandes
- **commandes** → **commande_details** (1:N) : Une commande contient plusieurs détails
- **plats** → **commande_details** (1:N) : Un plat peut être dans plusieurs commandes
- **commandes** → **factures** (1:1) : Une commande génère une facture
- **commandes** → **avis** (1:1) : Une commande peut avoir un avis

## Export du diagramme

Une fois ouvert dans Draw.io, vous pouvez :
- **Exporter en PNG** : Fichier → Exporter en tant que → PNG
- **Exporter en PDF** : Fichier → Exporter en tant que → PDF
- **Exporter en SVG** : Fichier → Exporter en tant que → SVG
- **Modifier** : Cliquez sur les éléments pour les modifier

## Problèmes courants

### Le fichier ne s'ouvre pas
- Vérifiez que le fichier a l'extension `.drawio`
- Essayez de renommer le fichier en `.xml` et ouvrez-le dans Draw.io

### Le diagramme ne s'affiche pas correctement
- Utilisez la version web de Draw.io (https://app.diagrams.net/)
- Vérifiez que votre navigateur est à jour

### Les relations ne sont pas visibles
- Utilisez le zoom (Ctrl + molette) pour voir tout le diagramme
- Utilisez le bouton "Fit" pour ajuster la vue






