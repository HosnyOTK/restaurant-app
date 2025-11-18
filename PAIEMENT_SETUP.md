# Configuration du Système de Paiement

## Installation

Le système de paiement utilise Stripe pour les transactions par carte bancaire.

### Variables d'environnement

Créez un fichier `.env` dans le dossier `backend/` avec les variables suivantes :

```env
STRIPE_SECRET_KEY=sk_test_votre_cle_secrete_stripe
NODE_ENV=development
```

Pour le frontend, créez un fichier `.env` dans le dossier `frontend/` :

```env
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_votre_cle_publique_stripe
```

### Obtenir vos clés Stripe

1. Créez un compte sur [Stripe](https://stripe.com)
2. Allez dans le Dashboard → Developers → API keys
3. Copiez votre clé secrète (Secret key) et votre clé publique (Publishable key)
4. Pour les tests, utilisez les clés de test (commençant par `sk_test_` et `pk_test_`)

### Mode Test

En mode développement, si Stripe n'est pas configuré, le système simule un paiement réussi. Cela permet de tester le flux sans avoir besoin de vraies cartes bancaires.

## Fonctionnalités

### 1. Paiement par Carte Bancaire

- Intégration Stripe Elements pour le formulaire de paiement sécurisé
- Validation côté client et serveur
- Support des cartes Visa, Mastercard, etc.

### 2. Génération Automatique de Factures

- Une facture est automatiquement créée après un paiement réussi
- Numéro de facture unique au format : `FACT-YYYYMMDD-XXXX`
- Enregistrement du statut de paiement et de la transaction

### 3. Historique des Factures

- Affichage de toutes les factures dans l'onglet "Historique des Factures" de la page des ventes
- Détails complets de chaque facture avec les articles commandés
- Filtrage et recherche par période

## Utilisation

### Pour les Clients

1. Ajouter des plats au panier
2. Cliquer sur "Passer la commande"
3. Remplir les informations de livraison
4. Continuer vers le paiement
5. Saisir les informations de la carte bancaire
6. Confirmer le paiement
7. La facture est générée automatiquement et affichée

### Pour les Admins

1. Aller dans le Dashboard Admin
2. Cliquer sur l'onglet "📊 Ventes"
3. Cliquer sur l'onglet "📄 Historique des Factures"
4. Voir toutes les factures avec leurs détails
5. Cliquer sur une facture pour voir les détails complets

## Structure de la Base de Données

### Table `factures`

- `id`: Identifiant unique
- `numero_facture`: Numéro unique de facture
- `commande_id`: Référence à la commande
- `client_id`: Référence au client
- `restaurant_id`: Référence au restaurant
- `montant_total`: Montant total de la facture
- `mode_paiement`: Mode de paiement (carte, espece, autre)
- `statut_paiement`: Statut (en_attente, paye, refuse, rembourse)
- `transaction_id`: ID de transaction Stripe
- `date_facture`: Date de création
- `date_paiement`: Date de paiement

## Notes Importantes

- Les paiements sont traités en temps réel via Stripe
- Les factures sont créées automatiquement après confirmation du paiement
- En mode test, utilisez les cartes de test Stripe :
  - Numéro: `4242 4242 4242 4242`
  - Date: N'importe quelle date future
  - CVC: N'importe quel 3 chiffres
  - Code postal: N'importe quel code postal valide

## Support

Pour toute question ou problème, consultez la [documentation Stripe](https://stripe.com/docs).







