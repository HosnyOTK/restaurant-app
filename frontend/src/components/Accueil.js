import React, { useState, useEffect, useRef, useCallback } from 'react';
import DashboardAdmin from './DashboardAdmin';
import WhatsAppButton from './WhatsAppButton';
import { ListeAvis } from './Avis';
import { useToast, ToastContainer } from './ToastNotification';
import API_URL from '../config/api';
const CAROUSEL_SLIDES = 10;

// Images du carousel - vous pouvez personnaliser les titres
const CAROUSEL_IMAGES = [
  { src: '/images/carousel/carousel-1.jpg', title: 'Nos spécialités', alt: 'Plat gastronomique' },
  { src: '/images/carousel/carousel-2.jpg', title: 'Notre restaurant', alt: 'Restaurant' },
  { src: '/images/carousel/carousel-3.jpg', title: 'Produits frais', alt: 'Plat frais' },
  { src: '/images/carousel/carousel-4.jpg', title: 'Notre cuisine', alt: 'Cuisine' },
  { src: '/images/carousel/carousel-5.jpg', title: 'Présentation soignée', alt: 'Présentation' },
  { src: '/images/carousel/carousel-6.jpg', title: 'Découvrez nos plats', alt: 'Plat 6' },
  { src: '/images/carousel/carousel-7.jpg', title: 'Ambiance chaleureuse', alt: 'Ambiance' },
  { src: '/images/carousel/carousel-8.jpg', title: 'Ingrédients de qualité', alt: 'Ingrédients' },
  { src: '/images/carousel/carousel-9.jpg', title: 'Service exceptionnel', alt: 'Service' },
  { src: '/images/carousel/carousel-10.jpg', title: 'Expérience unique', alt: 'Expérience' }
];

function Accueil({ onSelectRestaurant, user, onAddToCart, onLoginClick }) {
  // États
  const [plats, setPlats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentCarouselSlide, setCurrentCarouselSlide] = useState(0);
  const [selectedDeliveryOption, setSelectedDeliveryOption] = useState('retrait');
  const [isGalleryVisible, setIsGalleryVisible] = useState(false);
  const [isProductsVisible, setIsProductsVisible] = useState(false);
  const [restaurant, setRestaurant] = useState(null);
  const [error, setError] = useState(null);
  const [hoveredProduct, setHoveredProduct] = useState(null);
  const [videoExists, setVideoExists] = useState(false);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [videos, setVideos] = useState([]);
  
  // Système de notifications toast
  const { toasts, showToast, removeToast } = useToast();

  // Refs
  const galleryRef = useRef(null);
  const productsRef = useRef(null);

  // Charger les restaurants et les plats
  useEffect(() => {
    if (user && user.role === 'admin') {
      setLoading(false);
      return;
    }

    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Charger les restaurants
        let restaurants = [];
        try {
          const restaurantsResponse = await fetch(`${API_URL}/restaurants`);
          if (restaurantsResponse.ok) {
            restaurants = await restaurantsResponse.json();
          }
        } catch (err) {
          console.warn('Erreur chargement restaurants:', err);
        }

        if (!Array.isArray(restaurants) || restaurants.length === 0) {
          setPlats([]);
          setRestaurant(null);
          setLoading(false);
          setIsProductsVisible(true);
          return;
        }

        const firstRestaurant = restaurants[0];
        setRestaurant(firstRestaurant);

        // Charger les plats
        let platsData = [];
        try {
          const platsResponse = await fetch(`${API_URL}/menu/restaurant/${firstRestaurant.id}/plats`);
          if (platsResponse.ok) {
            platsData = await platsResponse.json();
          }
        } catch (err) {
          console.warn('Erreur chargement plats:', err);
        }

        if (Array.isArray(platsData)) {
          const platsWithRestaurant = platsData
            .slice(0, 6)
            .map(plat => ({
              ...plat,
              id: plat.id || Math.random().toString(36).substr(2, 9),
              restaurant_id: Number(plat.restaurant_id || firstRestaurant.id)
            }));
          
          setPlats(platsWithRestaurant);
        } else {
          setPlats([]);
        }
      } catch (error) {
        console.error('Erreur critique lors du chargement:', error);
        setError(error.message);
        setPlats([]);
      } finally {
        setLoading(false);
        setIsProductsVisible(true);
      }
    };

    loadData();
  }, [user]);


  // Charger les vidéos disponibles (une seule fois au chargement)
  useEffect(() => {
    // Liste des vidéos à essayer dans l'ordre
    const videoFiles = ['/videos/video1.mp4', '/videos/video2.mp4'];
    
    // On charge directement les vidéos - elles s'afficheront si elles existent
    // On essaie simplement de charger les vidéos, elles géreront leurs propres erreurs
    console.log('🔍 Recherche des vidéos:', videoFiles);
    setVideos(videoFiles);
    setVideoExists(true); // On assume qu'elles existent, les erreurs seront gérées par onError
  }, []);

  // Changer de vidéo automatiquement toutes les 2 minutes (backup si les vidéos ne se terminent pas)
  useEffect(() => {
    if (videos.length > 1) {
      const interval = setInterval(() => {
        setCurrentVideoIndex(prev => (prev + 1) % videos.length);
      }, 120000); // 2 minutes = 120000 ms (backup)
      
      return () => clearInterval(interval);
    }
  }, [videos.length]);

  // Carousel auto-play
  const moveCarousel = useCallback((direction) => {
    setCurrentCarouselSlide(prev => {
      const next = prev + direction;
      if (next < 0) return CAROUSEL_SLIDES - 1;
      if (next >= CAROUSEL_SLIDES) return 0;
      return next;
    });
  }, []);

  // Navigation directe vers un slide
  const goToSlide = useCallback((index) => {
    if (index >= 0 && index < CAROUSEL_SLIDES) {
      setCurrentCarouselSlide(index);
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      moveCarousel(1);
    }, 5000);
    return () => clearInterval(interval);
  }, [moveCarousel]);

  // Forcer la visibilité de la galerie
  useEffect(() => {
    setIsGalleryVisible(true);
  }, []);


  const scrollToSection = (sectionId) => {
    const section = document.getElementById(sectionId);
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Gestion de l'ajout au panier
  const handleAddToCart = useCallback((plat, event) => {
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }

    // Vérifier si l'utilisateur est connecté
    if (!user) {
      console.log('Utilisateur non connecté, ouverture de la modal de connexion');
      if (onLoginClick) {
        onLoginClick();
      } else {
        showToast('Veuillez vous connecter pour ajouter des produits au panier.', 'warning');
      }
      return;
    }

    // Vérifier que le plat a les données nécessaires
    if (!plat || !plat.id) {
      console.error('Plat invalide:', plat);
      showToast('Erreur: Impossible d\'ajouter ce plat au panier.', 'error');
      return;
    }

    // S'assurer que le plat a un restaurant_id valide
    let restaurantId = plat.restaurant_id ? Number(plat.restaurant_id) : null;
    
    if (!restaurantId || isNaN(restaurantId)) {
      if (restaurant && restaurant.id) {
        restaurantId = Number(restaurant.id);
      } else {
        console.error('Restaurant ID manquant:', { plat, restaurant });
        showToast('Erreur: Impossible d\'ajouter ce plat au panier. Le restaurant n\'est pas défini.', 'error');
        return;
      }
    }

    // Créer le plat avec restaurant_id garanti
    const platAvecRestaurant = {
      ...plat,
      restaurant_id: restaurantId
    };

    console.log('Ajout au panier:', platAvecRestaurant);

    // Appeler la fonction d'ajout au panier
    if (onAddToCart) {
      try {
        onAddToCart(platAvecRestaurant, restaurant || null);
        
        // Feedback visuel de succès
        if (event && event.target) {
          const button = event.target.closest('.add-to-cart') || event.target;
          if (button && button.classList) {
            const originalBg = button.style.backgroundColor;
            button.style.transform = 'scale(0.9)';
            button.style.backgroundColor = '#28a745';
            button.textContent = '✓ Ajouté';
            
            setTimeout(() => {
              button.style.transform = 'scale(1)';
              setTimeout(() => {
                button.style.backgroundColor = originalBg;
                button.textContent = 'Ajouter';
              }, 1000);
            }, 150);
          }
        }
      } catch (error) {
        console.error('Erreur lors de l\'ajout au panier:', error);
        showToast('Erreur lors de l\'ajout au panier. Veuillez réessayer.', 'error');
      }
    } else {
      console.error('onAddToCart non défini');
      showToast('Erreur: Fonction d\'ajout au panier non disponible.', 'error');
    }
  }, [user, restaurant, onAddToCart, onLoginClick]);

  // Gestion du hover sur les produits
  const handleProductHover = useCallback((platId, isHovering) => {
    setHoveredProduct(isHovering ? platId : null);
  }, []);

  // Fonction pour remonter en haut de la page
  const scrollToTop = useCallback((e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    console.log('Clic sur bouton retour en haut');
    
    // Méthode 1: Utiliser scrollIntoView sur la section hero
    const heroSection = document.getElementById('accueil');
    if (heroSection) {
      heroSection.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start',
        inline: 'nearest'
      });
      return;
    }
    
    // Méthode 2: Fallback avec window.scrollTo
    if (window.scrollTo) {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: 'smooth'
      });
    } else {
      // Fallback pour les vieux navigateurs
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }
  }, []);

  // Si l'utilisateur est admin, afficher le dashboard
  if (user && user.role === 'admin') {
    return <DashboardAdmin user={user} />;
  }

  return (
    <div className="accueil-page">
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      {/* Hero Section */}
      <section className="hero" id="accueil">
        <div className="hero-video-wrapper">
          {videoExists && videos.length > 0 ? (
            videos.map((videoSrc, index) => (
              <video 
                key={videoSrc}
                className="hero-video" 
                autoPlay 
                muted 
                loop={false}
                playsInline 
                preload="auto"
                style={{
                  display: index === currentVideoIndex ? 'block' : 'none',
                  opacity: index === currentVideoIndex ? 1 : 0,
                  transition: 'opacity 1.5s ease-in-out'
                }}
                onEnded={(e) => {
                  // Si la vidéo se termine et qu'il y a plusieurs vidéos, passer à la suivante
                  if (videos.length > 1) {
                    setTimeout(() => {
                      setCurrentVideoIndex((prev) => (prev + 1) % videos.length);
                    }, 500); // Petit délai pour la transition
                  } else {
                    // Si une seule vidéo, la relancer
                    const videoElement = e.target;
                    videoElement.currentTime = 0;
                    videoElement.play();
                  }
                }}
                onLoadedData={(e) => {
                  console.log(`✅ Vidéo ${index + 1} chargée avec succès:`, videoSrc);
                  // S'assurer que la vidéo active démarre
                  if (index === currentVideoIndex) {
                    e.target.play().catch(err => {
                      console.error('❌ Erreur lecture vidéo:', err);
                    });
                  }
                }}
                onCanPlay={(e) => {
                  console.log(`▶️ Vidéo ${index + 1} prête à être lue:`, videoSrc);
                  // Quand la vidéo peut être lue
                  if (index === currentVideoIndex) {
                    e.target.play().catch(err => {
                      console.error('❌ Erreur démarrage vidéo:', err);
                    });
                  }
                }}
                onError={(e) => {
                  const error = e.target.error;
                  console.error('❌ Erreur chargement vidéo:', videoSrc);
                  console.error('Détails erreur:', {
                    code: error?.code,
                    message: error?.message,
                    MEDIA_ERR_ABORTED: error?.code === 1,
                    MEDIA_ERR_NETWORK: error?.code === 2,
                    MEDIA_ERR_DECODE: error?.code === 3,
                    MEDIA_ERR_SRC_NOT_SUPPORTED: error?.code === 4
                  });
                  // Si erreur, retirer cette vidéo de la liste
                  setVideos(prev => {
                    const newVideos = prev.filter(v => v !== videoSrc);
                    console.log(`📋 Vidéos restantes: ${newVideos.length}`, newVideos);
                    if (newVideos.length === 0) {
                      setVideoExists(false);
                      console.log('⚠️ Aucune vidéo valide, désactivation du système vidéo');
                    }
                    return newVideos;
                  });
                }}
              >
                <source src={videoSrc} type="video/mp4" />
              </video>
            ))
          ) : null}
          <div className="hero-overlay"></div>
          
          {/* Indicateurs de vidéos (si plusieurs vidéos) */}
          {videos.length > 1 && (
            <div style={{
              position: 'absolute',
              bottom: '20px',
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              gap: '0.5rem',
              zIndex: 10
            }}>
              {videos.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentVideoIndex(index)}
                  style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    border: '2px solid white',
                    background: index === currentVideoIndex ? 'white' : 'transparent',
                    cursor: 'pointer',
                    transition: 'all 0.3s',
                    padding: 0
                  }}
                  aria-label={`Vidéo ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>
        <div className="hero-content">
          <h2 className="hero-title">livraison service fastfood</h2>
          <p className="hero-subtitle">Des produits frais livrés directement chez vous ou à retirer sur place</p>
          <div className="hero-buttons">
            <button 
              className="btn btn-primary" 
              onClick={() => scrollToSection('produits')}
              style={{ cursor: 'pointer' }}
            >
              Commander maintenant
            </button>
            <button 
              className="btn btn-secondary" 
              onClick={() => scrollToSection('livraison')}
              style={{ cursor: 'pointer' }}
            >
              En savoir plus
            </button>
          </div>
        </div>
      </section>

      {/* Gallery Carousel */}
      <section 
        className={`gallery-carousel ${isGalleryVisible ? 'visible' : ''}`} 
        id="livraison" 
        ref={galleryRef}
      >
        <div className="carousel-container">
          <div 
            className="carousel-wrapper" 
            style={{ 
              transform: `translateX(-${currentCarouselSlide * (100 / CAROUSEL_SLIDES)}%)`,
              willChange: 'transform'
            }}
          >
            {CAROUSEL_IMAGES.map((image, index) => (
              <div 
                key={`carousel-${index}`}
                className="carousel-slide"
                style={{
                  width: `${100 / CAROUSEL_SLIDES}%`,
                  flexShrink: 0
                }}
              >
                {/* Fond de secours - toujours visible en arrière-plan */}
                <div 
                  className="carousel-slide-background"
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    background: 'linear-gradient(135deg, #6B9F78 0%, #8FB99A 100%)',
                    zIndex: 1
                  }}
                />
                {/* Image - se charge normalement */}
                <img 
                  src={image.src} 
                  alt={image.alt}
                  className="carousel-image"
                  loading="eager"
                  onLoad={(e) => {
                    console.log(`✅ Image ${index + 1} chargée: ${image.src}`);
                    e.target.classList.add('loaded');
                  }}
                  onError={(e) => {
                    console.error(`❌ Erreur chargement image ${index + 1}: ${image.src}`);
                    e.target.style.display = 'none';
                  }}
                />
                {/* Overlay avec titre */}
                <div className="slide-overlay">
                  <h3>{image.title}</h3>
                </div>
              </div>
            ))}
          </div>
          <button 
            className="carousel-btn carousel-prev" 
            onClick={() => moveCarousel(-1)}
            aria-label="Slide précédent"
            style={{ cursor: 'pointer' }}
          >
            ‹
          </button>
          <button 
            className="carousel-btn carousel-next" 
            onClick={() => moveCarousel(1)}
            aria-label="Slide suivant"
            style={{ cursor: 'pointer' }}
          >
            ›
          </button>
          <div className="carousel-dots">
            {Array.from({ length: CAROUSEL_SLIDES }).map((_, index) => (
              <span
                key={index}
                className={`carousel-dot ${index === currentCarouselSlide ? 'active' : ''}`}
                onClick={() => goToSlide(index)}
                role="button"
                tabIndex={0}
                style={{ cursor: 'pointer' }}
              />
            ))}
          </div>
        </div>
        
        {/* Delivery Options */}
        <div className="delivery-options-quick">
          <div className="container">
            <h3>Mode de réception</h3>
            <div className="delivery-quick-buttons">
              <button
                className={`delivery-btn ${selectedDeliveryOption === 'retrait' ? 'active' : ''}`}
                onClick={() => setSelectedDeliveryOption('retrait')}
                style={{ cursor: 'pointer' }}
              >
                <span>🏪</span> Retrait sur place (Gratuit)
              </button>
              <button
                className={`delivery-btn ${selectedDeliveryOption === 'livraison' ? 'active' : ''}`}
                onClick={() => setSelectedDeliveryOption('livraison')}
                style={{ cursor: 'pointer' }}
              >
                <span>🚚</span> Livraison à domicile
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Products Section */}
      <section 
        className="products visible"
        id="produits" 
        ref={productsRef}
        style={{
          opacity: 1,
          transform: 'translateY(0)',
          visibility: 'visible'
        }}
      >
        <div className="container">
          <h2>Nos produits phares</h2>
          
          {error && (
            <div className="error-message" style={{ textAlign: 'center', padding: '1rem', color: 'red' }}>
              <p>Erreur de chargement: {error}</p>
            </div>
          )}
          
          {loading ? (
            <div className="loading-state" style={{ textAlign: 'center', padding: '2rem' }}>
              <p>Chargement des produits...</p>
            </div>
          ) : (
            <div className="products-grid">
              {plats.length > 0 ? (
                plats.map((plat, index) => (
                  <div
                    key={plat.id}
                    className={`product-card ${hoveredProduct === plat.id ? 'hovered' : ''} ${!user ? 'requires-login' : ''}`}
                    style={{ 
                      animationDelay: `${index * 0.1}s`,
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      transform: hoveredProduct === plat.id ? 'translateY(-5px)' : 'none',
                      boxShadow: hoveredProduct === plat.id ? '0 10px 25px rgba(0,0,0,0.2)' : '0 5px 15px rgba(0,0,0,0.1)'
                    }}
                    onMouseEnter={() => handleProductHover(plat.id, true)}
                    onMouseLeave={() => handleProductHover(plat.id, false)}
                    onClick={(e) => {
                      // Ne pas déclencher si on clique sur le footer ou le bouton
                      if (e.target.closest('.product-footer') || e.target.closest('.add-to-cart')) {
                        return;
                      }
                      
                      console.log('Clic sur carte produit:', plat.nom);
                      
                      // Si l'utilisateur n'est pas connecté, ouvrir la modal de connexion
                      if (!user) {
                        if (onLoginClick) {
                          onLoginClick();
                        } else {
                          showToast('Veuillez vous connecter pour ajouter des produits au panier.', 'warning');
                        }
                        return;
                      }
                      
                      // Si connecté, ajouter au panier
                      handleAddToCart(plat, e);
                    }}
                    title={!user ? 'Cliquez pour vous connecter et ajouter au panier' : 'Cliquez sur la carte pour ajouter au panier'}
                  >
                    <div className="product-category">{plat.categorie_nom || 'Menu'}</div>
                    <div className="product-image">
                      {plat.image_url ? (
                        <img 
                          src={plat.image_url.startsWith('http') ? plat.image_url : `http://localhost:5000${plat.image_url}`} 
                          alt={plat.nom || 'Plat'}
                          onError={(e) => {
                            e.target.style.display = 'none';
                            const fallback = e.target.nextElementSibling;
                            if (fallback) {
                              fallback.style.display = 'flex';
                            }
                          }}
                        />
                      ) : null}
                      {!plat.image_url && (
                        <div className="image-placeholder" style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center', 
                          width: '100%', 
                          height: '100%',
                          fontSize: '3rem'
                        }}>
                          🍽️
                        </div>
                      )}
                    </div>
                    <div className="product-info">
                      <div className="product-name">{plat.nom || 'Plat sans nom'}</div>
                      <div className="product-description">
                        {plat.description || 'Description non disponible'}
                      </div>
                      <div 
                        className="product-footer" 
                        onClick={(e) => {
                          e.stopPropagation();
                          console.log('Clic sur footer produit');
                          // Si l'utilisateur n'est pas connecté, ne rien faire (le bouton gère le clic)
                          if (user) {
                            handleAddToCart(plat, e);
                          }
                        }}
                      >
                        <div className="product-price">
                          {plat.prix ? `${Number(plat.prix).toFixed(0)} FCFA` : 'Prix non disponible'}
                        </div>
                        <button
                          type="button"
                          className="add-to-cart"
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            console.log('Clic sur bouton:', !user ? 'Se connecter' : 'Ajouter au panier');
                            
                            if (!user) {
                              // Si l'utilisateur n'est pas connecté, ouvrir directement la modal de connexion
                              if (onLoginClick) {
                                console.log('Ouverture de la modal de connexion');
                                onLoginClick();
                              } else {
                                console.warn('onLoginClick non défini');
                                showToast('Veuillez vous connecter pour ajouter des produits au panier.', 'warning');
                              }
                            } else {
                              // Si connecté, ajouter au panier
                              handleAddToCart(plat, e);
                            }
                          }}
                          style={{ 
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            minWidth: '120px'
                          }}
                          title={!user ? 'Cliquez pour vous connecter et ajouter au panier' : 'Cliquez pour ajouter ce plat au panier'}
                        >
                          {!user ? '🔐 Se connecter' : '➕ Ajouter'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-state" style={{ textAlign: 'center', padding: '2rem' }}>
                  <p>Aucun produit disponible pour le moment.</p>
                  <p>Veuillez réessayer plus tard.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Bandeau défilant des plats */}
      {plats.length > 0 && (
        <div className="plats-scrolling-banner">
          <div className="scrolling-content">
            {/* Dupliquer les plats pour un défilement continu */}
            {[...plats, ...plats, ...plats].map((plat, index) => (
              <span key={`${plat.id}-${index}`} className="scrolling-item">
                🍽️ {plat.nom} • {plat.prix ? `${Number(plat.prix).toFixed(0)} FCFA` : ''} •
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Section Avis et Évaluations */}
      {restaurant && restaurant.id && (
        <section style={{ 
          padding: '4rem 20px', 
          background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
          marginTop: '3rem'
        }}>
          <div className="container">
            <h2 style={{ 
              textAlign: 'center', 
              marginBottom: '3rem', 
              color: '#667eea',
              fontSize: '2.5rem',
              fontWeight: 300,
              letterSpacing: '0.05em'
            }}>
              ⭐ Avis Clients
            </h2>
            <ListeAvis restaurantId={restaurant.id} />
          </div>
        </section>
      )}

      {/* Footer avec WhatsAppButton fonctionnel */}
      <footer className="footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-section">
              <h3>livraison service fastfood</h3>
              <p>Votre restaurant en ligne de confiance</p>
              <p style={{ marginTop: '1rem', fontSize: '0.9rem', color: 'rgba(255, 255, 255, 0.7)' }}>
                Spécialités gabonaises et fastfood de qualité
              </p>
            </div>
            
            <div className="footer-section">
              <h4>Horaires d'ouverture</h4>
              <p>Lun - Ven : 9h - 20h</p>
              <p>Samedi : 10h - 18h</p>
              <p>Dimanche : Fermé</p>
              <p style={{ marginTop: '1rem', fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.6)' }}>
                Service de livraison disponible
              </p>
            </div>
            
            <div className="footer-section">
              <h4>Contact</h4>
              <p>📞 062998295</p>
              <p>📍 Quartier Louis, Libreville, Gabon</p>
              <p style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.7)' }}>
                Commandes en ligne au horaire d'ouverture
              </p>
              <div style={{ marginTop: '1rem' }}>
                <WhatsAppButton 
                  phoneNumber="+24162998295"
                  message="Bonjour, je souhaite commander sur livraison service fastfood."
                />
              </div>
            </div>
            
            <div className="footer-section">
              <h4>Informations</h4>
              <p>💳 Paiement sécurisé par Stripe</p>
              <p>🚚 Livraison rapide</p>
              <p style={{ marginTop: '1rem', fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.6)' }}>
                Application sécurisée et fiable
              </p>
            </div>
          </div>
          
          <div className="footer-bottom">
            <p>&copy; 2024 livraison service fastfood. Tous droits réservés.</p>
            <p style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>
              Développé par Minko Bidza hosny daryl pour le Gabon
            </p>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                scrollToTop(e);
              }}
              className="scroll-to-top-btn"
              title="Retour en haut"
              aria-label="Retour en haut de la page"
              style={{
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              ↑
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Accueil;
