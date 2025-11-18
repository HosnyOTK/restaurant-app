import React, { useState } from 'react';
import API_URL from '../config/api';

function Connexion({ onClose, onLogin, onSwitchToInscription }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        onLogin(data.client, data.token);
        onClose();
      } else {
        setError(data.error || 'Erreur de connexion');
      }
    } catch (error) {
      console.error('Erreur:', error);
      setError('Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ 
        maxWidth: '500px', 
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        <div className="modal-header" style={{ flexShrink: 0 }}>
          <h2 className="modal-title">Connexion</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} style={{ 
          overflowY: 'auto', 
          overflowX: 'hidden',
          flex: 1,
          paddingRight: '0.5rem'
        }}>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Mot de passe</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="form-actions">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ width: '100%' }}
            >
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onSwitchToInscription}
              style={{ 
                width: '100%', 
                marginTop: '0.5rem',
                background: 'transparent',
                border: '1px solid #ddd',
                color: 'var(--color-primary)'
              }}
            >
              Pas encore de compte ? S'inscrire
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Connexion;



