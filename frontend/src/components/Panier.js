import React from 'react';
import { useToast } from './ToastNotification';

function Panier({ panier, restaurant, onClose, onModifierQuantite, onRetirer, total, onCommander, user }) {
  const { showToast } = useToast();

  const handleRetirer = (itemId, itemNom) => {
    onRetirer(itemId);
    showToast(`${itemNom} retiré du panier`, 'info');
  };

  return (
    <div 
      className="panier-overlay" 
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
        padding: '1rem',
        backdropFilter: 'blur(5px)'
      }}
    >
      <div 
        className="panier-modal" 
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'white',
          borderRadius: '20px',
          width: '100%',
          maxWidth: '600px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
          overflow: 'hidden',
          animation: 'slideInUp 0.3s ease-out'
        }}
      >
        {/* Header avec gradient */}
        <div 
          className="panier-header"
          style={{
            background: 'linear-gradient(135deg, var(--color-primary) 0%, #8FB99A 100%)',
            color: 'white',
            padding: '1.5rem 2rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          {/* Effet décoratif */}
          <div style={{
            position: 'absolute',
            top: '-50%',
            right: '-50%',
            width: '200%',
            height: '200%',
            background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
            pointerEvents: 'none'
          }} />
          
          <h2 
            className="panier-title"
            style={{
              margin: 0,
              fontSize: '1.75rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              position: 'relative',
              zIndex: 1
            }}
          >
            <span style={{ fontSize: '1.5rem' }}>🛒</span>
            Mon Panier
            {panier.length > 0 && (
              <span style={{
                background: 'rgba(255, 255, 255, 0.3)',
                padding: '0.25rem 0.75rem',
                borderRadius: '20px',
                fontSize: '0.9rem',
                fontWeight: 600,
                backdropFilter: 'blur(10px)'
              }}>
                {panier.length} {panier.length === 1 ? 'article' : 'articles'}
              </span>
            )}
          </h2>
          <button 
            className="close-btn" 
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              border: 'none',
              color: 'white',
              fontSize: '2rem',
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.3s ease',
              position: 'relative',
              zIndex: 1,
              lineHeight: 1
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'rgba(255, 255, 255, 0.3)';
              e.target.style.transform = 'rotate(90deg) scale(1.1)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'rgba(255, 255, 255, 0.2)';
              e.target.style.transform = 'rotate(0deg) scale(1)';
            }}
          >
            ×
          </button>
        </div>

        {/* Contenu scrollable */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '1.5rem 2rem'
        }}>
          {panier.length === 0 ? (
            <div 
              className="empty-state"
              style={{
                textAlign: 'center',
                padding: '4rem 2rem',
                color: '#666'
              }}
            >
              <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🛒</div>
              <p style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem', color: '#333' }}>
                Votre panier est vide
              </p>
              <p style={{ fontSize: '0.95rem', color: '#999' }}>
                Ajoutez des produits pour commencer vos achats
              </p>
            </div>
          ) : (
            <>
              {restaurant && (
                <div style={{
                  marginBottom: '1.5rem',
                  padding: '1rem 1.25rem',
                  background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
                  borderRadius: '12px',
                  border: '1px solid #e0e0e0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem'
                }}>
                  <span style={{ fontSize: '1.5rem' }}>🏪</span>
                  <div>
                    <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '0.25rem' }}>
                      Restaurant
                    </div>
                    <strong style={{ color: '#333', fontSize: '1.1rem' }}>{restaurant.nom}</strong>
                  </div>
                </div>
              )}
              
              <div className="panier-items" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {panier.map((item, index) => (
                  <div 
                    key={item.id} 
                    className="panier-item"
                    style={{
                      background: 'white',
                      border: '2px solid #f0f0f0',
                      borderRadius: '16px',
                      padding: '1.25rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '1rem',
                      transition: 'all 0.3s ease',
                      animation: `fadeInUp 0.4s ease-out ${index * 0.1}s both`,
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'var(--color-primary)';
                      e.currentTarget.style.boxShadow = '0 4px 16px rgba(107, 159, 120, 0.2)';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#f0f0f0';
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.05)';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    <div 
                      className="panier-item-info"
                      style={{ flex: 1, minWidth: 0 }}
                    >
                      <div 
                        className="panier-item-nom"
                        style={{
                          fontSize: '1.1rem',
                          fontWeight: 600,
                          color: '#333',
                          marginBottom: '0.5rem',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {item.nom}
                      </div>
                      <div 
                        className="panier-item-prix"
                        style={{
                          fontSize: '1.25rem',
                          fontWeight: 700,
                          color: 'var(--color-primary)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem'
                        }}
                      >
                        <span>{parseFloat(item.prix).toFixed(0)}</span>
                        <span style={{ fontSize: '0.9rem', fontWeight: 500, color: '#666' }}>FCFA</span>
                      </div>
                    </div>
                    
                    <div 
                      className="panier-item-actions"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem'
                      }}
                    >
                      <div 
                        className="quantite-controls"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.75rem',
                          background: '#f8f9fa',
                          borderRadius: '12px',
                          padding: '0.5rem',
                          border: '2px solid #e9ecef'
                        }}
                      >
                        <button
                          className="quantite-btn"
                          onClick={() => onModifierQuantite(item.id, -1)}
                          style={{
                            background: 'white',
                            border: '2px solid #e9ecef',
                            borderRadius: '8px',
                            width: '36px',
                            height: '36px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            fontSize: '1.25rem',
                            fontWeight: 600,
                            color: '#333',
                            transition: 'all 0.2s ease',
                            lineHeight: 1
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.background = 'var(--color-primary)';
                            e.target.style.borderColor = 'var(--color-primary)';
                            e.target.style.color = 'white';
                            e.target.style.transform = 'scale(1.1)';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.background = 'white';
                            e.target.style.borderColor = '#e9ecef';
                            e.target.style.color = '#333';
                            e.target.style.transform = 'scale(1)';
                          }}
                        >
                          −
                        </button>
                        <span 
                          className="quantite"
                          style={{
                            fontSize: '1.1rem',
                            fontWeight: 700,
                            color: '#333',
                            minWidth: '30px',
                            textAlign: 'center'
                          }}
                        >
                          {item.quantite}
                        </span>
                        <button
                          className="quantite-btn"
                          onClick={() => onModifierQuantite(item.id, 1)}
                          style={{
                            background: 'white',
                            border: '2px solid #e9ecef',
                            borderRadius: '8px',
                            width: '36px',
                            height: '36px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            fontSize: '1.25rem',
                            fontWeight: 600,
                            color: '#333',
                            transition: 'all 0.2s ease',
                            lineHeight: 1
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.background = 'var(--color-primary)';
                            e.target.style.borderColor = 'var(--color-primary)';
                            e.target.style.color = 'white';
                            e.target.style.transform = 'scale(1.1)';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.background = 'white';
                            e.target.style.borderColor = '#e9ecef';
                            e.target.style.color = '#333';
                            e.target.style.transform = 'scale(1)';
                          }}
                        >
                          +
                        </button>
                      </div>
                      
                      <button
                        className="delete-btn"
                        onClick={() => handleRetirer(item.id, item.nom)}
                        title="Retirer du panier"
                        style={{
                          background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%)',
                          border: 'none',
                          borderRadius: '10px',
                          width: '44px',
                          height: '44px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          fontSize: '1.25rem',
                          transition: 'all 0.3s ease',
                          boxShadow: '0 2px 8px rgba(255, 107, 107, 0.3)'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.transform = 'scale(1.1) rotate(15deg)';
                          e.target.style.boxShadow = '0 4px 16px rgba(255, 107, 107, 0.5)';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.transform = 'scale(1) rotate(0deg)';
                          e.target.style.boxShadow = '0 2px 8px rgba(255, 107, 107, 0.3)';
                        }}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Footer avec total et bouton */}
        {panier.length > 0 && (
          <div style={{
            borderTop: '2px solid #f0f0f0',
            padding: '1.5rem 2rem',
            background: 'linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)'
          }}>
            <div 
              className="panier-total"
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1.5rem',
                padding: '1rem 1.25rem',
                background: 'linear-gradient(135deg, var(--color-primary) 0%, #8FB99A 100%)',
                borderRadius: '12px',
                color: 'white'
              }}
            >
              <span style={{ fontSize: '1.1rem', fontWeight: 600 }}>Total:</span>
              <span style={{ fontSize: '1.75rem', fontWeight: 700 }}>
                {total.toFixed(0)} <span style={{ fontSize: '1rem', fontWeight: 500 }}>FCFA</span>
              </span>
            </div>

            <div className="panier-actions">
              <button
                className="btn-commander"
                onClick={onCommander}
                style={{
                  width: '100%',
                  padding: '1rem 2rem',
                  background: user 
                    ? 'linear-gradient(135deg, var(--color-primary) 0%, #8FB99A 100%)'
                    : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '1.1rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 16px rgba(107, 159, 120, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.75rem'
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 6px 20px rgba(107, 159, 120, 0.5)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 4px 16px rgba(107, 159, 120, 0.4)';
                }}
              >
                <span>{user ? '✅' : '🔐'}</span>
                <span>{user ? 'Passer la commande' : 'Se connecter pour commander'}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes slideInUp {
          from {
            transform: translateY(50px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        @keyframes fadeInUp {
          from {
            transform: translateY(20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}

export default Panier;

