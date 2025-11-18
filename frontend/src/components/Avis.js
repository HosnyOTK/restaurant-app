import React, { useState } from 'react';
import API_URL from '../config/api';

function Avis({ commandeId, restaurantId, onAvisCree, existingAvis }) {
  const [noteRestaurant, setNoteRestaurant] = useState(existingAvis?.note_restaurant || 0);
  const [noteLivraison, setNoteLivraison] = useState(existingAvis?.note_livraison || 0);
  const [commentaire, setCommentaire] = useState(existingAvis?.commentaire || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (noteRestaurant === 0) {
      setError('Veuillez noter le restaurant (minimum 1 étoile)');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const token = localStorage.getItem('token');
      const url = existingAvis ? `${API_URL}/avis/${existingAvis.id}` : `${API_URL}/avis`;
      const method = existingAvis ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          commande_id: commandeId,
          note_restaurant: noteRestaurant,
          note_livraison: noteLivraison > 0 ? noteLivraison : null,
          commentaire: commentaire.trim() || null
        })
      });

      if (response.ok) {
        setSuccess(true);
        if (onAvisCree) {
          const data = await response.json();
          onAvisCree(data.avis);
        }
        // Réinitialiser le formulaire si c'est une création
        if (!existingAvis) {
          setTimeout(() => {
            setNoteRestaurant(0);
            setNoteLivraison(0);
            setCommentaire('');
            setSuccess(false);
          }, 2000);
        }
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Erreur lors de l\'enregistrement de l\'avis');
      }
    } catch (err) {
      console.error('Erreur:', err);
      setError('Erreur de connexion. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (currentNote, onNoteChange, label) => {
    return (
      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
          {label} {currentNote > 0 && `(${currentNote}/5)`}
        </label>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => onNoteChange(star)}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '2rem',
                cursor: 'pointer',
                padding: 0,
                color: star <= currentNote ? '#ffc107' : '#ddd',
                transition: 'transform 0.2s',
              }}
              onMouseEnter={(e) => {
                if (!loading) e.currentTarget.style.transform = 'scale(1.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
              }}
              disabled={loading}
              title={`${star} étoile${star > 1 ? 's' : ''}`}
            >
              ★
            </button>
          ))}
          {currentNote === 0 && (
            <span style={{ color: '#666', fontSize: '0.9rem', marginLeft: '0.5rem' }}>
              (Optionnel pour la livraison)
            </span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div style={{
      background: '#f8f9fa',
      padding: '1.5rem',
      borderRadius: '8px',
      border: '1px solid #e0e0e0',
      marginTop: '1rem'
    }}>
      <h3 style={{ marginTop: 0, marginBottom: '1rem', color: '#667eea' }}>
        {existingAvis ? '✏️ Modifier votre avis' : '⭐ Laisser un avis'}
      </h3>

      <form onSubmit={handleSubmit}>
        {/* Note restaurant */}
        {renderStars(noteRestaurant, setNoteRestaurant, 'Note du restaurant *')}

        {/* Note livraison */}
        {renderStars(noteLivraison, setNoteLivraison, 'Note de la livraison')}

        {/* Commentaire unique */}
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
            Votre commentaire
          </label>
          <textarea
            value={commentaire}
            onChange={(e) => setCommentaire(e.target.value)}
            placeholder="Partagez votre expérience globale (restaurant, plats, livraison, service...)"
            rows="4"
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '2px solid #ddd',
              borderRadius: '4px',
              fontFamily: 'inherit',
              fontSize: '0.9rem',
              resize: 'vertical'
            }}
            disabled={loading}
          />
          <small style={{ display: 'block', marginTop: '0.5rem', color: '#666', fontSize: '0.85rem' }}>
            Vous pouvez commenter le restaurant, les plats, la livraison ou tout autre aspect de votre expérience
          </small>
        </div>

        {/* Messages d'erreur et succès */}
        {error && (
          <div style={{
            padding: '0.75rem',
            background: '#f8d7da',
            color: '#721c24',
            borderRadius: '4px',
            marginBottom: '1rem',
            fontSize: '0.9rem'
          }}>
            ⚠️ {error}
          </div>
        )}

        {success && (
          <div style={{
            padding: '0.75rem',
            background: '#d4edda',
            color: '#155724',
            borderRadius: '4px',
            marginBottom: '1rem',
            fontSize: '0.9rem'
          }}>
            ✅ {existingAvis ? 'Avis modifié avec succès !' : 'Avis enregistré avec succès ! Merci pour votre retour.'}
          </div>
        )}

        {/* Boutons */}
        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading || noteRestaurant === 0}
            style={{
              padding: '0.75rem 1.5rem',
              fontSize: '0.9rem',
              opacity: (loading || noteRestaurant === 0) ? 0.6 : 1,
              cursor: (loading || noteRestaurant === 0) ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? '⏳ Enregistrement...' : (existingAvis ? '💾 Modifier' : '✅ Envoyer l\'avis')}
          </button>
        </div>
      </form>
    </div>
  );
}

// Composant pour afficher les avis existants
export function ListeAvis({ restaurantId }) {
  const [avis, setAvis] = useState([]);
  const [statistiques, setStatistiques] = useState(null);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    chargerAvis();
  }, [restaurantId]);

  const chargerAvis = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/avis/restaurant/${restaurantId}`);
      
      if (response.ok) {
        const data = await response.json();
        setAvis(data.avis || []);
        setStatistiques(data.statistiques || null);
      }
      setLoading(false);
    } catch (error) {
      console.error('Erreur lors du chargement des avis:', error);
      setLoading(false);
    }
  };

  const renderStars = (note) => {
    return (
      <div style={{ display: 'flex', gap: '0.25rem' }}>
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            style={{
              fontSize: '1.2rem',
              color: star <= note ? '#ffc107' : '#ddd'
            }}
          >
            ★
          </span>
        ))}
      </div>
    );
  };

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Chargement des avis...</div>;
  }

  return (
    <div>
      {/* Statistiques */}
      {statistiques && statistiques.total > 0 && (
        <div style={{
          display: 'flex',
          gap: '1rem',
          marginBottom: '2rem',
          flexWrap: 'wrap'
        }}>
          <div style={{
            background: '#667eea',
            color: 'white',
            padding: '1rem',
            borderRadius: '8px',
            flex: 1,
            minWidth: '200px'
          }}>
            <p style={{ margin: 0, fontSize: '0.9rem', opacity: 0.9 }}>Note moyenne restaurant</p>
            <p style={{ margin: '0.5rem 0 0 0', fontSize: '1.5rem', fontWeight: 'bold' }}>
              {renderStars(Math.round(parseFloat(statistiques.moyenne_restaurant)))}
              <span style={{ fontSize: '1rem', marginLeft: '0.5rem' }}>
                {statistiques.moyenne_restaurant}/5 ({statistiques.total} avis)
              </span>
            </p>
          </div>
          {statistiques.moyenne_livraison > 0 && (
            <div style={{
              background: '#28a745',
              color: 'white',
              padding: '1rem',
              borderRadius: '8px',
              flex: 1,
              minWidth: '200px'
            }}>
              <p style={{ margin: 0, fontSize: '0.9rem', opacity: 0.9 }}>Note moyenne livraison</p>
              <p style={{ margin: '0.5rem 0 0 0', fontSize: '1.5rem', fontWeight: 'bold' }}>
                {renderStars(Math.round(parseFloat(statistiques.moyenne_livraison)))}
                <span style={{ fontSize: '1rem', marginLeft: '0.5rem' }}>
                  {statistiques.moyenne_livraison}/5
                </span>
              </p>
            </div>
          )}
        </div>
      )}

      {/* Liste des avis */}
      {avis.length === 0 ? (
        <div style={{
          padding: '3rem',
          textAlign: 'center',
          background: '#f8f9fa',
          borderRadius: '8px',
          border: '1px solid #e0e0e0'
        }}>
          <p style={{ color: '#666', fontSize: '1.1rem' }}>
            Aucun avis pour le moment. Soyez le premier à noter !
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {avis.map((a) => (
            <div
              key={a.id}
              style={{
                background: 'white',
                padding: '1.5rem',
                borderRadius: '8px',
                border: '1px solid #e0e0e0',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div>
                  <strong style={{ color: '#667eea' }}>
                    {a.client_prenom} {a.client_nom}
                  </strong>
                  <p style={{ margin: '0.25rem 0', color: '#666', fontSize: '0.85rem' }}>
                    {new Date(a.date_avis).toLocaleDateString('fr-FR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
                <div>
                  {renderStars(a.note_restaurant)}
                </div>
              </div>

              {a.commentaire && (
                <p style={{ marginBottom: '1rem', color: '#333', lineHeight: '1.6', fontStyle: 'italic' }}>
                  "{a.commentaire}"
                </p>
              )}

              {a.note_livraison && (
                <div style={{
                  marginTop: '1rem',
                  paddingTop: '1rem',
                  borderTop: '1px solid #eee'
                }}>
                  <p style={{ marginBottom: '0.5rem', fontSize: '0.9rem', color: '#666' }}>
                    <strong>Note livraison:</strong> {renderStars(a.note_livraison)}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Avis;

