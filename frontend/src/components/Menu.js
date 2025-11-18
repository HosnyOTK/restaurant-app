import React, { useState, useEffect } from 'react';
import { useToast, ToastContainer } from './ToastNotification';
import API_URL from '../config/api';

function Menu({ restaurant, onAddToCart, onRetourAccueil, user, onLoginClick }) {
  const [categories, setCategories] = useState([]);
  const [plats, setPlats] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Système de notifications toast
  const { toasts, showToast, removeToast } = useToast();
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    nom: '',
    description: '',
    prix: '',
    categorie_id: '',
    image: null,
    imagePreview: null
  });
  const [uploading, setUploading] = useState(false);
  const [deletingPlatId, setDeletingPlatId] = useState(null);
  
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

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const totalPages = Math.ceil(platsFiltered.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const platsToDisplay = platsFiltered.slice(startIndex, endIndex);

  useEffect(() => {
    if (restaurant) {
      chargerCategories();
      chargerPlats();
    }
  }, [restaurant]);

  const chargerCategories = async () => {
    try {
      const response = await fetch(`${API_URL}/menu/restaurant/${restaurant.id}/categories`);
      const data = await response.json();
      setCategories(data);
    } catch (error) {
      console.error('Erreur lors du chargement des catégories:', error);
    }
  };

  const chargerPlats = async () => {
    try {
      setLoading(true);
      let url = `${API_URL}/menu/restaurant/${restaurant.id}/plats`;
      if (selectedCategory) {
        url = `${API_URL}/menu/categories/${selectedCategory}/plats`;
      }
      const response = await fetch(url);
      const data = await response.json();
      setPlats(data);
      setLoading(false);
    } catch (error) {
      console.error('Erreur lors du chargement des plats:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (restaurant) {
      chargerPlats();
    }
  }, [selectedCategory, restaurant]);

  // Réinitialiser la page quand on change de catégorie ou de recherche
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, plats.length, searchQuery]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Vérifier la taille du fichier (max 10MB)
      const maxSize = 10 * 1024 * 1024; // 10 MB
      if (file.size > maxSize) {
        showToast('Le fichier est trop volumineux. Taille maximale autorisée : 10 MB', 'warning');
        e.target.value = ''; // Réinitialiser l'input
        return;
      }

      // Vérifier le type de fichier
      if (!file.type.startsWith('image/')) {
        showToast('Veuillez sélectionner une image valide.', 'warning');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({
          ...formData,
          image: reader.result, // Base64 string
          imagePreview: reader.result
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.nom || !formData.prix) {
      showToast('Le nom et le prix sont obligatoires', 'warning');
      return;
    }

    setUploading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/menu/plats`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          restaurant_id: restaurant.id,
          nom: formData.nom,
          description: formData.description || null,
          prix: parseFloat(formData.prix),
          categorie_id: formData.categorie_id || null,
          image_url: formData.image || null,
          disponible: 1
        })
      });

      if (response.ok) {
        showToast('Plat ajouté avec succès!', 'success');
        setShowAddForm(false);
        setFormData({
          nom: '',
          description: '',
          prix: '',
          categorie_id: '',
          image: null,
          imagePreview: null
        });
        // Recharger les plats
        chargerPlats();
      } else {
        const error = await response.json();
        showToast('Erreur: ' + (error.error || 'Impossible d\'ajouter le plat'), 'error');
      }
    } catch (error) {
      console.error('Erreur:', error);
      showToast('Erreur lors de l\'ajout du plat', 'error');
    } finally {
      setUploading(false);
    }
  };

  const supprimerPlat = async (platId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce plat ? Cette action est irréversible.')) {
      return;
    }

    setDeletingPlatId(platId);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/menu/plats/${platId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        showToast('Plat supprimé avec succès!', 'success');
        // Recharger les plats
        chargerPlats();
      } else {
        const error = await response.json();
        showToast('Erreur: ' + (error.error || 'Impossible de supprimer le plat'), 'error');
      }
    } catch (error) {
      console.error('Erreur:', error);
      showToast('Erreur lors de la suppression du plat', 'error');
    } finally {
      setDeletingPlatId(null);
    }
  };

  if (!restaurant) {
    return null;
  }

  return (
    <div className="menu-container">
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <div className="container">
        <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <button onClick={onRetourAccueil} className="btn btn-secondary">
              ← Retour à l'accueil
            </button>
            {user && user.role === 'admin' && (
              <button 
                onClick={() => setShowAddForm(true)} 
                className="btn btn-primary"
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                ➕ Ajouter un plat
              </button>
            )}
          </div>
          <h1 className="menu-title">🍽️ {restaurant.nom}</h1>
          {restaurant.description && (
            <p style={{ textAlign: 'center', color: '#666', marginBottom: '1rem', fontSize: '1.1rem' }}>
              {restaurant.description}
            </p>
          )}
          {restaurant.adresse && (
            <p style={{ textAlign: 'center', color: '#888', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
              📍 {restaurant.adresse}
            </p>
          )}

          {/* Barre de recherche */}
          <div style={{ 
            maxWidth: '600px', 
            margin: '0 auto 2rem auto',
            position: 'relative'
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
          {restaurant.telephone && (
            <p style={{ textAlign: 'center', color: '#888', marginBottom: '2rem', fontSize: '0.95rem' }}>
              📞 {restaurant.telephone}
            </p>
          )}
        </div>

        {!user && (
          <div style={{ 
            background: 'rgba(201, 169, 97, 0.1)', 
            border: '1px solid var(--color-accent)', 
            padding: '1.5rem', 
            marginBottom: '2rem', 
            textAlign: 'center',
            animation: 'fadeInUp 0.8s ease-out'
          }}>
            <p style={{ 
              fontSize: '0.9rem', 
              color: 'var(--color-primary)', 
              marginBottom: '1rem',
              letterSpacing: '0.5px'
            }}>
              👤 Vous devez être inscrit et connecté pour ajouter des produits au panier et commander.
            </p>
            <button
              className="btn btn-primary"
              onClick={() => {
                if (onLoginClick) {
                  onLoginClick();
                }
              }}
              style={{ fontSize: '0.875rem', padding: '0.75rem 2rem' }}
            >
              Se connecter / S'inscrire
            </button>
          </div>
        )}
        
        {categories.length > 0 && (
          <div className="categories">
            <button
              className={`category-btn ${selectedCategory === null ? 'active' : ''}`}
              onClick={() => setSelectedCategory(null)}
            >
              🌟 Tous les plats
            </button>
            {categories.map(category => (
              <button
                key={category.id}
                className={`category-btn ${selectedCategory === category.id ? 'active' : ''}`}
                onClick={() => setSelectedCategory(category.id)}
              >
                {category.nom}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⏳</div>
            <p style={{ fontSize: '1.2rem', color: '#666' }}>Chargement du menu...</p>
          </div>
        ) : (
          <>
            {plats.length > 0 && (
              <div style={{ marginBottom: '1rem', color: '#666', textAlign: 'center' }}>
                {selectedCategory ? (
                  <p>{plats.length} plat{plats.length > 1 ? 's' : ''} dans cette catégorie</p>
                ) : (
                  <p>{plats.length} plat{plats.length > 1 ? 's' : ''} disponible{plats.length > 1 ? 's' : ''}</p>
                )}
              </div>
            )}
        <div className="plats-grid">
          {platsFiltered.length === 0 ? (
            <div className="empty-state" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem' }}>
              <p style={{ fontSize: '1.2rem', color: '#666' }}>
                {searchQuery ? `Aucun plat trouvé pour "${searchQuery}"` : 'Aucun plat disponible'}
              </p>
            </div>
          ) : (
            platsToDisplay.map(plat => (
              <div key={plat.id} className="plat-card">
                  <div className="plat-image">
                    {plat.image_url ? (
                      <img 
                        src={plat.image_url.startsWith('http') ? plat.image_url : `http://localhost:5000${plat.image_url}`} 
                        alt={plat.nom} 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    {!plat.image_url && (
                      <span style={{ fontSize: '3.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>🍽️</span>
                    )}
                  </div>
                  <div className="plat-info">
                    <div style={{ marginBottom: '0.5rem' }}>
                      {plat.categorie_nom && (
                        <span style={{ 
                          display: 'inline-block', 
                          padding: '0.25rem 0.75rem', 
                          backgroundColor: '#f0f0f0', 
                          borderRadius: '12px', 
                          fontSize: '0.75rem',
                          color: '#667eea',
                          fontWeight: '500',
                          marginBottom: '0.5rem'
                        }}>
                          {plat.categorie_nom}
                        </span>
                      )}
                    </div>
                    <h3 className="plat-nom">{plat.nom}</h3>
                    {plat.description && (
                      <p className="plat-description">{plat.description}</p>
                    )}
                    <div className="plat-footer">
                      <span className="plat-prix">{parseFloat(plat.prix).toFixed(0)} FCFA</span>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexDirection: 'column' }}>
                        {!user ? (
                          <div style={{ textAlign: 'center', width: '100%', padding: '0.5rem', border: '1px dashed var(--color-border)', borderRadius: '4px' }}>
                            <p style={{ fontSize: '0.7rem', color: 'var(--color-secondary)', marginBottom: '0.75rem', fontStyle: 'italic', letterSpacing: '0.5px' }}>
                              Inscription requise
                            </p>
                            <button
                              className="btn btn-secondary"
                              onClick={() => {
                                if (onLoginClick) {
                                  onLoginClick();
                                } else {
                                  showToast('Veuillez vous connecter pour ajouter des produits au panier.', 'warning');
                                }
                              }}
                              style={{ minWidth: '100%', fontSize: '0.75rem', padding: '0.6rem 1rem', letterSpacing: '1px' }}
                            >
                              Se connecter
                            </button>
                          </div>
                        ) : (
                          <button
                            className="btn btn-primary"
                            onClick={() => {
                              onAddToCart(plat);
                              // Animation de confirmation
                              const button = document.activeElement;
                              if (button) {
                                button.style.transform = 'scale(0.95)';
                                setTimeout(() => {
                                  button.style.transform = 'scale(1)';
                                }, 150);
                              }
                            }}
                            style={{ minWidth: '100px' }}
                          >
                            ➕ Ajouter
                          </button>
                        )}
                        {user && user.role === 'admin' && (
                          <button
                            className="btn btn-secondary"
                            onClick={() => supprimerPlat(plat.id)}
                            disabled={deletingPlatId === plat.id}
                            style={{ 
                              background: deletingPlatId === plat.id ? '#ccc' : '#dc3545', 
                              color: 'white',
                              border: 'none',
                              minWidth: '40px',
                              padding: '0.6rem'
                            }}
                            title="Supprimer ce plat"
                          >
                            {deletingPlatId === plat.id ? '⏳' : '🗑️'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
              </div>
            ))
          )}
        </div>
        {/* Pagination */}
        {totalPages > 1 && (
              <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                gap: '0.5rem', 
                marginTop: '2rem',
                padding: '1rem'
              }}>
                <button
                  className="btn btn-secondary"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}
                >
                  ← Précédent
                </button>
                <span style={{ padding: '0 1rem', color: 'var(--color-secondary)' }}>
                  Page {currentPage} sur {totalPages}
                </span>
                <button
                  className="btn btn-secondary"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}
                >
                  Suivant →
                </button>
              </div>
            )}
          </>
        )}

        {!loading && plats.length === 0 && (
          <div className="empty-state">
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🍽️</div>
            <p style={{ fontSize: '1.2rem', color: '#666', marginBottom: '1rem' }}>
              {selectedCategory 
                ? 'Aucun plat disponible dans cette catégorie pour le moment.' 
                : 'Aucun plat disponible pour le moment.'}
            </p>
            <button onClick={() => setSelectedCategory(null)} className="btn btn-primary">
              Voir tous les plats
            </button>
          </div>
        )}
      </div>

      {/* Modal pour ajouter un plat */}
      {showAddForm && (
        <div className="modal-overlay" onClick={() => !uploading && setShowAddForm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px', width: '90%' }}>
            <div className="modal-header">
              <h2 className="modal-title">Ajouter un nouveau plat</h2>
              <button 
                className="close-btn" 
                onClick={() => !uploading && setShowAddForm(false)}
                disabled={uploading}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Nom du plat *</label>
                <input
                  type="text"
                  name="nom"
                  value={formData.nom}
                  onChange={handleInputChange}
                  required
                  placeholder="Ex: Poulet Nyembwé"
                  disabled={uploading}
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Description du plat..."
                  rows="3"
                  style={{ width: '100%', padding: '0.75rem', border: '2px solid #ddd', borderRadius: '8px', fontFamily: 'inherit' }}
                  disabled={uploading}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>Prix (FCFA) *</label>
                  <input
                    type="number"
                    name="prix"
                    value={formData.prix}
                    onChange={handleInputChange}
                    required
                    placeholder="5000"
                    min="0"
                    step="100"
                    disabled={uploading}
                  />
                </div>

                <div className="form-group">
                  <label>Catégorie</label>
                  <select
                    name="categorie_id"
                    value={formData.categorie_id}
                    onChange={handleInputChange}
                    style={{ width: '100%', padding: '0.75rem', border: '2px solid #ddd', borderRadius: '8px', fontFamily: 'inherit' }}
                    disabled={uploading}
                  >
                    <option value="">Aucune catégorie</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.nom}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Image du plat</label>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleImageChange}
                  disabled={uploading}
                  style={{ width: '100%', padding: '0.75rem', border: '2px solid #ddd', borderRadius: '8px', cursor: 'pointer' }}
                />
                <small style={{ display: 'block', marginTop: '0.5rem', color: '#666', fontSize: '0.85rem' }}>
                  📷 Prendre une photo (mobile) ou choisir un fichier • Taille max: 10 MB
                </small>
                {formData.imagePreview && (
                  <div style={{ marginTop: '1rem', textAlign: 'center' }}>
                    <img 
                      src={formData.imagePreview} 
                      alt="Aperçu" 
                      style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '8px', border: '2px solid #ddd' }}
                    />
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, image: null, imagePreview: null })}
                      style={{ marginTop: '0.5rem', padding: '0.5rem 1rem', backgroundColor: '#ff4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                      disabled={uploading}
                    >
                      Supprimer l'image
                    </button>
                  </div>
                )}
              </div>

              <div className="form-actions">
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  style={{ width: '100%' }}
                  disabled={uploading}
                >
                  {uploading ? '⏳ Ajout en cours...' : '✅ Ajouter le plat'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="btn btn-secondary"
                  style={{ width: '100%' }}
                  disabled={uploading}
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Menu;
