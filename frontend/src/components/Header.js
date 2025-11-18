import React, { useEffect, useState } from 'react';
import { useToast, ToastContainer } from './ToastNotification';
import Logo from './Logo';

function Header({ panierCount, onPanierClick, user, onLoginClick, onLogout, onAccueilClick, onMenuClick, onCommandesClick, onLivreurClick, restaurantActuel }) {
  // Si l'utilisateur n'est pas connecté, le panier est vide
  const displayPanierCount = user ? panierCount : 0;
  const [scrolled, setScrolled] = useState(false);
  
  // Système de notifications toast
  const { toasts, showToast, removeToast } = useToast();

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 50;
      setScrolled(isScrolled);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`header ${scrolled ? 'scrolled' : ''}`}>
      <div className="header-content">
        <Logo onClick={onAccueilClick} variant="light" size="small" />
        <div className="header-actions">
          <button className="btn btn-secondary" onClick={onAccueilClick}>
            Accueil
          </button>
          {user && user.role !== 'admin' && (
            <button className="btn btn-secondary" onClick={onMenuClick}>
              📋 Menu
            </button>
          )}
          {restaurantActuel && (
            <span style={{ color: 'var(--color-primary)', padding: '0 0.5rem', fontSize: '0.7rem', letterSpacing: '0.5px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '150px' }}>
              {restaurantActuel.nom}
            </span>
          )}
          {user && (
            <>
              {user.role !== 'admin' && (
                <button className="btn btn-secondary" onClick={onCommandesClick}>
                  Commandes
                </button>
              )}
            </>
          )}
          {user && user.role !== 'admin' && (
            <button 
              className="btn btn-panier" 
              onClick={() => {
                if (!user) {
                  showToast('Vous devez être connecté pour accéder au panier.', 'warning');
                  onLoginClick();
                } else {
                  onPanierClick();
                }
              }}
              title={!user ? 'Connectez-vous pour accéder au panier' : 'Voir le panier'}
            >
              Panier
              {displayPanierCount > 0 && (
                <span className="panier-badge">{displayPanierCount}</span>
              )}
            </button>
          )}
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', flexShrink: 0 }}>
              <span style={{ color: 'var(--color-secondary)', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>
                {user.prenom}
              </span>
              <button className="btn btn-secondary" onClick={onLogout}>
                Déconnexion
              </button>
            </div>
          ) : (
            <button className="btn btn-primary" onClick={onLoginClick}>
              Connexion
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;
