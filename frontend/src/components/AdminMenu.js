import React, { useState, useEffect } from 'react';
import { useToast, ToastContainer } from './ToastNotification';
import API_URL from '../config/api';

function AdminMenu({ user, restaurantId = 1 }) {
  const [categories, setCategories] = useState([]);
  const [plats, setPlats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('plats'); // plats, categories
  const [searchQuery, setSearchQuery] = useState('');
  const [showFormPlat, setShowFormPlat] = useState(false);
  const [showFormCategorie, setShowFormCategorie] = useState(false);
  const [editingPlat, setEditingPlat] = useState(null);
  const [editingCategorie, setEditingCategorie] = useState(null);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null); // { type: 'plat' | 'categorie', id: number, nom: string }
  
  // Système de notifications toast
  const { toasts, showToast, removeToast } = useToast();
  
  // Filtrage par recherche
  const platsFiltered = plats.filter(plat => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      plat.nom.toLowerCase().includes(query) ||
      (plat.description && plat.description.toLowerCase().includes(query)) ||
      (plat.categorie_nom && plat.categorie_nom.toLowerCase().includes(query))
    );
  });

  // Pagination pour les plats
  const [currentPagePlats, setCurrentPagePlats] = useState(1);
  const itemsPerPage = 10;
  const totalPagesPlats = Math.ceil(platsFiltered.length / itemsPerPage);
  const startIndexPlats = (currentPagePlats - 1) * itemsPerPage;
  const endIndexPlats = startIndexPlats + itemsPerPage;
  const platsToDisplay = platsFiltered.slice(startIndexPlats, endIndexPlats);

  useEffect(() => {
    chargerDonnees();
  }, []);

  // Réinitialiser la page quand on change d'onglet, recharge les données ou change la recherche
  useEffect(() => {
    setCurrentPagePlats(1);
  }, [activeTab, plats.length, searchQuery]);

  const chargerDonnees = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };

      // Charger les catégories
      const catRes = await fetch(`${API_URL}/menu/restaurant/${restaurantId}/categories`, { headers });
      const catData = await catRes.json();
      setCategories(catData);

      // Charger tous les plats (y compris non disponibles) pour l'admin
      const platsRes = await fetch(`${API_URL}/menu/restaurant/${restaurantId}/plats/all`, { headers });
      const platsData = await platsRes.json();
      setPlats(platsData);

      setLoading(false);
    } catch (error) {
      console.error('Erreur:', error);
      setLoading(false);
    }
  };

  const supprimerPlat = (id) => {
    const plat = plats.find(p => p.id === id);
    setItemToDelete({ type: 'plat', id, nom: plat?.nom || 'ce plat' });
    setShowConfirmDelete(true);
  };

  const confirmerSuppression = async () => {
    if (!itemToDelete) return;

    try {
      const token = localStorage.getItem('token');
      const endpoint = itemToDelete.type === 'plat' 
        ? `${API_URL}/menu/plats/${itemToDelete.id}`
        : `${API_URL}/menu/categories/${itemToDelete.id}`;
      
      const response = await fetch(endpoint, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        chargerDonnees();
        setShowConfirmDelete(false);
        setItemToDelete(null);
      } else {
        const error = await response.json();
        showToast('Erreur: ' + (error.error || 'Impossible de supprimer'), 'error');
      }
    } catch (error) {
      console.error('Erreur:', error);
      showToast('Erreur lors de la suppression', 'error');
    }
  };

  const supprimerCategorie = (id) => {
    const categorie = categories.find(c => c.id === id);
    setItemToDelete({ type: 'categorie', id, nom: categorie?.nom || 'cette catégorie' });
    setShowConfirmDelete(true);
  };

  if (loading) {
    return (
      <div className="container" style={{ padding: '2rem', textAlign: 'center' }}>
        <p>Chargement...</p>
      </div>
    );
  }

  return (
    <div className="admin-menu">
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <div className="container">
        <h1 style={{ marginBottom: '2rem' }}>Gestion du Menu</h1>

        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '2px solid #eee' }}>
          <button
            className={`btn ${activeTab === 'plats' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('plats')}
          >
            Plats ({plats.length})
          </button>
          <button
            className={`btn ${activeTab === 'categories' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('categories')}
          >
            Catégories ({categories.length})
          </button>
        </div>

        {activeTab === 'plats' && (
          <div>
            <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2>Plats</h2>
              <button 
                className="btn btn-primary" 
                onClick={() => {
                  setEditingPlat(null);
                  setShowFormPlat(true);
                }}
              >
                ➕ Ajouter un plat
              </button>
            </div>

            {/* Barre de recherche */}
            <div style={{ 
              marginBottom: '1.5rem',
              position: 'relative',
              maxWidth: '500px'
            }}>
              <input
                type="text"
                placeholder="🔍 Rechercher un plat..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem 0.75rem 3rem',
                  fontSize: '1rem',
                  border: '2px solid #ddd',
                  borderRadius: '25px',
                  outline: 'none',
                  transition: 'all 0.3s'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'var(--color-primary)';
                  e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#ddd';
                  e.target.style.boxShadow = 'none';
                }}
              />
              <span style={{
                position: 'absolute',
                left: '1rem',
                top: '50%',
                transform: 'translateY(-50%)',
                fontSize: '1.2rem',
                color: '#666'
              }}>
                🔍
              </span>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  style={{
                    position: 'absolute',
                    right: '1rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    fontSize: '1.2rem',
                    cursor: 'pointer',
                    color: '#666'
                  }}
                >
                  ✕
                </button>
              )}
            </div>

            {showFormPlat && (
              <FormPlat
                restaurantId={restaurantId}
                categories={categories}
                plat={editingPlat}
                onClose={() => {
                  setShowFormPlat(false);
                  setEditingPlat(null);
                }}
                onSuccess={() => {
                  setShowFormPlat(false);
                  setEditingPlat(null);
                  chargerDonnees();
                }}
              />
            )}

            <div style={{ display: 'grid', gap: '1rem', marginTop: '1rem' }}>
              {platsFiltered.length === 0 ? (
                <div className="empty-state">
                  <p>{searchQuery ? `Aucun plat trouvé pour "${searchQuery}"` : 'Aucun plat enregistré'}</p>
                </div>
              ) : (
                <>
                  {platsToDisplay.map(plat => (
                  <div key={plat.id} className="commande-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: '1rem' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'start' }}>
                          {plat.image_url && (
                            <img 
                              src={plat.image_url.startsWith('http') ? plat.image_url : `http://localhost:5000${plat.image_url}`}
                              alt={plat.nom}
                              style={{ 
                                width: '100px', 
                                height: '100px', 
                                objectFit: 'cover', 
                                borderRadius: '8px',
                                border: '1px solid #ddd'
                              }}
                              onError={(e) => {
                                e.target.style.display = 'none';
                              }}
                            />
                          )}
                          <div style={{ flex: 1 }}>
                            <h3>{plat.nom}</h3>
                            <p style={{ color: '#666', marginTop: '0.5rem' }}>{plat.description || 'Aucune description'}</p>
                            <div style={{ marginTop: '0.5rem', display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
                              <p>
                                <strong>Prix:</strong> <span style={{ color: '#17a2b8', fontWeight: 'bold' }}>{parseFloat(plat.prix).toFixed(0)} FCFA</span>
                              </p>
                              <p>
                                <strong>Catégorie:</strong> {plat.categorie_nom || 'Aucune'}
                              </p>
                              <p>
                                <strong>Disponible:</strong> 
                                <span style={{ color: plat.disponible ? '#28a745' : '#dc3545', fontWeight: 'bold', marginLeft: '0.5rem' }}>
                                  {plat.disponible ? '✓ Oui' : '✗ Non'}
                                </span>
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div style={{ 
                        display: 'flex', 
                        flexDirection: 'column', 
                        gap: '0.75rem', 
                        alignItems: 'flex-end',
                        minWidth: '140px'
                      }}>
                        <button
                          className="btn btn-secondary"
                          onClick={() => {
                            setEditingPlat(plat);
                            setShowFormPlat(true);
                          }}
                          style={{ 
                            fontSize: '0.9rem', 
                            padding: '0.75rem 1.25rem',
                            background: 'var(--color-secondary)',
                            color: 'var(--color-white)',
                            border: '1px solid var(--color-secondary)',
                            borderRadius: '10px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            boxShadow: 'var(--shadow-soft)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            width: '100%',
                            justifyContent: 'center'
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.transform = 'translateY(-2px)';
                            e.target.style.boxShadow = 'var(--shadow-medium)';
                            e.target.style.background = 'var(--color-primary)';
                            e.target.style.borderColor = 'var(--color-primary)';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.transform = 'translateY(0)';
                            e.target.style.boxShadow = 'var(--shadow-soft)';
                            e.target.style.background = 'var(--color-secondary)';
                            e.target.style.borderColor = 'var(--color-secondary)';
                          }}
                        >
                          <span>✏️</span>
                          <span>Modifier</span>
                        </button>
                        <button
                          className="btn btn-secondary"
                          onClick={() => supprimerPlat(plat.id)}
                          style={{ 
                            background: 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)',
                            color: 'white', 
                            border: 'none',
                            fontSize: '0.9rem', 
                            padding: '0.75rem 1.25rem',
                            borderRadius: '10px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            boxShadow: '0 4px 15px rgba(220, 53, 69, 0.3)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            width: '100%',
                            justifyContent: 'center'
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.transform = 'translateY(-2px)';
                            e.target.style.boxShadow = '0 6px 20px rgba(220, 53, 69, 0.4)';
                            e.target.style.background = 'linear-gradient(135deg, #c82333 0%, #bd2130 100%)';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.transform = 'translateY(0)';
                            e.target.style.boxShadow = '0 4px 15px rgba(220, 53, 69, 0.3)';
                            e.target.style.background = 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)';
                          }}
                        >
                          <span>🗑️</span>
                          <span>Supprimer</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                {/* Pagination */}
                {totalPagesPlats > 1 && (
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'center', 
                    alignItems: 'center', 
                    gap: '0.5rem', 
                    marginTop: '2rem',
                    padding: '1rem',
                    gridColumn: '1 / -1'
                  }}>
                    <button
                      className="btn btn-secondary"
                      onClick={() => setCurrentPagePlats(prev => Math.max(1, prev - 1))}
                      disabled={currentPagePlats === 1}
                      style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}
                    >
                      ← Précédent
                    </button>
                    <span style={{ padding: '0 1rem', color: 'var(--color-secondary)' }}>
                      Page {currentPagePlats} sur {totalPagesPlats}
                    </span>
                    <button
                      className="btn btn-secondary"
                      onClick={() => setCurrentPagePlats(prev => Math.min(totalPagesPlats, prev + 1))}
                      disabled={currentPagePlats === totalPagesPlats}
                      style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}
                    >
                      Suivant →
                    </button>
                  </div>
                )}
                </>
              )}
            </div>
          </div>
        )}

        {activeTab === 'categories' && (
          <div>
            <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between' }}>
              <h2>Catégories</h2>
              <button
                className="btn btn-primary"
                onClick={() => {
                  setEditingCategorie(null);
                  setShowFormCategorie(true);
                }}
              >
                + Ajouter une catégorie
              </button>
            </div>

            {showFormCategorie && (
              <FormCategorie
                restaurantId={restaurantId}
                categorie={editingCategorie}
                onClose={() => {
                  setShowFormCategorie(false);
                  setEditingCategorie(null);
                }}
                onSuccess={() => {
                  setShowFormCategorie(false);
                  setEditingCategorie(null);
                  chargerDonnees();
                }}
              />
            )}

            <div style={{ display: 'grid', gap: '1rem', marginTop: '1rem' }}>
              {categories.length === 0 ? (
                <div className="empty-state">
                  <p>Aucune catégorie enregistrée</p>
                </div>
              ) : (
                categories.map(categorie => (
                  <div key={categorie.id} className="commande-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: '1rem' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'start' }}>
                          {categorie.image_url && (
                            <img 
                              src={categorie.image_url.startsWith('http') ? categorie.image_url : `http://localhost:5000${categorie.image_url}`}
                              alt={categorie.nom}
                              style={{ 
                                width: '100px', 
                                height: '100px', 
                                objectFit: 'cover', 
                                borderRadius: '8px',
                                border: '1px solid #ddd'
                              }}
                              onError={(e) => {
                                e.target.style.display = 'none';
                              }}
                            />
                          )}
                          <div style={{ flex: 1 }}>
                            <h3>{categorie.nom}</h3>
                            <p style={{ color: '#666', marginTop: '0.5rem' }}>{categorie.description || 'Aucune description'}</p>
                            <p style={{ marginTop: '0.5rem' }}>
                              <strong>Ordre d'affichage:</strong> {categorie.ordre || 0}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div style={{ 
                        display: 'flex', 
                        flexDirection: 'column', 
                        gap: '0.75rem', 
                        alignItems: 'flex-end',
                        minWidth: '140px'
                      }}>
                        <button
                          className="btn btn-secondary"
                          onClick={() => {
                            setEditingCategorie(categorie);
                            setShowFormCategorie(true);
                          }}
                          style={{ 
                            fontSize: '0.9rem', 
                            padding: '0.75rem 1.25rem',
                            background: 'var(--color-secondary)',
                            color: 'var(--color-white)',
                            border: '1px solid var(--color-secondary)',
                            borderRadius: '10px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            boxShadow: 'var(--shadow-soft)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            width: '100%',
                            justifyContent: 'center'
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.transform = 'translateY(-2px)';
                            e.target.style.boxShadow = 'var(--shadow-medium)';
                            e.target.style.background = 'var(--color-primary)';
                            e.target.style.borderColor = 'var(--color-primary)';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.transform = 'translateY(0)';
                            e.target.style.boxShadow = 'var(--shadow-soft)';
                            e.target.style.background = 'var(--color-secondary)';
                            e.target.style.borderColor = 'var(--color-secondary)';
                          }}
                        >
                          <span>✏️</span>
                          <span>Modifier</span>
                        </button>
                        <button
                          className="btn btn-secondary"
                          onClick={() => supprimerCategorie(categorie.id)}
                          style={{ 
                            background: 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)',
                            color: 'white', 
                            border: 'none',
                            fontSize: '0.9rem', 
                            padding: '0.75rem 1.25rem',
                            borderRadius: '10px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            boxShadow: '0 4px 15px rgba(220, 53, 69, 0.3)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            width: '100%',
                            justifyContent: 'center'
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.transform = 'translateY(-2px)';
                            e.target.style.boxShadow = '0 6px 20px rgba(220, 53, 69, 0.4)';
                            e.target.style.background = 'linear-gradient(135deg, #c82333 0%, #bd2130 100%)';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.transform = 'translateY(0)';
                            e.target.style.boxShadow = '0 4px 15px rgba(220, 53, 69, 0.3)';
                            e.target.style.background = 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)';
                          }}
                        >
                          <span>🗑️</span>
                          <span>Supprimer</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Modale de confirmation de suppression */}
        {showConfirmDelete && itemToDelete && (
          <div 
            className="modal-overlay" 
            onClick={() => {
              setShowConfirmDelete(false);
              setItemToDelete(null);
            }}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              padding: '1rem'
            }}
          >
            <div 
              className="modal" 
              onClick={(e) => e.stopPropagation()} 
              style={{ 
                maxWidth: '500px',
                width: '100%',
                background: 'white',
                borderRadius: '12px',
                boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
                padding: '2rem'
              }}
            >
              <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                <div style={{ 
                  fontSize: '4rem', 
                  marginBottom: '1rem',
                  lineHeight: 1
                }}>
                  ⚠️
                </div>
                <h2 style={{ 
                  margin: 0, 
                  fontSize: '1.5rem', 
                  fontWeight: 600,
                  color: '#333',
                  marginBottom: '0.5rem'
                }}>
                  Confirmer la suppression
                </h2>
                <p style={{ 
                  color: '#666', 
                  fontSize: '1rem',
                  margin: 0,
                  lineHeight: 1.5
                }}>
                  Êtes-vous sûr de vouloir supprimer <strong>{itemToDelete.nom}</strong> ?
                </p>
                {itemToDelete.type === 'plat' ? (
                  <p style={{ 
                    color: '#dc3545', 
                    fontSize: '0.9rem',
                    marginTop: '0.5rem',
                    fontWeight: 500
                  }}>
                    Cette action est irréversible.
                  </p>
                ) : (
                  <p style={{ 
                    color: '#666', 
                    fontSize: '0.9rem',
                    marginTop: '0.5rem'
                  }}>
                    Les plats associés ne seront pas supprimés.
                  </p>
                )}
              </div>

              <div style={{ 
                display: 'flex', 
                gap: '1rem',
                marginTop: '2rem'
              }}>
                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowConfirmDelete(false);
                    setItemToDelete(null);
                  }}
                  style={{
                    flex: 1,
                    padding: '0.875rem',
                    background: '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'all 0.3s'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = '#5a6268';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = '#6c757d';
                  }}
                >
                  Annuler
                </button>
                <button
                  className="btn btn-primary"
                  onClick={confirmerSuppression}
                  style={{
                    flex: 1,
                    padding: '0.875rem',
                    background: '#dc3545',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.3s',
                    boxShadow: '0 4px 15px rgba(220, 53, 69, 0.3)'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = '#c82333';
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 6px 20px rgba(220, 53, 69, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = '#dc3545';
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 4px 15px rgba(220, 53, 69, 0.3)';
                  }}
                >
                  🗑️ Supprimer
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Composant formulaire pour plat
function FormPlat({ restaurantId, categories, plat, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    nom: plat?.nom || '',
    description: plat?.description || '',
    prix: plat?.prix || '',
    categorie_id: plat?.categorie_id || '',
    disponible: plat?.disponible !== undefined ? plat.disponible : true
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(plat?.image_url ? (plat.image_url.startsWith('http') ? plat.image_url : `http://localhost:5000${plat.image_url}`) : null);
  const [uploading, setUploading] = useState(false);
  
  // Système de notifications toast
  const { showToast } = useToast();

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Vérifier la taille du fichier (10 MB max)
      const maxSize = 10 * 1024 * 1024; // 10 MB
      if (file.size > maxSize) {
        showToast('Le fichier est trop volumineux. Taille maximale autorisée : 10 MB', 'warning');
        e.target.value = ''; // Réinitialiser l'input
        return;
      }
      
      setImageFile(file);
      // Prévisualiser l'image
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);

    try {
      const token = localStorage.getItem('token');
      
      // Si une nouvelle image est sélectionnée, l'uploader d'abord
      let imageUrl = plat?.image_url || null;
      if (imageFile) {
        const formDataUpload = new FormData();
        formDataUpload.append('image', imageFile);
        
        const uploadResponse = await fetch(`${API_URL}/menu/upload-image`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formDataUpload
        });

        if (!uploadResponse.ok) {
          throw new Error('Erreur lors de l\'upload de l\'image');
        }

        const uploadData = await uploadResponse.json();
        imageUrl = uploadData.imageUrl;
      }

      // Créer ou mettre à jour le plat
      const formDataToSend = new FormData();
      formDataToSend.append('restaurant_id', restaurantId);
      formDataToSend.append('nom', formData.nom);
      formDataToSend.append('description', formData.description || '');
      formDataToSend.append('prix', parseFloat(formData.prix));
      formDataToSend.append('categorie_id', formData.categorie_id ? parseInt(formData.categorie_id) : '');
      formDataToSend.append('disponible', formData.disponible ? '1' : '0');
      if (imageUrl) {
        formDataToSend.append('image_url', imageUrl);
      }
      if (imageFile) {
        formDataToSend.append('image', imageFile);
      }

      const url = plat
        ? `${API_URL}/menu/plats/${plat.id}`
        : `${API_URL}/menu/plats`;

      const response = await fetch(url, {
        method: plat ? 'PUT' : 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formDataToSend
      });

      if (response.ok) {
        onSuccess();
      } else {
        const error = await response.json();
        showToast('Erreur: ' + (error.error || 'Impossible de sauvegarder'), 'error');
      }
    } catch (error) {
      console.error('Erreur:', error);
      showToast('Erreur lors de la sauvegarde: ' + error.message, 'error');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div 
      className="modal-overlay" 
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '1rem'
      }}
    >
      <div 
        className="modal" 
        onClick={(e) => e.stopPropagation()} 
        style={{ 
          maxWidth: '600px',
          width: '100%',
          maxHeight: '90vh',
          background: 'white',
          borderRadius: '16px',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        {/* En-tête amélioré */}
        <div style={{
          background: 'var(--color-primary)',
          color: 'var(--color-white)',
          padding: '1.5rem 2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexShrink: 0
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 600 }}>
              {plat ? '✏️ Modifier le plat' : '➕ Nouveau plat'}
            </h2>
            <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem', opacity: 0.9 }}>
              {plat ? `Modification de "${plat.nom}"` : 'Remplissez les informations du plat'}
            </p>
          </div>
          <button 
            className="close-btn" 
            onClick={onClose}
            disabled={uploading}
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              border: 'none',
              color: 'white',
              fontSize: '2rem',
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              cursor: uploading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.3s'
            }}
            onMouseEnter={(e) => {
              if (!uploading) e.target.style.background = 'rgba(255, 255, 255, 0.3)';
            }}
            onMouseLeave={(e) => {
              if (!uploading) e.target.style.background = 'rgba(255, 255, 255, 0.2)';
            }}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ 
          overflowY: 'auto', 
          overflowX: 'hidden',
          flex: 1,
          padding: '2rem'
        }}>
          {/* Nom */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '0.5rem', 
              fontWeight: 600,
              color: '#333',
              fontSize: '0.95rem'
            }}>
              Nom du plat <span style={{ color: '#e74c3c' }}>*</span>
            </label>
            <input
              type="text"
              value={formData.nom}
              onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
              required
              disabled={uploading}
              placeholder="Ex: Nyembwé au Poulet"
              style={{
                width: '100%',
                padding: '0.875rem 1rem',
                border: '2px solid var(--color-border)',
                borderRadius: '10px',
                fontSize: '1rem',
                transition: 'all 0.3s',
                boxSizing: 'border-box',
                outline: 'none'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'var(--color-primary)';
                e.target.style.boxShadow = '0 0 0 3px rgba(26, 26, 26, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'var(--color-border)';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>

          {/* Description */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '0.5rem', 
              fontWeight: 600,
              color: '#333',
              fontSize: '0.95rem'
            }}>
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows="4"
              disabled={uploading}
              placeholder="Décrivez le plat, ses ingrédients, sa préparation..."
              style={{
                width: '100%',
                padding: '0.875rem 1rem',
                border: '2px solid #e0e0e0',
                borderRadius: '10px',
                fontSize: '1rem',
                transition: 'all 0.3s',
                boxSizing: 'border-box',
                resize: 'vertical',
                fontFamily: 'inherit',
                outline: 'none'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'var(--color-primary)';
                e.target.style.boxShadow = '0 0 0 3px rgba(26, 26, 26, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'var(--color-border)';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>

          {/* Prix et Catégorie en ligne */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
            {/* Prix */}
            <div>
              <label style={{ 
                display: 'block', 
                marginBottom: '0.5rem', 
                fontWeight: 600,
                color: '#333',
                fontSize: '0.95rem'
              }}>
                Prix (FCFA) <span style={{ color: '#e74c3c' }}>*</span>
              </label>
              <input
                type="number"
                step="100"
                min="0"
                value={formData.prix}
                onChange={(e) => setFormData({ ...formData, prix: e.target.value })}
                required
                disabled={uploading}
                placeholder="5000"
                style={{
                  width: '100%',
                  padding: '0.875rem 1rem',
                  border: '2px solid #e0e0e0',
                  borderRadius: '10px',
                  fontSize: '1rem',
                  transition: 'all 0.3s',
                  boxSizing: 'border-box',
                  outline: 'none'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#667eea';
                  e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#e0e0e0';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>

            {/* Catégorie */}
            <div>
              <label style={{ 
                display: 'block', 
                marginBottom: '0.5rem', 
                fontWeight: 600,
                color: '#333',
                fontSize: '0.95rem'
              }}>
                Catégorie
              </label>
              <select
                value={formData.categorie_id}
                onChange={(e) => setFormData({ ...formData, categorie_id: e.target.value })}
                disabled={uploading}
                style={{
                  width: '100%',
                  padding: '0.875rem 1rem',
                  border: '2px solid #e0e0e0',
                  borderRadius: '10px',
                  fontSize: '1rem',
                  transition: 'all 0.3s',
                  boxSizing: 'border-box',
                  outline: 'none',
                  cursor: 'pointer',
                  background: 'white'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#667eea';
                  e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#e0e0e0';
                  e.target.style.boxShadow = 'none';
                }}
              >
                <option value="">Aucune catégorie</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.nom}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Image du plat */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '0.5rem', 
              fontWeight: 600,
              color: '#333',
              fontSize: '0.95rem'
            }}>
              📷 Image du plat
            </label>
            
            {/* Zone de drop/upload améliorée */}
            <div             style={{
              border: '2px dashed var(--color-border)',
              borderRadius: '12px',
              padding: '2rem',
              textAlign: 'center',
              background: 'var(--color-light)',
              transition: 'all 0.3s',
              cursor: uploading ? 'not-allowed' : 'pointer'
            }}
            onDragOver={(e) => {
              e.preventDefault();
              if (!uploading) e.currentTarget.style.borderColor = 'var(--color-primary)';
              if (!uploading) e.currentTarget.style.background = 'var(--color-surface-hover)';
            }}
            onDragLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--color-border)';
              e.currentTarget.style.background = 'var(--color-light)';
            }}
            onDrop={(e) => {
              e.preventDefault();
              e.currentTarget.style.borderColor = 'var(--color-border)';
              e.currentTarget.style.background = 'var(--color-light)';
              if (!uploading && e.dataTransfer.files.length > 0) {
                const file = e.dataTransfer.files[0];
                if (file.type.startsWith('image/')) {
                  handleImageChange({ target: { files: [file] } });
                }
              }
            }}
            >
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleImageChange}
                disabled={uploading}
                id="image-upload"
                style={{ display: 'none' }}
              />
              <label
                htmlFor="image-upload"
                style={{
                  cursor: uploading ? 'not-allowed' : 'pointer',
                  display: 'block'
                }}
              >
                {imagePreview ? (
                  <div>
                    <img 
                      src={imagePreview} 
                      alt="Aperçu" 
                      style={{ 
                        maxWidth: '100%', 
                        maxHeight: '250px', 
                        borderRadius: '10px',
                        border: '2px solid #ddd',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                        marginBottom: '1rem'
                      }} 
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setImageFile(null);
                        setImagePreview(null);
                        document.getElementById('image-upload').value = '';
                      }}
                      disabled={uploading}
                      style={{ 
                        padding: '0.5rem 1rem', 
                        backgroundColor: '#dc3545', 
                        color: 'white', 
                        border: 'none', 
                        borderRadius: '8px', 
                        cursor: uploading ? 'not-allowed' : 'pointer',
                        fontSize: '0.9rem',
                        fontWeight: 500,
                        transition: 'all 0.3s'
                      }}
                      onMouseEnter={(e) => {
                        if (!uploading) e.target.style.backgroundColor = '#c82333';
                        if (!uploading) e.target.style.transform = 'translateY(-2px)';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = '#dc3545';
                        e.target.style.transform = 'translateY(0)';
                      }}
                    >
                      ✖️ Supprimer l'image
                    </button>
                  </div>
                ) : (
                  <div>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📷</div>
                    <p style={{ margin: 0, color: '#666', fontSize: '1rem', fontWeight: 500 }}>
                      Cliquez ou glissez-déposez une image ici
                    </p>
                    <p style={{ margin: '0.5rem 0 0 0', color: '#999', fontSize: '0.85rem' }}>
                      Taille maximale : 10 MB
                    </p>
                  </div>
                )}
              </label>
            </div>
          </div>

          {/* Disponible */}
          <div style={{ 
            marginBottom: '2rem',
            padding: '1rem',
            background: 'var(--color-light)',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}>
            <input
              type="checkbox"
              id="disponible"
              checked={formData.disponible}
              onChange={(e) => setFormData({ ...formData, disponible: e.target.checked })}
              disabled={uploading}
              style={{
                width: '20px',
                height: '20px',
                cursor: uploading ? 'not-allowed' : 'pointer'
              }}
            />
            <label 
              htmlFor="disponible"
              style={{
                cursor: uploading ? 'not-allowed' : 'pointer',
                fontWeight: 500,
                color: '#333',
                fontSize: '1rem'
              }}
            >
              Plat disponible à la commande
            </label>
          </div>

          {/* Actions */}
          <div style={{
            display: 'flex',
            gap: '1rem',
            marginTop: '2rem',
            paddingTop: '1.5rem',
            borderTop: '2px solid #f0f0f0'
          }}>
            <button
              type="button"
              onClick={onClose}
              disabled={uploading}
            style={{
              flex: 1,
              padding: '0.875rem',
              background: 'var(--color-secondary)',
              color: 'var(--color-white)',
              border: '1px solid var(--color-secondary)',
              borderRadius: '10px',
              fontSize: '1rem',
              fontWeight: 500,
              cursor: uploading ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s',
              opacity: uploading ? 0.6 : 1
            }}
            onMouseEnter={(e) => {
              if (!uploading) e.target.style.background = 'var(--color-primary)';
              if (!uploading) e.target.style.borderColor = 'var(--color-primary)';
            }}
            onMouseLeave={(e) => {
              if (!uploading) e.target.style.background = 'var(--color-secondary)';
              if (!uploading) e.target.style.borderColor = 'var(--color-secondary)';
            }}
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={uploading}
              style={{
                flex: 2,
                padding: '0.875rem',
                background: 'var(--color-primary)',
                color: 'var(--color-white)',
                border: '1px solid var(--color-primary)',
                borderRadius: '10px',
                fontSize: '1rem',
                fontWeight: 600,
                cursor: uploading ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s',
                opacity: uploading ? 0.6 : 1,
                boxShadow: uploading ? 'none' : 'var(--shadow-soft)'
              }}
              onMouseEnter={(e) => {
                if (!uploading) e.target.style.transform = 'translateY(-2px)';
                if (!uploading) e.target.style.boxShadow = 'var(--shadow-medium)';
              }}
              onMouseLeave={(e) => {
                if (!uploading) e.target.style.transform = 'translateY(0)';
                if (!uploading) e.target.style.boxShadow = 'var(--shadow-soft)';
              }}
            >
              {uploading ? (
                <>⏳ Enregistrement en cours...</>
              ) : plat ? (
                <>✅ Enregistrer les modifications</>
              ) : (
                <>✅ Créer le plat</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Composant formulaire pour catégorie
function FormCategorie({ restaurantId, categorie, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    nom: categorie?.nom || '',
    description: categorie?.description || '',
    ordre: categorie?.ordre || 0
  });
  const [uploading, setUploading] = useState(false);
  
  // Système de notifications toast
  const { showToast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);

    try {
      const token = localStorage.getItem('token');

      const formDataToSend = new FormData();
      formDataToSend.append('restaurant_id', restaurantId);
      formDataToSend.append('nom', formData.nom);
      formDataToSend.append('description', formData.description || '');
      formDataToSend.append('ordre', parseInt(formData.ordre) || 0);

      const url = categorie
        ? `${API_URL}/menu/categories/${categorie.id}`
        : `${API_URL}/menu/categories`;

      const response = await fetch(url, {
        method: categorie ? 'PUT' : 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formDataToSend
      });

      if (response.ok) {
        onSuccess();
      } else {
        const error = await response.json();
        showToast('Erreur: ' + (error.error || 'Impossible de sauvegarder'), 'error');
      }
    } catch (error) {
      console.error('Erreur:', error);
      showToast('Erreur lors de la sauvegarde: ' + error.message, 'error');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div 
      className="modal-overlay" 
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '1rem'
      }}
    >
      <div 
        className="modal" 
        onClick={(e) => e.stopPropagation()} 
        style={{ 
          maxWidth: '600px',
          width: '100%',
          maxHeight: '90vh',
          background: 'white',
          borderRadius: '16px',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        {/* En-tête amélioré */}
        <div style={{
          background: 'var(--color-primary)',
          color: 'var(--color-white)',
          padding: '1.5rem 2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexShrink: 0
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 600 }}>
              {categorie ? '✏️ Modifier la catégorie' : '➕ Nouvelle catégorie'}
            </h2>
            <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem', opacity: 0.9 }}>
              {categorie ? `Modification de "${categorie.nom}"` : 'Remplissez les informations de la catégorie'}
            </p>
          </div>
          <button 
            className="close-btn" 
            onClick={onClose}
            disabled={uploading}
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              border: 'none',
              color: 'white',
              fontSize: '2rem',
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              cursor: uploading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.3s'
            }}
            onMouseEnter={(e) => {
              if (!uploading) e.target.style.background = 'rgba(255, 255, 255, 0.3)';
            }}
            onMouseLeave={(e) => {
              if (!uploading) e.target.style.background = 'rgba(255, 255, 255, 0.2)';
            }}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ 
          overflowY: 'auto', 
          overflowX: 'hidden',
          flex: 1,
          padding: '2rem'
        }}>
          {/* Nom */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '0.5rem', 
              fontWeight: 600,
              color: '#333',
              fontSize: '0.95rem'
            }}>
              Nom de la catégorie <span style={{ color: '#e74c3c' }}>*</span>
            </label>
            <input
              type="text"
              value={formData.nom}
              onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
              required
              disabled={uploading}
              placeholder="Ex: Plats principaux"
              style={{
                width: '100%',
                padding: '0.875rem 1rem',
                border: '2px solid var(--color-border)',
                borderRadius: '10px',
                fontSize: '1rem',
                transition: 'all 0.3s',
                boxSizing: 'border-box',
                outline: 'none'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'var(--color-primary)';
                e.target.style.boxShadow = '0 0 0 3px rgba(26, 26, 26, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'var(--color-border)';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>

          {/* Description */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '0.5rem', 
              fontWeight: 600,
              color: '#333',
              fontSize: '0.95rem'
            }}>
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows="4"
              disabled={uploading}
              placeholder="Décrivez la catégorie..."
              style={{
                width: '100%',
                padding: '0.875rem 1rem',
                border: '2px solid var(--color-border)',
                borderRadius: '10px',
                fontSize: '1rem',
                transition: 'all 0.3s',
                boxSizing: 'border-box',
                resize: 'vertical',
                fontFamily: 'inherit',
                outline: 'none'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'var(--color-primary)';
                e.target.style.boxShadow = '0 0 0 3px rgba(26, 26, 26, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'var(--color-border)';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>

          {/* Ordre d'affichage */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '0.5rem', 
              fontWeight: 600,
              color: '#333',
              fontSize: '0.95rem'
            }}>
              Ordre d'affichage
            </label>
            <input
              type="number"
              value={formData.ordre}
              onChange={(e) => setFormData({ ...formData, ordre: e.target.value })}
              disabled={uploading}
              placeholder="0"
              style={{
                width: '100%',
                padding: '0.875rem 1rem',
                border: '2px solid var(--color-border)',
                borderRadius: '10px',
                fontSize: '1rem',
                transition: 'all 0.3s',
                boxSizing: 'border-box',
                outline: 'none'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'var(--color-primary)';
                e.target.style.boxShadow = '0 0 0 3px rgba(26, 26, 26, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'var(--color-border)';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>

          {/* Actions */}
          <div style={{
            display: 'flex',
            gap: '1rem',
            marginTop: '2rem',
            paddingTop: '1.5rem',
            borderTop: '2px solid #f0f0f0'
          }}>
            <button
              type="button"
              onClick={onClose}
              disabled={uploading}
              style={{
                flex: 1,
                padding: '0.875rem',
                background: 'var(--color-secondary)',
                color: 'var(--color-white)',
                border: '1px solid var(--color-secondary)',
                borderRadius: '10px',
                fontSize: '1rem',
                fontWeight: 500,
                cursor: uploading ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s',
                opacity: uploading ? 0.6 : 1
              }}
              onMouseEnter={(e) => {
                if (!uploading) e.target.style.background = 'var(--color-primary)';
                if (!uploading) e.target.style.borderColor = 'var(--color-primary)';
              }}
              onMouseLeave={(e) => {
                if (!uploading) e.target.style.background = 'var(--color-secondary)';
                if (!uploading) e.target.style.borderColor = 'var(--color-secondary)';
              }}
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={uploading}
              style={{
                flex: 2,
                padding: '0.875rem',
                background: 'var(--color-primary)',
                color: 'var(--color-white)',
                border: '1px solid var(--color-primary)',
                borderRadius: '10px',
                fontSize: '1rem',
                fontWeight: 600,
                cursor: uploading ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s',
                opacity: uploading ? 0.6 : 1,
                boxShadow: uploading ? 'none' : 'var(--shadow-soft)'
              }}
              onMouseEnter={(e) => {
                if (!uploading) e.target.style.transform = 'translateY(-2px)';
                if (!uploading) e.target.style.boxShadow = 'var(--shadow-medium)';
              }}
              onMouseLeave={(e) => {
                if (!uploading) e.target.style.transform = 'translateY(0)';
                if (!uploading) e.target.style.boxShadow = 'var(--shadow-soft)';
              }}
            >
              {uploading ? (
                <>⏳ Enregistrement en cours...</>
              ) : categorie ? (
                <>✅ Enregistrer les modifications</>
              ) : (
                <>✅ Créer la catégorie</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AdminMenu;



