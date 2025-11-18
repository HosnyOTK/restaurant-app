import React, { useState, useEffect } from 'react';
import WhatsAppButton from './WhatsAppButton';
import NotificationSystem from './NotificationSystem';
import { useToast, ToastContainer } from './ToastNotification';
import BackgroundLogo from './BackgroundLogo';
import API_URL from '../config/api';

function DashboardLivreur({ user, onLogout }) {
  const [commandes, setCommandes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard'); // dashboard, en_attente, livrees, annulees
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null); // { type: 'livree' | 'annuler', commandeId: number }
  
  // Système de notifications toast
  const { toasts, showToast, removeToast } = useToast();

  useEffect(() => {
    chargerCommandes();
    // Rafraîchissement automatique toutes les 30 secondes
    const interval = setInterval(chargerCommandes, 30000);
    return () => clearInterval(interval);
  }, []);

  const chargerCommandes = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/livreur/commandes`, {
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
      'ready': 'Prête à livrer',
      'delivered': 'Livrée',
      'annulee': 'Annulée'
    };
    return labels[statut] || statut;
  };

  const getStatutColor = (statut) => {
    const colors = {
      'pending': '#6c757d',
      'confirmed': '#007bff',
      'preparing': '#ffc107',
      'ready': '#28a745',
      'delivered': '#17a2b8',
      'annulee': '#dc3545'
    };
    return colors[statut] || '#6c757d';
  };

  const marquerCommeLivree = (commandeId) => {
    setConfirmAction({ type: 'livree', commandeId });
    setShowConfirmModal(true);
  };

  const annulerCommande = (commandeId) => {
    setConfirmAction({ type: 'annuler', commandeId });
    setShowConfirmModal(true);
  };

  const confirmerAction = async () => {
    if (!confirmAction) return;

    try {
      const token = localStorage.getItem('token');
      let response;

      if (confirmAction.type === 'livree') {
        response = await fetch(`${API_URL}/livreur/commandes/${confirmAction.commandeId}/delivered`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          showToast('Commande marquée comme livrée avec succès', 'success');
          chargerCommandes();
        } else {
          const error = await response.json();
          showToast('Erreur: ' + (error.error || 'Impossible de marquer comme livrée'), 'error');
        }
      } else if (confirmAction.type === 'annuler') {
        response = await fetch(`${API_URL}/admin/commandes/${confirmAction.commandeId}/statut`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ statut: 'annulee' })
        });

        if (response.ok) {
          showToast('Commande annulée avec succès', 'success');
          chargerCommandes();
        } else {
          const error = await response.json();
          showToast('Erreur: ' + (error.error || 'Impossible d\'annuler la commande'), 'error');
        }
      }
    } catch (error) {
      console.error('Erreur:', error);
      showToast('Erreur lors de l\'opération', 'error');
    } finally {
      setShowConfirmModal(false);
      setConfirmAction(null);
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ padding: '2rem', textAlign: 'center' }}>
        <p>Chargement des commandes...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-livreur">
      <BackgroundLogo />
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <NotificationSystem user={user} onRefresh={chargerCommandes} />
      {/* Header minimaliste avec déconnexion */}
      <div style={{ 
        background: 'var(--color-primary)', 
        color: 'white', 
        padding: '1rem 2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <h1 style={{ margin: 0, fontSize: '1.5rem' }}>Dashboard Livreur</h1>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <span style={{ fontSize: '0.9rem' }}>
            {user.prenom} {user.nom}
          </span>
          <button 
            className="btn btn-secondary" 
            onClick={onLogout}
            style={{ 
              background: 'var(--color-surface)', 
              color: 'var(--color-primary)',
              border: 'none'
            }}
          >
            Déconnexion
          </button>
        </div>
      </div>

      <div className="container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2rem', marginBottom: '1rem' }}>
          <div>
            <h2 style={{ margin: 0 }}>Mes Livraisons</h2>
          </div>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <span style={{ fontSize: '0.9rem', color: '#666' }}>
              🔄 Actualisation automatique (30s)
            </span>
            <button className="btn btn-primary" onClick={chargerCommandes}>
              🔄 Actualiser
            </button>
          </div>
        </div>

        {/* Onglets */}
        <div style={{ 
          display: 'flex', 
          gap: '0.5rem', 
          marginBottom: '2rem',
          borderBottom: '2px solid #eee',
          paddingBottom: '0.5rem',
          flexWrap: 'wrap'
        }}>
          <button
            className={`btn ${activeTab === 'dashboard' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('dashboard')}
            style={{ 
              padding: '0.75rem 1.5rem',
              border: 'none',
              borderRadius: '8px 8px 0 0',
              background: activeTab === 'dashboard' ? 'var(--color-primary)' : '#f0f0f0',
              color: activeTab === 'dashboard' ? 'white' : '#666',
              fontWeight: activeTab === 'dashboard' ? 'bold' : 'normal'
            }}
          >
            📊 Dashboard
          </button>
          <button
            className={`btn ${activeTab === 'en_attente' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('en_attente')}
            style={{ 
              padding: '0.75rem 1.5rem',
              border: 'none',
              borderRadius: '8px 8px 0 0',
              background: activeTab === 'en_attente' ? 'var(--color-primary)' : '#f0f0f0',
              color: activeTab === 'en_attente' ? 'white' : '#666',
              fontWeight: activeTab === 'en_attente' ? 'bold' : 'normal'
            }}
          >
            📦 En attente ({commandes.filter(c => ['pending', 'confirmed', 'preparing', 'ready'].includes(c.statut)).length})
          </button>
          <button
            className={`btn ${activeTab === 'livrees' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('livrees')}
            style={{ 
              padding: '0.75rem 1.5rem',
              border: 'none',
              borderRadius: '8px 8px 0 0',
              background: activeTab === 'livrees' ? 'var(--color-primary)' : '#f0f0f0',
              color: activeTab === 'livrees' ? 'white' : '#666',
              fontWeight: activeTab === 'livrees' ? 'bold' : 'normal'
            }}
          >
            ✅ Livrées ({commandes.filter(c => c.statut === 'delivered').length})
          </button>
          <button
            className={`btn ${activeTab === 'annulees' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('annulees')}
            style={{ 
              padding: '0.75rem 1.5rem',
              border: 'none',
              borderRadius: '8px 8px 0 0',
              background: activeTab === 'annulees' ? 'var(--color-primary)' : '#f0f0f0',
              color: activeTab === 'annulees' ? 'white' : '#666',
              fontWeight: activeTab === 'annulees' ? 'bold' : 'normal'
            }}
          >
            ❌ Annulées ({commandes.filter(c => c.statut === 'annulee').length})
          </button>
        </div>

        {/* Dashboard avec statistiques */}
        {activeTab === 'dashboard' && (() => {
          const commandesLivrees = commandes.filter(c => c.statut === 'delivered');
          const commandesEnAttente = commandes.filter(c => ['pending', 'confirmed', 'preparing', 'ready'].includes(c.statut));
          const commandesAnnulees = commandes.filter(c => c.statut === 'annulee');
          
          // Statistiques du jour
          const aujourdhui = new Date().toISOString().split('T')[0];
          const livreesAujourdhui = commandesLivrees.filter(c => {
            const dateLivraison = c.date_livraison ? new Date(c.date_livraison).toISOString().split('T')[0] : null;
            return dateLivraison === aujourdhui;
          });
          
          // Statistiques du mois
          const moisActuel = new Date().getMonth();
          const anneeActuelle = new Date().getFullYear();
          const livreesCeMois = commandesLivrees.filter(c => {
            if (!c.date_livraison) return false;
            const date = new Date(c.date_livraison);
            return date.getMonth() === moisActuel && date.getFullYear() === anneeActuelle;
          });
          
          // Total des livraisons
          const totalLivrees = commandesLivrees.length;
          
          // Chiffre d'affaires total livré
          const chiffreAffairesTotal = commandesLivrees.reduce((sum, c) => sum + parseFloat(c.total || 0), 0);
          const chiffreAffairesMois = livreesCeMois.reduce((sum, c) => sum + parseFloat(c.total || 0), 0);
          const chiffreAffairesJour = livreesAujourdhui.reduce((sum, c) => sum + parseFloat(c.total || 0), 0);
          
          return (
            <div>
              {/* Cartes de statistiques */}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
                gap: '1.5rem', 
                marginBottom: '2rem' 
              }}>
                <div style={{ 
                  background: 'var(--color-surface)', 
                  padding: '1.5rem', 
                  borderRadius: '12px', 
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  borderLeft: '4px solid var(--color-primary)'
                }}>
                  <h3 style={{ color: '#666', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Livraisons Aujourd'hui</h3>
                  <p style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--color-primary)', margin: 0 }}>
                    {livreesAujourdhui.length}
                  </p>
                  <p style={{ color: '#999', fontSize: '0.85rem', marginTop: '0.5rem', margin: 0 }}>
                    {chiffreAffairesJour.toFixed(0)} FCFA
                  </p>
                </div>

                <div style={{ 
                  background: 'var(--color-surface)', 
                  padding: '1.5rem', 
                  borderRadius: '12px', 
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  borderLeft: '4px solid #28a745'
                }}>
                  <h3 style={{ color: '#666', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Livraisons Ce Mois</h3>
                  <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#28a745', margin: 0 }}>
                    {livreesCeMois.length}
                  </p>
                  <p style={{ color: '#999', fontSize: '0.85rem', marginTop: '0.5rem', margin: 0 }}>
                    {chiffreAffairesMois.toFixed(0)} FCFA
                  </p>
                </div>

                <div style={{ 
                  background: 'var(--color-surface)', 
                  padding: '1.5rem', 
                  borderRadius: '12px', 
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  borderLeft: '4px solid #17a2b8'
                }}>
                  <h3 style={{ color: '#666', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Total Livraisons</h3>
                  <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#17a2b8', margin: 0 }}>
                    {totalLivrees}
                  </p>
                  <p style={{ color: '#999', fontSize: '0.85rem', marginTop: '0.5rem', margin: 0 }}>
                    {chiffreAffairesTotal.toFixed(0)} FCFA total
                  </p>
                </div>

                <div style={{ 
                  background: 'var(--color-surface)', 
                  padding: '1.5rem', 
                  borderRadius: '12px', 
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  borderLeft: '4px solid #ffc107'
                }}>
                  <h3 style={{ color: '#666', marginBottom: '0.5rem', fontSize: '0.9rem' }}>En Attente</h3>
                  <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#ffc107', margin: 0 }}>
                    {commandesEnAttente.length}
                  </p>
                  <p style={{ color: '#999', fontSize: '0.85rem', marginTop: '0.5rem', margin: 0 }}>
                    Commandes à livrer
                  </p>
                </div>
              </div>

              {/* Résumé des commandes */}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
                gap: '1.5rem', 
                marginBottom: '2rem' 
              }}>
                <div style={{ 
                  background: 'var(--color-surface)', 
                  padding: '1.5rem', 
                  borderRadius: '12px', 
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}>
                  <h3 style={{ marginBottom: '1rem', color: '#333' }}>📊 Répartition des Commandes</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#666' }}>✅ Livrées</span>
                      <span style={{ fontWeight: 'bold', color: '#28a745', fontSize: '1.2rem' }}>
                        {totalLivrees}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#666' }}>📦 En attente</span>
                      <span style={{ fontWeight: 'bold', color: '#ffc107', fontSize: '1.2rem' }}>
                        {commandesEnAttente.length}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#666' }}>❌ Annulées</span>
                      <span style={{ fontWeight: 'bold', color: '#dc3545', fontSize: '1.2rem' }}>
                        {commandesAnnulees.length}
                      </span>
                    </div>
                  </div>
                </div>

                <div style={{ 
                  background: 'var(--color-surface)', 
                  padding: '1.5rem', 
                  borderRadius: '12px', 
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}>
                  <h3 style={{ marginBottom: '1rem', color: '#333' }}>💰 Chiffre d'Affaires</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                      <span style={{ color: '#666', fontSize: '0.9rem' }}>Aujourd'hui</span>
                      <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--color-primary)', margin: '0.5rem 0 0 0' }}>
                        {chiffreAffairesJour.toFixed(0)} FCFA
                      </p>
                    </div>
                    <div>
                      <span style={{ color: '#666', fontSize: '0.9rem' }}>Ce mois</span>
                      <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#28a745', margin: '0.5rem 0 0 0' }}>
                        {chiffreAffairesMois.toFixed(0)} FCFA
                      </p>
                    </div>
                    <div>
                      <span style={{ color: '#666', fontSize: '0.9rem' }}>Total</span>
                      <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#17a2b8', margin: '0.5rem 0 0 0' }}>
                        {chiffreAffairesTotal.toFixed(0)} FCFA
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Commandes récentes */}
              {commandesEnAttente.length > 0 && (
                <div style={{ 
                  background: 'var(--color-surface)', 
                  padding: '1.5rem', 
                  borderRadius: '12px', 
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}>
                  <h3 style={{ marginBottom: '1rem', color: '#333' }}>🚚 Commandes à Livrer ({commandesEnAttente.length})</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {commandesEnAttente.slice(0, 5).map(commande => (
                      <div 
                        key={commande.id}
                        style={{ 
                          padding: '1rem', 
                          background: 'var(--color-light)', 
                          borderRadius: '8px',
                          borderLeft: '4px solid var(--color-primary)'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                          <div>
                            <strong style={{ color: '#333' }}>Commande #{commande.id}</strong>
                            <p style={{ margin: '0.5rem 0 0 0', color: '#666', fontSize: '0.9rem' }}>
                              {commande.client_prenom} {commande.client_nom} • {parseFloat(commande.total).toFixed(0)} FCFA
                            </p>
                            <p style={{ margin: '0.25rem 0 0 0', color: '#999', fontSize: '0.85rem' }}>
                              📍 {commande.adresse_livraison?.substring(0, 50)}...
                            </p>
                          </div>
                          <span style={{
                            padding: '0.25rem 0.75rem',
                            borderRadius: '12px',
                            fontSize: '0.75rem',
                            fontWeight: 'bold',
                            color: 'white',
                            background: getStatutColor(commande.statut)
                          }}>
                            {getStatutLabel(commande.statut)}
                          </span>
                        </div>
                      </div>
                    ))}
                    {commandesEnAttente.length > 5 && (
                      <button
                        onClick={() => setActiveTab('en_attente')}
                        style={{
                          marginTop: '0.5rem',
                          padding: '0.75rem',
                          background: 'var(--color-primary)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontWeight: 500
                        }}
                      >
                        Voir toutes les commandes en attente ({commandesEnAttente.length})
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {/* Filtrage des commandes selon l'onglet actif */}
        {activeTab !== 'dashboard' && (() => {
          let commandesFiltrees = [];
          if (activeTab === 'en_attente') {
            commandesFiltrees = commandes.filter(c => ['pending', 'confirmed', 'preparing', 'ready'].includes(c.statut));
          } else if (activeTab === 'livrees') {
            commandesFiltrees = commandes
              .filter(c => c.statut === 'delivered')
              .sort((a, b) => {
                // Trier par date de livraison (la plus récente en premier)
                const dateA = a.date_livraison ? new Date(a.date_livraison).getTime() : 0;
                const dateB = b.date_livraison ? new Date(b.date_livraison).getTime() : 0;
                return dateB - dateA; // Ordre décroissant (dernière livrée en premier)
              });
          } else if (activeTab === 'annulees') {
            commandesFiltrees = commandes.filter(c => c.statut === 'annulee');
          }

          return commandesFiltrees.length === 0 ? (
            <div className="empty-state">
              <p>
                {activeTab === 'en_attente' && 'Aucune commande en attente de livraison'}
                {activeTab === 'livrees' && 'Aucune commande livrée'}
                {activeTab === 'annulees' && 'Aucune commande annulée'}
              </p>
            </div>
          ) : (
            commandesFiltrees.map(commande => (
            <div key={commande.id} className="commande-card" style={{ marginBottom: '1rem' }}>
              <div className="commande-header">
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                    <h2 style={{ margin: 0 }}>Commande #{commande.id}</h2>
                    <span style={{
                      padding: '0.5rem 1rem',
                      borderRadius: '20px',
                      fontSize: '0.85rem',
                      fontWeight: 'bold',
                      color: 'white',
                      background: getStatutColor(commande.statut)
                    }}>
                      {getStatutLabel(commande.statut)}
                    </span>
                  </div>
                  <div style={{ marginTop: '1rem' }}>
                    <p><strong>👤 Client:</strong> {commande.client_nom} {commande.client_prenom}</p>
                    <p><strong>📞 Téléphone WhatsApp:</strong> {commande.telephone || 'Non renseigné'}</p>
                    <p><strong>📍 Adresse de livraison:</strong></p>
                    <p style={{ paddingLeft: '1rem', background: 'var(--color-light)', padding: '0.5rem', borderRadius: '4px', marginTop: '0.5rem' }}>
                      {commande.adresse_livraison}
                    </p>
                    <p><strong>🏪 Restaurant:</strong> {commande.restaurant_nom}</p>
                    <p><strong>📍 Adresse restaurant:</strong> {commande.restaurant_adresse}</p>
                  </div>

                  {commande.notes && (
                    <div style={{ marginTop: '1rem', padding: '0.5rem', background: '#fff3cd', borderRadius: '4px' }}>
                      <strong>📝 Notes:</strong> {commande.notes}
                    </div>
                  )}

                  <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #eee' }}>
                    <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#667eea' }}>
                      Total: {parseFloat(commande.total).toFixed(0)} FCFA
                    </p>
                    <p style={{ color: '#666', fontSize: '0.9rem' }}>
                      Commande passée le: {new Date(commande.date_commande).toLocaleString('fr-FR')}
                    </p>
                  </div>
                </div>
              </div>

              <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '2px solid #eee', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                {/* Bouton WhatsApp uniquement pour les commandes en attente de livraison */}
                {activeTab === 'en_attente' && commande.telephone && (
                  <WhatsAppButton
                    phoneNumber={commande.telephone}
                    message={`Bonjour ${commande.client_prenom}, je suis votre livreur. Je suis en route pour livrer votre commande #${commande.id} à l'adresse: ${commande.adresse_livraison}`}
                  />
                )}
                {activeTab === 'en_attente' && (
                  <>
                    {(commande.statut === 'ready' || commande.statut === 'preparing') && (
                      <button
                        className="btn btn-primary"
                        onClick={() => marquerCommeLivree(commande.id)}
                        style={{ 
                          fontSize: '0.9rem', 
                          padding: '0.75rem 1.25rem',
                          background: 'var(--color-primary)',
                          color: 'var(--color-white)',
                          border: '1px solid var(--color-primary)',
                          borderRadius: '10px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                          boxShadow: 'var(--shadow-soft)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.transform = 'translateY(-2px)';
                          e.target.style.boxShadow = 'var(--shadow-medium)';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.transform = 'translateY(0)';
                          e.target.style.boxShadow = 'var(--shadow-soft)';
                        }}
                      >
                        <span>✅</span>
                        <span>Marquer comme livrée</span>
                      </button>
                    )}
                    {commande.statut !== 'annulee' && commande.statut !== 'delivered' && (
                      <button
                        className="btn btn-secondary"
                        onClick={() => annulerCommande(commande.id)}
                        style={{ 
                          fontSize: '0.9rem', 
                          padding: '0.75rem 1.25rem',
                          background: 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '10px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                          boxShadow: '0 4px 15px rgba(220, 53, 69, 0.3)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem'
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
                        <span>❌</span>
                        <span>Annuler</span>
                      </button>
                    )}
                  </>
                )}
                {commande.statut === 'delivered' && (
                  <span style={{ 
                    padding: '0.75rem 1.5rem', 
                    background: '#17a2b8', 
                    color: 'white', 
                    borderRadius: '8px',
                    fontSize: '1.1rem',
                    fontWeight: 'bold'
                  }}>
                    ✓ Livrée le {commande.date_livraison ? new Date(commande.date_livraison).toLocaleString('fr-FR') : ''}
                  </span>
                )}
                {commande.statut === 'annulee' && (
                  <span style={{ 
                    padding: '0.75rem 1.5rem', 
                    background: '#dc3545', 
                    color: 'white', 
                    borderRadius: '8px',
                    fontSize: '1.1rem',
                    fontWeight: 'bold'
                  }}>
                    ❌ Commande annulée
                  </span>
                )}
              </div>
            </div>
            ))
          );
        })()}
      </div>

      {/* Modal de confirmation personnalisée */}
      {showConfirmModal && confirmAction && (
        <div 
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
            zIndex: 10000,
            padding: '1rem'
          }}
          onClick={() => {
            setShowConfirmModal(false);
            setConfirmAction(null);
          }}
        >
          <div 
            style={{
              background: 'var(--color-surface)',
              borderRadius: '16px',
              padding: '2rem',
              maxWidth: '500px',
              width: '100%',
              boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ 
              marginTop: 0, 
              marginBottom: '1rem',
              color: '#333',
              fontSize: '1.5rem'
            }}>
              {confirmAction.type === 'livree' ? '✅ Confirmer la livraison' : '❌ Confirmer l\'annulation'}
            </h2>
            <p style={{ 
              marginBottom: '2rem',
              color: '#666',
              fontSize: '1rem',
              lineHeight: '1.6'
            }}>
              {confirmAction.type === 'livree' 
                ? 'Êtes-vous sûr de vouloir marquer cette commande comme livrée ?'
                : 'Êtes-vous sûr de vouloir annuler cette commande ? Cette action est irréversible.'}
            </p>
            <div style={{ 
              display: 'flex', 
              gap: '1rem', 
              justifyContent: 'flex-end' 
            }}>
              <button
                onClick={() => {
                  setShowConfirmModal(false);
                  setConfirmAction(null);
                }}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: 'var(--color-secondary)',
                  color: 'var(--color-white)',
                  border: '1px solid var(--color-secondary)',
                  borderRadius: '10px',
                  fontSize: '1rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = 'var(--color-primary)';
                  e.target.style.borderColor = 'var(--color-primary)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'var(--color-secondary)';
                  e.target.style.borderColor = 'var(--color-secondary)';
                }}
              >
                Annuler
              </button>
              <button
                onClick={confirmerAction}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: confirmAction.type === 'livree' 
                    ? 'var(--color-primary)' 
                    : 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '1rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: confirmAction.type === 'livree' 
                    ? 'var(--shadow-soft)' 
                    : '0 4px 15px rgba(220, 53, 69, 0.3)'
                }}
                onMouseEnter={(e) => {
                  if (confirmAction.type === 'livree') {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = 'var(--shadow-medium)';
                  } else {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 6px 20px rgba(220, 53, 69, 0.4)';
                    e.target.style.background = 'linear-gradient(135deg, #c82333 0%, #bd2130 100%)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (confirmAction.type === 'livree') {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = 'var(--shadow-soft)';
                  } else {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 4px 15px rgba(220, 53, 69, 0.3)';
                    e.target.style.background = 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)';
                  }
                }}
              >
                {confirmAction.type === 'livree' ? 'Confirmer' : 'Annuler la commande'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DashboardLivreur;


