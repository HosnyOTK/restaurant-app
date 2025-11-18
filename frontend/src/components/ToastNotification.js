import React, { useState, useEffect } from 'react';

// Hook pour utiliser les notifications dans n'importe quel composant
export const useToast = () => {
  const [toasts, setToasts] = useState([]);

  const showToast = (message, type = 'info') => {
    const id = Date.now();
    const toast = { id, message, type };
    setToasts(prev => [...prev, toast]);
    
    // Supprimer automatiquement après 5 secondes
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
    
    return id;
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return { toasts, showToast, removeToast };
};

// Composant pour afficher les toasts
export function ToastContainer({ toasts, onRemove }) {
  const getToastStyles = (type) => {
    const styles = {
      error: {
        background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%)',
        color: '#ffffff',
        border: 'none',
        iconBg: 'rgba(255, 255, 255, 0.2)',
        shadow: '0 8px 24px rgba(255, 107, 107, 0.4)'
      },
      success: {
        background: 'linear-gradient(135deg, #51cf66 0%, #40c057 100%)',
        color: '#ffffff',
        border: 'none',
        iconBg: 'rgba(255, 255, 255, 0.2)',
        shadow: '0 8px 24px rgba(81, 207, 102, 0.4)'
      },
      warning: {
        background: 'linear-gradient(135deg, #ffd43b 0%, #fcc419 100%)',
        color: '#2b2b2b',
        border: 'none',
        iconBg: 'rgba(43, 43, 43, 0.1)',
        shadow: '0 8px 24px rgba(255, 212, 59, 0.4)'
      },
      info: {
        background: 'linear-gradient(135deg, #4dabf7 0%, #339af0 100%)',
        color: '#ffffff',
        border: 'none',
        iconBg: 'rgba(255, 255, 255, 0.2)',
        shadow: '0 8px 24px rgba(77, 171, 247, 0.4)'
      }
    };
    return styles[type] || styles.info;
  };

  const getIcon = (type) => {
    const icons = {
      error: '✕',
      success: '✓',
      warning: '⚠',
      info: 'ℹ'
    };
    return icons[type] || icons.info;
  };

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      zIndex: 10000,
      display: 'flex',
      flexDirection: 'column',
      gap: '1rem',
      maxWidth: '420px',
      pointerEvents: 'none'
    }}>
      {toasts.map(toast => {
        const styles = getToastStyles(toast.type);
        return (
          <div
            key={toast.id}
            style={{
              background: styles.background,
              color: styles.color,
              border: styles.border,
              padding: '1.25rem 1.5rem',
              borderRadius: '16px',
              boxShadow: styles.shadow,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem',
              pointerEvents: 'auto',
              animation: 'slideInRight 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
              position: 'relative',
              overflow: 'hidden',
              backdropFilter: 'blur(10px)',
              minWidth: '320px',
              maxWidth: '420px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateX(-4px)';
              e.currentTarget.style.boxShadow = styles.shadow.replace('0.4', '0.6');
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateX(0)';
              e.currentTarget.style.boxShadow = styles.shadow;
            }}
          >
            {/* Effet de brillance animé */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: '-100%',
              width: '100%',
              height: '100%',
              background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent)',
              animation: 'shimmer 3s infinite'
            }} />
            
            {/* Icône dans un cercle */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: styles.iconBg,
              flexShrink: 0,
              fontSize: '1.25rem',
              fontWeight: 'bold',
              backdropFilter: 'blur(10px)'
            }}>
              {getIcon(toast.type)}
            </div>
            
            {/* Message */}
            <div style={{ 
              flex: 1, 
              fontWeight: 500,
              fontSize: '0.95rem',
              lineHeight: '1.5',
              position: 'relative',
              zIndex: 1
            }}>
              {toast.message}
            </div>
            
            {/* Bouton de fermeture */}
            <button
              onClick={() => onRemove(toast.id)}
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                border: 'none',
                fontSize: '1.25rem',
                cursor: 'pointer',
                color: 'inherit',
                opacity: 0.8,
                padding: '0.25rem',
                width: '28px',
                height: '28px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                lineHeight: 1,
                borderRadius: '50%',
                flexShrink: 0,
                transition: 'all 0.2s ease',
                position: 'relative',
                zIndex: 1
              }}
              onMouseEnter={(e) => {
                e.target.style.opacity = 1;
                e.target.style.background = 'rgba(255, 255, 255, 0.3)';
                e.target.style.transform = 'rotate(90deg) scale(1.1)';
              }}
              onMouseLeave={(e) => {
                e.target.style.opacity = 0.8;
                e.target.style.background = 'rgba(255, 255, 255, 0.2)';
                e.target.style.transform = 'rotate(0deg) scale(1)';
              }}
            >
              ×
            </button>
          </div>
        );
      })}
      <style>{`
        @keyframes slideInRight {
          from {
            transform: translateX(120%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        @keyframes shimmer {
          0% {
            left: -100%;
          }
          50%, 100% {
            left: 100%;
          }
        }
      `}</style>
    </div>
  );
}

export default ToastContainer;

