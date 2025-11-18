import React, { useState, useEffect } from 'react';
import NotificationSystem from './NotificationSystem';
import WhatsAppButton from './WhatsAppButton';
import Facture from './Facture';
import Avis from './Avis';
import { useToast, ToastContainer } from './ToastNotification';
import API_URL from '../config/api';

function MesCommandes({ userId }) {
  const [commandes, setCommandes] = useState([]);
  const [factures, setFactures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingFactures, setLoadingFactures] = useState(false);
  const [errorFactures, setErrorFactures] = useState(null);
  const [activeTab, setActiveTab] = useState('commandes'); // 'commandes' ou 'factures'
  const [factureSelectionnee, setFactureSelectionnee] = useState(null);
  const [avisParCommande, setAvisParCommande] = useState({}); // { commandeId: avis }
  const [commandesAvecAvis, setCommandesAvecAvis] = useState({}); // { commandeId: true/false }
  
  // Récupérer l'utilisateur depuis localStorage pour les notifications
  const [user, setUser] = useState(null);
  
  // Système de notifications toast
  const { toasts, showToast, removeToast } = useToast();

  useEffect(() => {
    chargerCommandes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  // Charger les avis pour les commandes livrées
  useEffect(() => {
    if (commandes.length > 0) {
      chargerAvisPourCommandes();
    }
  }, [commandes, userId]);

  const chargerAvisPourCommandes = async () => {
    const commandesLivrees = commandes.filter(c => c.statut === 'delivered');
    const avisMap = {};
    const commandesAvecAvisMap = {};

    for (const commande of commandesLivrees) {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/avis/commande/${commande.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const avis = await response.json();
          if (avis) {
            avisMap[commande.id] = avis;
            commandesAvecAvisMap[commande.id] = true;
          } else {
            commandesAvecAvisMap[commande.id] = false;
          }
        }
      } catch (error) {
        console.error(`Erreur lors du chargement de l'avis pour la commande ${commande.id}:`, error);
        commandesAvecAvisMap[commande.id] = false;
      }
    }

    setAvisParCommande(avisMap);
    setCommandesAvecAvis(commandesAvecAvisMap);
  };

  useEffect(() => {
    if (activeTab === 'factures' && userId) {
      chargerFactures();
    }
  }, [activeTab, userId]);

  // Écouter l'événement pour ouvrir l'onglet factures
  useEffect(() => {
    const handleOpenFacturesTab = () => {
      setActiveTab('factures');
    };

    window.addEventListener('openFacturesTab', handleOpenFacturesTab);
    return () => {
      window.removeEventListener('openFacturesTab', handleOpenFacturesTab);
    };
  }, []);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const chargerCommandes = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/commandes/client/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setCommandes(data);
      }
      setLoading(false);
    } catch (error) {
      console.error('Erreur lors du chargement des commandes:', error);
      setLoading(false);
    }
  };

  const getStatutLabel = (statut) => {
    const labels = {
      'pending': 'En attente',
      'confirmed': 'Confirmée',
      'preparing': 'En préparation',
      'ready': 'Prête',
      'delivered': 'Livrée',
      'annulee': 'Annulée'
    };
    return labels[statut] || statut;
  };

  const getStatutColor = (statut) => {
    const colors = {
      'pending': '#ffc107',
      'confirmed': '#17a2b8',
      'preparing': '#007bff',
      'ready': '#28a745',
      'delivered': '#6c757d',
      'annulee': '#dc3545'
    };
    return colors[statut] || '#6c757d';
  };

  const chargerFactures = async () => {
    try {
      if (!userId) {
        console.error('userId n\'est pas défini');
        setErrorFactures('Erreur: Identifiant utilisateur non défini');
        setLoadingFactures(false);
        return;
      }

      setLoadingFactures(true);
      setErrorFactures(null);
      const token = localStorage.getItem('token');
      
      if (!token) {
        setErrorFactures('Vous devez être connecté pour voir vos factures');
        setLoadingFactures(false);
        return;
      }

      console.log('Chargement des factures pour userId:', userId, 'type:', typeof userId);
      
      const response = await fetch(`${API_URL}/paiement/factures/client/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('Réponse factures:', response.status, response.statusText);

      if (response.ok) {
        const data = await response.json();
        console.log('Factures reçues:', data.length, data);
        setFactures(data || []);
        setErrorFactures(null);
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Erreur inconnue' }));
        console.error('Erreur lors du chargement des factures:', errorData);
        if (response.status === 403) {
          setErrorFactures('Accès refusé. Vous n\'avez pas la permission de voir ces factures.');
        } else if (response.status === 404) {
          // Pas d'erreur, juste aucune facture
          setFactures([]);
          setErrorFactures(null);
        } else {
          setErrorFactures('Erreur lors du chargement des factures: ' + (errorData.error || 'Erreur serveur'));
        }
      }
      setLoadingFactures(false);
    } catch (error) {
      console.error('Erreur lors du chargement des factures:', error);
      setErrorFactures('Erreur de connexion. Veuillez réessayer.');
      setLoadingFactures(false);
    }
  };

  const voirFacture = async (factureId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/paiement/factures/${factureId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const facture = await response.json();
        // Le backend retourne déjà la facture avec commande incluse
        // Le composant Facture peut gérer les deux formats
        setFactureSelectionnee(facture);
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Erreur inconnue' }));
        showToast('Erreur: ' + (errorData.error || 'Impossible de charger la facture'), 'error');
      }
    } catch (error) {
      console.error('Erreur lors du chargement de la facture:', error);
      showToast('Erreur de connexion. Veuillez réessayer.', 'error');
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ padding: '2rem', textAlign: 'center' }}>
        <p>Chargement de vos commandes...</p>
      </div>
    );
  }

  return (
    <div className="commandes-container">
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      {user && <NotificationSystem user={user} onRefresh={chargerCommandes} />}
      <div className="container">
        <h1 style={{ marginBottom: '2rem' }}>Mes Commandes</h1>

        {/* Onglets */}
        <div style={{ 
          display: 'flex', 
          gap: '1rem', 
          marginBottom: '2rem', 
          borderBottom: '2px solid #eee', 
          paddingBottom: '1rem' 
        }}>
          <button
            className={`btn ${activeTab === 'commandes' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('commandes')}
            style={{ fontSize: '0.9rem', padding: '0.5rem 1rem' }}
          >
            📦 Mes Commandes ({commandes.length})
          </button>
          <button
            className={`btn ${activeTab === 'factures' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('factures')}
            style={{ fontSize: '0.9rem', padding: '0.5rem 1rem' }}
          >
            📄 Mes Factures ({factures.length})
          </button>
        </div>

        {/* Vue Historique des Factures */}
        {activeTab === 'factures' && (
          <div>
            <div style={{ 
              marginBottom: '1rem', 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center' 
            }}>
              <h2>Historique des Factures</h2>
              <button 
                className="btn btn-primary" 
                onClick={chargerFactures}
                style={{ fontSize: '0.9rem', padding: '0.5rem 1rem' }}
              >
                🔄 Actualiser
              </button>
            </div>

            {loadingFactures ? (
              <div style={{ padding: '2rem', textAlign: 'center' }}>
                <p>Chargement des factures...</p>
              </div>
            ) : errorFactures ? (
              <div className="empty-state" style={{ 
                background: '#fff3cd', 
                border: '1px solid #ffc107',
                borderRadius: '8px',
                padding: '1.5rem'
              }}>
                <p style={{ color: '#856404', marginBottom: '1rem' }}>⚠️ {errorFactures}</p>
                <button 
                  className="btn btn-primary" 
                  onClick={chargerFactures}
                  style={{ fontSize: '0.9rem', padding: '0.5rem 1rem' }}
                >
                  🔄 Réessayer
                </button>
              </div>
            ) : factures.length === 0 ? (
              <div className="empty-state">
                <p>Vous n'avez pas encore de facture.</p>
                <p style={{ fontSize: '0.9rem', color: '#666', marginTop: '0.5rem' }}>
                  Les factures seront disponibles après le paiement de vos commandes.
                </p>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '1rem' }}>
                {factures.map(facture => (
                  <div 
                    key={facture.id} 
                    className="commande-card"
                    style={{ cursor: 'pointer', transition: 'all 0.3s ease' }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                    }}
                    onClick={() => voirFacture(facture.id)}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                      <div style={{ flex: 1 }}>
                        <h3 style={{ color: '#667eea', marginBottom: '0.5rem' }}>
                          Facture #{facture.numero_facture}
                        </h3>
                        <p><strong>Commande:</strong> #{facture.commande_id}</p>
                        {facture.restaurant_nom && <p><strong>Restaurant:</strong> {facture.restaurant_nom}</p>}
                        <p><strong>Date:</strong> {new Date(facture.date_facture).toLocaleString('fr-FR')}</p>
                        <p><strong>Mode de paiement:</strong> {facture.mode_paiement === 'carte' ? '💳 Carte bancaire' : facture.mode_paiement === 'livraison' ? '🚚 À la livraison' : facture.mode_paiement}</p>
                        <p>
                          <strong>Statut:</strong> 
                          <span 
                            style={{
                              backgroundColor: facture.statut_paiement === 'paye' ? '#28a745' : 
                                             facture.statut_paiement === 'en_attente' ? '#ffc107' :
                                             '#dc3545',
                              color: 'white',
                              padding: '0.25rem 0.75rem',
                              borderRadius: '12px',
                              marginLeft: '0.5rem',
                              fontSize: '0.85rem'
                            }}
                          >
                            {facture.statut_paiement === 'paye' ? '✓ Payé' : 
                             facture.statut_paiement === 'en_attente' ? '⏳ En attente' :
                             facture.statut_paiement}
                          </span>
                        </p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#667eea', marginBottom: '0.5rem' }}>
                          {parseFloat(facture.montant_total).toFixed(0)} FCFA
                        </p>
                        <button
                          className="btn btn-primary"
                          onClick={(e) => {
                            e.stopPropagation();
                            voirFacture(facture.id);
                          }}
                          style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}
                        >
                          👁️ Voir détails
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Modal de facture */}
            {factureSelectionnee && (
              <Facture 
                facture={factureSelectionnee} 
                onClose={() => {
                  setFactureSelectionnee(null);
                }} 
              />
            )}
          </div>
        )}

        {/* Vue Commandes */}
        {activeTab === 'commandes' && (
          <>
            {commandes.length === 0 ? (
          <div className="empty-state">
            <p>Vous n'avez pas encore passé de commande.</p>
          </div>
        ) : (
          commandes.map(commande => (
            <div key={commande.id} className="commande-card">
              <div className="commande-header">
                <div>
                  <h3>Commande #{commande.id}</h3>
                  <p style={{ color: '#666', marginTop: '0.5rem' }}>
                    Date: {new Date(commande.date_commande).toLocaleString('fr-FR')}
                  </p>
                  <p style={{ color: '#666', marginTop: '0.5rem', fontStyle: 'italic', fontSize: '0.9rem' }}>
                    Restaurant: {commande.restaurant_nom}
                  </p>
                </div>
                    <span
                      className="statut-badge"
                      style={{
                        backgroundColor: getStatutColor(commande.statut),
                        color: 'white',
                        padding: '0.5rem 1rem',
                        borderRadius: '20px',
                        fontWeight: 'bold'
                      }}
                    >
                      {getStatutLabel(commande.statut)}
                    </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  {commande.adresse_livraison && (
                    <p style={{ color: '#666' }}>
                      <strong>Adresse:</strong> {commande.adresse_livraison}
                    </p>
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                  <div style={{ fontSize: '1.3rem', fontWeight: 'bold', color: '#667eea' }}>
                    Total: {parseFloat(commande.total).toFixed(0)} FCFA
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <button
                      className="btn btn-secondary"
                      onClick={async () => {
                        // Chercher la facture associée à cette commande
                        const token = localStorage.getItem('token');
                        try {
                          // D'abord, chercher dans les factures déjà chargées
                          let factureCommande = factures.find(f => f.commande_id === commande.id);
                          
                          if (factureCommande) {
                            // Si trouvée, l'afficher directement
                            voirFacture(factureCommande.id);
                            setActiveTab('factures');
                          } else {
                            // Sinon, chercher via l'API
                            const facturesRes = await fetch(`${API_URL}/paiement/factures/client/${userId}`, {
                              headers: {
                                'Authorization': `Bearer ${token}`
                              }
                            });
                            if (facturesRes.ok) {
                              const facturesData = await facturesRes.json();
                              factureCommande = facturesData.find(f => f.commande_id === commande.id);
                              if (factureCommande) {
                                voirFacture(factureCommande.id);
                                setActiveTab('factures');
                                // Recharger les factures pour mettre à jour la liste
                                chargerFactures();
                              } else {
                                showToast('Aucune facture trouvée pour cette commande. La facture sera créée après le paiement.', 'warning');
                              }
                            } else {
                              const errorData = await facturesRes.json().catch(() => ({ error: 'Erreur inconnue' }));
                              showToast('Erreur lors de la recherche de la facture: ' + (errorData.error || 'Erreur serveur'), 'error');
                            }
                          }
                        } catch (error) {
                          console.error('Erreur:', error);
                          showToast('Erreur lors de la recherche de la facture', 'error');
                        }
                      }}
                      style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}
                    >
                      📄 Voir la facture
                    </button>
                    {commande.statut === 'ready' && (
                      <WhatsAppButton
                        message={`Bonjour, ma commande #${commande.id} est prête. Pouvez-vous me donner plus d'informations sur la livraison ?`}
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* Afficher le formulaire d'avis pour les commandes livrées */}
              {commande.statut === 'delivered' && (
                <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '2px solid #eee' }}>
                  <Avis
                    commandeId={commande.id}
                    restaurantId={commande.restaurant_id}
                    existingAvis={avisParCommande[commande.id]}
                    onAvisCree={(avis) => {
                      setAvisParCommande(prev => ({
                        ...prev,
                        [commande.id]: avis
                      }));
                      setCommandesAvecAvis(prev => ({
                        ...prev,
                        [commande.id]: true
                      }));
                    }}
                  />
                </div>
              )}
            </div>
          ))
        )}
          </>
        )}
      </div>
    </div>
  );
}

export default MesCommandes;

