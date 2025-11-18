import React, { useState, useEffect } from 'react';
import './App.css';
import Header from './components/Header';
import Accueil from './components/Accueil';
import Menu from './components/Menu';
import Panier from './components/Panier';
import Connexion from './components/Connexion';
import Inscription from './components/Inscription';
import MesCommandes from './components/MesCommandes';
import Commande from './components/Commande';
import DashboardLivreur from './components/DashboardLivreur';
import NotificationSystem from './components/NotificationSystem';
import BackgroundLogo from './components/BackgroundLogo';
import API_URL from './config/api';

function App() {
  // Charger le panier depuis localStorage au démarrage
  const [panier, setPanier] = useState(() => {
    try {
      const savedPanier = localStorage.getItem('panier');
      return savedPanier ? JSON.parse(savedPanier) : [];
    } catch (error) {
      console.error('Erreur lors du chargement du panier:', error);
      return [];
    }
  });
  const [restaurantActuel, setRestaurantActuel] = useState(() => {
    try {
      const savedRestaurant = localStorage.getItem('restaurantActuel');
      return savedRestaurant ? JSON.parse(savedRestaurant) : null;
    } catch (error) {
      console.error('Erreur lors du chargement du restaurant:', error);
      return null;
    }
  });
  const [isPanierOpen, setIsPanierOpen] = useState(false);
  const [showConnexion, setShowConnexion] = useState(false);
  const [showInscription, setShowInscription] = useState(false);
  const [user, setUser] = useState(null);
  const [activeView, setActiveView] = useState('accueil'); // accueil, menu, commandes

  // Sauvegarder le panier dans localStorage à chaque changement
  useEffect(() => {
    try {
      localStorage.setItem('panier', JSON.stringify(panier));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du panier:', error);
    }
  }, [panier]);

  // Sauvegarder le restaurant actuel dans localStorage
  useEffect(() => {
    try {
      if (restaurantActuel) {
        localStorage.setItem('restaurantActuel', JSON.stringify(restaurantActuel));
      } else {
        localStorage.removeItem('restaurantActuel');
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du restaurant:', error);
    }
  }, [restaurantActuel]);

  // Charger l'utilisateur depuis le localStorage
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const savedToken = localStorage.getItem('token');
    if (savedUser && savedToken) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const selectRestaurant = (restaurant) => {
    setRestaurantActuel(restaurant);
    setPanier([]); // Réinitialiser le panier
    setActiveView('menu');
  };

  const retourAccueil = () => {
    setRestaurantActuel(null);
    setPanier([]);
    setActiveView('accueil');
  };

  const handleMenuClick = async () => {
    // Si un restaurant est déjà sélectionné, afficher son menu
    if (restaurantActuel) {
      setActiveView('menu');
      return;
    }

    // Sinon, charger le premier restaurant disponible
    try {
      const response = await fetch(`${API_URL}/restaurants`);
      const restaurants = await response.json();
      
      if (restaurants && restaurants.length > 0) {
        setRestaurantActuel(restaurants[0]);
        setPanier([]);
        setActiveView('menu');
      } else {
        alert('Aucun restaurant disponible');
      }
    } catch (error) {
      console.error('Erreur lors du chargement des restaurants:', error);
      alert('Erreur lors du chargement du menu');
    }
  };

  const ajouterAuPanier = (plat, restaurantInfo = null) => {
    // Vérifier que l'utilisateur est connecté
    if (!user) {
      alert('Vous devez être inscrit et connecté pour ajouter des produits au panier.\n\nVoulez-vous vous connecter maintenant ?');
      setShowConnexion(true);
      return;
    }

    // Vérifier que le plat a un restaurant_id
    if (!plat.restaurant_id) {
      console.error('Erreur: plat sans restaurant_id', plat);
      alert('Erreur: Impossible d\'ajouter ce plat au panier. Le restaurant n\'est pas défini.');
      return;
    }

    // Normaliser le restaurant_id en nombre pour les comparaisons
    const platRestaurantId = Number(plat.restaurant_id);

    // Définir le restaurant actuel si nécessaire
    if (!restaurantActuel) {
      if (restaurantInfo) {
        // Si on a les infos complètes du restaurant, les utiliser immédiatement
        setRestaurantActuel(restaurantInfo);
      } else if (platRestaurantId) {
        // Sinon, récupérer les infos du restaurant de manière asynchrone
        fetch(`${API_URL}/restaurants`)
          .then(response => response.json())
          .then(restaurants => {
            const restaurant = restaurants.find(r => Number(r.id) === platRestaurantId);
            if (restaurant) {
              setRestaurantActuel(restaurant);
            }
          })
          .catch(error => {
            console.error('Erreur lors de la récupération du restaurant:', error);
          });
      }
    }

    // Ajouter au panier
    setPanier(prevPanier => {
      // Vérifier que le plat appartient au même restaurant
      if (prevPanier.length > 0) {
        const premierPlatRestaurantId = Number(prevPanier[0].restaurant_id);
        if (premierPlatRestaurantId !== platRestaurantId) {
          if (window.confirm('Voulez-vous vider votre panier et ajouter ce plat d\'un autre restaurant ?')) {
            return [{ ...plat, restaurant_id: platRestaurantId, quantite: 1 }];
          }
          return prevPanier;
        }
      }

      const existe = prevPanier.find(item => item.id === plat.id);
      if (existe) {
        return prevPanier.map(item =>
          item.id === plat.id
            ? { ...item, quantite: item.quantite + 1 }
            : item
        );
      }
      return [...prevPanier, { ...plat, restaurant_id: platRestaurantId, quantite: 1 }];
    });
  };

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

  const retirerDuPanier = (platId) => {
    setPanier(prevPanier => prevPanier.filter(item => item.id !== platId));
  };

  const calculerTotal = () => {
    return panier.reduce((total, item) => total + (parseFloat(item.prix) * item.quantite), 0);
  };

  const handleLogin = (userData, token) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', token);
    setShowConnexion(false);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setPanier([]);
    localStorage.removeItem('panier');
    setRestaurantActuel(null);
    localStorage.removeItem('restaurantActuel');
    setActiveView('accueil');
  };

  const passerCommande = async () => {
    if (panier.length === 0) {
      alert('Votre panier est vide');
      return;
    }

    if (!restaurantActuel) {
      alert('Erreur : aucun restaurant sélectionné');
      return;
    }

    if (!user) {
      setShowConnexion(true);
      return;
    }

    // Fermer le panier et rediriger vers la page de commande
    setIsPanierOpen(false);
    setActiveView('commande');
  };

  const confirmerCommande = async (infosCommande) => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token || !user) {
        alert('Vous devez être connecté pour passer une commande');
        setShowConnexion(true);
        return;
      }

      if (!panier || panier.length === 0) {
        alert('Votre panier est vide');
        return;
      }

      if (!restaurantActuel || !restaurantActuel.id) {
        alert('Erreur : aucun restaurant sélectionné');
        return;
      }

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
        body: JSON.stringify({
          items,
          client_id: user.id,
          restaurant_id: restaurantActuel.id,
          adresse_livraison: infosCommande.adresse || user.adresse || '',
          telephone: infosCommande.telephone || user.telephone || '',
          notes: infosCommande.notes || ''
        })
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Commande créée avec succès:', data);
        
        // Retourner l'ID de la commande pour le paiement
        return {
          commandeId: data.commandeId || data.commande?.id,
          commande: data.commande
        };
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Erreur inconnue' }));
        console.error('Erreur lors de la création de la commande:', errorData);
        alert('Erreur: ' + (errorData.error || 'Impossible de passer la commande'));
        return null;
      }
    } catch (error) {
      console.error('Erreur lors de la commande:', error);
      alert('Erreur de connexion lors de la commande. Vérifiez votre connexion internet.');
      return null;
    }
  };

  const handlePaiementReussi = () => {
    // Vider le panier après paiement réussi
    setPanier([]);
    localStorage.removeItem('panier');
    setIsPanierOpen(false);
  };

  // Si l'utilisateur est livreur, afficher uniquement le dashboard livreur
  if (user && user.role === 'livreur') {
    return (
      <div className="App">
        <BackgroundLogo />
        <DashboardLivreur user={user} onLogout={handleLogout} />
      </div>
    );
  }

  return (
    <div className="App">
      <BackgroundLogo />
      {user && <NotificationSystem user={user} />}
      <Header
        panierCount={panier.reduce((sum, item) => sum + item.quantite, 0)}
        onPanierClick={() => setIsPanierOpen(true)}
        user={user}
        onLoginClick={() => setShowConnexion(true)}
        onLogout={handleLogout}
        onAccueilClick={retourAccueil}
        onMenuClick={handleMenuClick}
        onCommandesClick={() => {
          if (user && user.role !== 'admin') {
            setActiveView('commandes');
          }
        }}
        onLivreurClick={() => setActiveView('livreur')}
        restaurantActuel={restaurantActuel}
      />

      <main>
        {activeView === 'accueil' && (
          <Accueil 
            onSelectRestaurant={selectRestaurant} 
            user={user} 
            onAddToCart={ajouterAuPanier}
            onLoginClick={() => setShowConnexion(true)}
          />
        )}

        {activeView === 'menu' && restaurantActuel && (
          <Menu 
            restaurant={restaurantActuel}
            onAddToCart={ajouterAuPanier}
            onRetourAccueil={retourAccueil}
            user={user}
            onLoginClick={() => setShowConnexion(true)}
          />
        )}

        {activeView === 'menu' && !restaurantActuel && (
          <div className="container" style={{ padding: '2rem', textAlign: 'center' }}>
            <p>Chargement du menu...</p>
          </div>
        )}

        {activeView === 'commandes' && user && user.role !== 'admin' && (
          <MesCommandes userId={user.id} />
        )}

        {activeView === 'commandes' && !user && (
          <div className="container" style={{ padding: '2rem', textAlign: 'center' }}>
            <p>Veuillez vous connecter pour voir vos commandes</p>
            <button onClick={() => setShowConnexion(true)} className="btn btn-primary">
              Se connecter
            </button>
          </div>
        )}

        {activeView === 'commande' && restaurantActuel && (
          <Commande
            panier={panier}
            restaurant={restaurantActuel}
            user={user}
            total={calculerTotal()}
            onConfirmer={confirmerCommande}
            onRetour={() => {
              setActiveView('menu');
              handlePaiementReussi();
            }}
            onNavigateToFactures={() => {
              setActiveView('commandes');
              handlePaiementReussi();
              // Déclencher l'ouverture de l'onglet factures dans MesCommandes
              setTimeout(() => {
                window.dispatchEvent(new CustomEvent('openFacturesTab'));
              }, 100);
            }}
          />
        )}
      </main>

      {isPanierOpen && (
        <Panier
          panier={panier}
          restaurant={restaurantActuel}
          onClose={() => setIsPanierOpen(false)}
          onModifierQuantite={modifierQuantite}
          onRetirer={retirerDuPanier}
          total={calculerTotal()}
          onCommander={passerCommande}
          user={user}
        />
      )}

      {showConnexion && (
        <Connexion
          onClose={() => setShowConnexion(false)}
          onLogin={handleLogin}
          onSwitchToInscription={() => {
            setShowConnexion(false);
            setShowInscription(true);
          }}
        />
      )}

      {showInscription && (
        <Inscription
          onClose={() => setShowInscription(false)}
          onRegister={handleLogin}
          onSwitchToConnexion={() => {
            setShowInscription(false);
            setShowConnexion(true);
          }}
        />
      )}
    </div>
  );
}

export default App;
