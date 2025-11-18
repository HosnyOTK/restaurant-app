import React, { useState, useEffect } from 'react';
import NotificationSystem from './NotificationSystem';
import StatistiquesVentes from './StatistiquesVentes';
import AdminMenu from './AdminMenu';
import WhatsAppButton from './WhatsAppButton';
import { useToast, ToastContainer } from './ToastNotification';
import Facture from './Facture';
import BackgroundLogo from './BackgroundLogo';
import API_URL from '../config/api';

function DashboardAdmin({ user }) {
  const [statistiques, setStatistiques] = useState(null);
  const [commandes, setCommandes] = useState([]);
  const [clients, setClients] = useState([]);
  const [livreurs, setLivreurs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('stats'); // stats, ventes, commandes, clients, livreurs, menu
  
  // Système de notifications toast
  const { toasts, showToast, removeToast } = useToast();
  const [showLivreurForm, setShowLivreurForm] = useState(false);
  const [editingLivreur, setEditingLivreur] = useState(null);
  const [clientSubTab, setClientSubTab] = useState('liste'); // liste, detail
  const [selectedClient, setSelectedClient] = useState(null);
  const [clientDetails, setClientDetails] = useState(null);
  const [loadingClientDetails, setLoadingClientDetails] = useState(false);
  const [facturesCommandes, setFacturesCommandes] = useState({}); // {commandeId: facture}
  const [facturesClient, setFacturesClient] = useState([]); // Factures du client sélectionné
  const [loadingFactures, setLoadingFactures] = useState(false);
  const [factureSelectionnee, setFactureSelectionnee] = useState(null);
  const [showAttributionModal, setShowAttributionModal] = useState(false);
  const [commandeAAttribuer, setCommandeAAttribuer] = useState(null);
  
  // Pagination pour les commandes
  const [currentPageCommandes, setCurrentPageCommandes] = useState(1);
  const itemsPerPageCommandes = 10;
  // S'assurer que commandes est toujours un tableau
  const commandesArray = Array.isArray(commandes) ? commandes : [];
  const totalPagesCommandes = Math.ceil(commandesArray.length / itemsPerPageCommandes);
  const startIndexCommandes = (currentPageCommandes - 1) * itemsPerPageCommandes;
  const endIndexCommandes = startIndexCommandes + itemsPerPageCommandes;
  const commandesToDisplay = commandesArray.slice(startIndexCommandes, endIndexCommandes);

  useEffect(() => {
    chargerDonnees();
  }, []);

  // Réinitialiser la page des commandes quand on change d'onglet ou recharge
  useEffect(() => {
    setCurrentPageCommandes(1);
  }, [activeTab, commandesArray.length]); // commandesArray est recalculé à chaque render avec la vérification Array.isArray

  // Charger les détails d'un client
  const chargerDetailsClient = async (clientId) => {
    try {
      setLoadingClientDetails(true);
      const token = localStorage.getItem('token');
      const headers = {
        'Authorization': `Bearer ${token}`
      };

      // Charger les informations du client
      const clientRes = await fetch(`${API_URL}/clients/${clientId}`, { headers });
      const clientData = await clientRes.json();

      // Charger les commandes du client
      const commandesRes = await fetch(`${API_URL}/admin/clients/${clientId}/commandes`, { headers });
      const commandesData = await commandesRes.json();

      // Charger les détails de chaque commande
      const commandesAvecDetails = await Promise.all(commandesData.map(async (commande) => {
        try {
          const detailsRes = await fetch(`${API_URL}/commandes/${commande.id}`, { headers });
          const detailsData = await detailsRes.json();
          return {
            ...commande,
            details: detailsData.details || []
          };
        } catch (err) {
          return {
            ...commande,
            details: []
          };
        }
      }));

      // Charger les factures du client
      setLoadingFactures(true);
      try {
        const facturesRes = await fetch(`${API_URL}/paiement/factures/client/${clientId}`, { headers });
        if (facturesRes.ok) {
          const facturesData = await facturesRes.json();
          setFacturesClient(Array.isArray(facturesData) ? facturesData : []);
        } else {
          setFacturesClient([]);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des factures:', error);
        setFacturesClient([]);
      } finally {
        setLoadingFactures(false);
      }

      setClientDetails({
        ...clientData,
        commandes: commandesAvecDetails
      });
      setSelectedClient(clientId);
      setClientSubTab('detail');
    } catch (error) {
      console.error('Erreur lors du chargement des détails du client:', error);
      showToast('Erreur lors du chargement des détails du client', 'error');
    } finally {
      setLoadingClientDetails(false);
    }
  };

  // Charger une facture complète
  const chargerFacture = async (factureId) => {
    try {
      const token = localStorage.getItem('token');
      const headers = {
        'Authorization': `Bearer ${token}`
      };

      const response = await fetch(`${API_URL}/paiement/factures/${factureId}`, { headers });
      if (response.ok) {
        const factureData = await response.json();
        setFactureSelectionnee(factureData);
      } else {
        showToast('Erreur lors du chargement de la facture', 'error');
      }
    } catch (error) {
      console.error('Erreur lors du chargement de la facture:', error);
      showToast('Erreur lors du chargement de la facture', 'error');
    }
  };

  // Trouver la facture associée à une commande
  const trouverFactureParCommande = (commandeId) => {
    return facturesClient.find(f => f.commande_id === commandeId);
  };

  const chargerFactureCommande = async (commandeId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/paiement/factures`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const factures = await response.json();
        const factureCommande = factures.find(f => f.commande_id === commandeId);
        if (factureCommande) {
          setFacturesCommandes(prev => ({
            ...prev,
            [commandeId]: factureCommande
          }));
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement de la facture:', error);
    }
  };

  const chargerDonnees = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = {
        'Authorization': `Bearer ${token}`
      };

      // Charger les statistiques
      const statsRes = await fetch(`${API_URL}/admin/statistiques`, { headers });
      const statsData = await statsRes.json();
      setStatistiques(statsData);

      // Charger les commandes
      const commandesRes = await fetch(`${API_URL}/admin/commandes`, { headers });
      const commandesData = await commandesRes.json();
      // S'assurer que commandesData est toujours un tableau
      setCommandes(Array.isArray(commandesData) ? commandesData : []);

      // Charger les clients
      const clientsRes = await fetch(`${API_URL}/admin/clients`, { headers });
      const clientsData = await clientsRes.json();
      setClients(clientsData);

      // Charger les livreurs
      const livreursRes = await fetch(`${API_URL}/admin/livreurs`, { headers });
      const livreursData = await livreursRes.json();
      setLivreurs(livreursData);

      // Charger les factures pour afficher les informations bancaires
      const facturesRes = await fetch(`${API_URL}/paiement/factures`, { headers });
      if (facturesRes.ok) {
        const facturesData = await facturesRes.json();
        const facturesMap = {};
        facturesData.forEach(facture => {
          facturesMap[facture.commande_id] = facture;
        });
        setFacturesCommandes(facturesMap);
      }

      setLoading(false);
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
      setLoading(false);
    }
  };

  const changerStatut = async (commandeId, nouveauStatut) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/admin/commandes/${commandeId}/statut`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ statut: nouveauStatut })
      });

      if (response.ok) {
        chargerDonnees(); // Recharger les données
        showToast('Statut de la commande mis à jour', 'success');
      } else {
        const error = await response.json();
        showToast('Erreur: ' + (error.error || 'Impossible de mettre à jour le statut'), 'error');
      }
    } catch (error) {
      console.error('Erreur:', error);
      showToast('Erreur lors de la mise à jour', 'error');
    }
  };

  const attribuerCommande = (commande) => {
    setCommandeAAttribuer(commande);
    setShowAttributionModal(true);
  };

  const confirmerAttribution = async (livreurId) => {
    if (!commandeAAttribuer || !livreurId) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/admin/commandes/${commandeAAttribuer.id}/livreur`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ livreur_id: livreurId })
      });

      if (response.ok) {
        const data = await response.json();
        showToast(`Commande attribuée à ${data.livreur.prenom} ${data.livreur.nom}`, 'success');
        chargerDonnees(); // Recharger les données
        setShowAttributionModal(false);
        setCommandeAAttribuer(null);
      } else {
        const error = await response.json();
        showToast('Erreur: ' + (error.error || 'Impossible d\'attribuer la commande'), 'error');
      }
    } catch (error) {
      console.error('Erreur:', error);
      showToast('Erreur lors de l\'attribution', 'error');
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

  const supprimerLivreur = async (livreurId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce livreur ? Cette action est irréversible.')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/admin/livreurs/${livreurId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        showToast('Livreur supprimé avec succès!', 'success');
        chargerDonnees(); // Recharger les données
      } else {
        const error = await response.json();
        showToast('Erreur: ' + (error.error || 'Impossible de supprimer le livreur'), 'error');
      }
    } catch (error) {
      console.error('Erreur:', error);
      showToast('Erreur lors de la suppression', 'error');
    }
  };

  const supprimerUtilisateur = async (userId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ? Cette action est irréversible.')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/admin/utilisateurs/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        showToast('Utilisateur supprimé avec succès!', 'success');
        chargerDonnees(); // Recharger les données
      } else {
        const error = await response.json();
        showToast('Erreur: ' + (error.error || 'Impossible de supprimer l\'utilisateur'), 'error');
      }
    } catch (error) {
      console.error('Erreur:', error);
      showToast('Erreur lors de la suppression', 'error');
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ padding: '2rem', textAlign: 'center' }}>
        <p>Chargement des données...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-admin">
      <BackgroundLogo />
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <NotificationSystem user={user} onRefresh={chargerDonnees} />
      <div className="container">
        <h1 style={{ marginBottom: '2rem' }}>Dashboard Administrateur</h1>

        {/* Onglets */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '2px solid #eee' }}>
          <button
            className={`btn ${activeTab === 'stats' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('stats')}
          >
            Statistiques
          </button>
          <button
            className={`btn ${activeTab === 'ventes' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('ventes')}
          >
            📊 Ventes
          </button>
          <button
            className={`btn ${activeTab === 'commandes' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('commandes')}
          >
            Commandes ({Array.isArray(commandes) ? commandes.length : 0})
          </button>
          <button
            className={`btn ${activeTab === 'clients' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('clients')}
          >
            Utilisateurs ({clients.length})
          </button>
          <button
            className={`btn ${activeTab === 'livreurs' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('livreurs')}
          >
            Livreurs ({livreurs.length})
          </button>
          <button
            className={`btn ${activeTab === 'menu' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('menu')}
          >
            Gestion Menu
          </button>
        </div>

        {/* Statistiques */}
        {activeTab === 'stats' && statistiques && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
              <div className="stat-card" style={{ background: 'var(--color-surface)', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                <h3 style={{ color: '#666', marginBottom: '0.5rem' }}>Total Commandes</h3>
                <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#667eea' }}>
                  {statistiques.totalCommandes}
                </p>
              </div>

              <div className="stat-card" style={{ background: 'var(--color-surface)', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                <h3 style={{ color: '#666', marginBottom: '0.5rem' }}>Chiffre d'Affaires</h3>
                <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#28a745' }}>
                  {parseFloat(statistiques.chiffreAffaires || 0).toFixed(0)} FCFA
                </p>
              </div>

              <div className="stat-card" style={{ background: 'var(--color-surface)', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                <h3 style={{ color: '#666', marginBottom: '0.5rem' }}>CA du Mois</h3>
                <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#17a2b8' }}>
                  {parseFloat(statistiques.chiffreAffairesMois || 0).toFixed(0)} FCFA
                </p>
              </div>

              <div className="stat-card" style={{ background: 'var(--color-surface)', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                <h3 style={{ color: '#666', marginBottom: '0.5rem' }}>Total Clients</h3>
                <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#764ba2' }}>
                  {statistiques.totalClients}
                </p>
              </div>
            </div>

            <div style={{ background: 'var(--color-surface)', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
              <h3 style={{ marginBottom: '1rem' }}>Commandes par Statut</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                {statistiques.commandesParStatut?.map(stat => (
                  <div key={stat.statut} style={{ padding: '1rem', background: 'var(--color-light)', borderRadius: '8px' }}>
                    <strong>{getStatutLabel(stat.statut)}</strong>
                    <p style={{ fontSize: '1.5rem', color: getStatutColor(stat.statut), marginTop: '0.5rem' }}>
                      {stat.nombre}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Statistiques de Ventes */}
        {activeTab === 'ventes' && (
          <StatistiquesVentes />
        )}

        {/* Commandes */}
        {activeTab === 'commandes' && (
          <div>
            <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2>Toutes les Commandes</h2>
              <button className="btn btn-primary" onClick={chargerDonnees}>
                🔄 Actualiser
              </button>
            </div>

            {commandesArray.length === 0 ? (
              <div className="empty-state">
                <p>Aucune commande pour le moment</p>
              </div>
            ) : (
              <>
                {commandesToDisplay.map(commande => (
                <div key={commande.id} className="commande-card" style={{ marginBottom: '1rem' }}>
                  <div className="commande-header">
                    <div>
                      <h3>Commande #{commande.id}</h3>
                      <p style={{ color: '#666', marginTop: '0.5rem' }}>
                        Client: {commande.client_nom} {commande.client_prenom} ({commande.client_email})
                      </p>
                      <p style={{ color: '#666' }}>
                        Restaurant: {commande.restaurant_nom}
                      </p>
                      <p style={{ color: '#666' }}>
                        Date: {new Date(commande.date_commande).toLocaleString('fr-FR')}
                      </p>
                      {commande.livreur && (
                        <p style={{ color: '#667eea', fontWeight: 'bold', marginTop: '0.5rem' }}>
                          🚴 Livreur: {commande.livreur.prenom} {commande.livreur.nom}
                          {commande.livreur.telephone && ` (${commande.livreur.telephone})`}
                        </p>
                      )}
                      {commande.statut === 'ready' && !commande.livreur && (
                        <p style={{ color: '#ff9800', fontStyle: 'italic', marginTop: '0.5rem' }}>
                          ⚠️ En attente d'attribution à un livreur
                        </p>
                      )}
                      {commande.details && (
                        <div style={{ marginTop: '0.5rem' }}>
                          <strong>Plats:</strong>
                          <ul style={{ marginTop: '0.5rem', paddingLeft: '1.5rem' }}>
                            {commande.details.map(detail => (
                              <li key={detail.id}>
                                {detail.quantite}x {detail.plat_nom} - {parseFloat(detail.sous_total).toFixed(0)} FCFA
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-end' }}>
                      <span
                        className="statut-badge"
                        style={{
                          backgroundColor: getStatutColor(commande.statut),
                          color: 'white',
                          padding: '0.75rem 1.5rem',
                          borderRadius: '25px',
                          fontWeight: 'bold',
                          fontSize: '1.1rem',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                        }}
                      >
                        📋 {getStatutLabel(commande.statut)}
                      </span>
                      <p style={{ fontSize: '1.3rem', fontWeight: 'bold', color: '#667eea', marginTop: '0.5rem' }}>
                        {parseFloat(commande.total).toFixed(0)} FCFA
                      </p>
                    </div>
                  </div>

                  {commande.adresse_livraison && (
                    <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #eee' }}>
                      <p><strong>📍 Adresse:</strong> {commande.adresse_livraison}</p>
                      <p><strong>📞 Téléphone WhatsApp:</strong> {commande.telephone}</p>
                    </div>
                  )}

                  {/* Informations bancaires si paiement à la livraison */}
                  {facturesCommandes[commande.id] && facturesCommandes[commande.id].mode_paiement === 'livraison' && facturesCommandes[commande.id].numero_carte && (
                    <div style={{ 
                      marginTop: '1rem', 
                      paddingTop: '1rem', 
                      borderTop: '1px solid #eee',
                      background: 'var(--color-light)',
                      padding: '1rem',
                      borderRadius: '8px'
                    }}>
                      <p style={{ fontWeight: 'bold', marginBottom: '0.5rem', color: '#667eea' }}>
                        💳 Informations bancaires du client:
                      </p>
                      <p><strong>Numéro de carte:</strong> {facturesCommandes[commande.id].numero_carte}</p>
                      {facturesCommandes[commande.id].date_expiration && (
                        <p><strong>Date d'expiration:</strong> {facturesCommandes[commande.id].date_expiration}</p>
                      )}
                      {facturesCommandes[commande.id].nom_titulaire && (
                        <p><strong>Titulaire:</strong> {facturesCommandes[commande.id].nom_titulaire}</p>
                      )}
                      <p style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.5rem', fontStyle: 'italic' }}>
                        ⚠️ Le CVV n'est pas stocké pour des raisons de sécurité. Demandez-le au client lors de la livraison.
                      </p>
                    </div>
                  )}

                  <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #eee' }}>
                    <strong>Actions:</strong>
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                      {commande.telephone && (
                        <WhatsAppButton
                          phoneNumber={commande.telephone}
                          message={`Bonjour ${commande.client_prenom}, concernant votre commande #${commande.id}`}
                          className=""
                        />
                      )}
                      {commande.statut === 'pending' && (
                        <>
                          <button
                            className="btn btn-primary"
                            onClick={() => changerStatut(commande.id, 'confirmed')}
                            style={{ fontSize: '0.9rem', padding: '0.5rem 1rem' }}
                          >
                            ✅ Confirmer
                          </button>
                          <button
                            className="btn btn-secondary"
                            onClick={() => {
                              if (window.confirm('Êtes-vous sûr de vouloir rejeter cette commande ?')) {
                                changerStatut(commande.id, 'annulee');
                              }
                            }}
                            style={{ fontSize: '0.9rem', padding: '0.5rem 1rem', background: '#dc3545', color: 'white' }}
                          >
                            ❌ Rejeter
                          </button>
                        </>
                      )}
                      {(commande.statut === 'confirmed' || commande.statut === 'preparing') && (
                        <button
                          className="btn btn-primary"
                          onClick={() => changerStatut(commande.id, 'ready')}
                          style={{ fontSize: '0.9rem', padding: '0.5rem 1rem', background: '#28a745' }}
                        >
                          ✅ Prête
                        </button>
                      )}
                      {(commande.statut === 'ready' || commande.statut === 'preparing') && (
                        <button
                          onClick={() => attribuerCommande(commande)}
                          style={{ 
                            fontSize: '0.9rem', 
                            padding: '0.75rem 1.5rem',
                            background: commande.livreur 
                              ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                              : 'linear-gradient(135deg, var(--color-primary) 0%, #8FB99A 100%)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '12px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            boxShadow: 'var(--shadow-soft)',
                            transition: 'all 0.3s ease',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            position: 'relative',
                            overflow: 'hidden'
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.transform = 'translateY(-2px)';
                            e.target.style.boxShadow = 'var(--shadow-medium)';
                            if (commande.livreur) {
                              e.target.style.background = 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)';
                            } else {
                              e.target.style.background = 'linear-gradient(135deg, #8FB99A 0%, var(--color-primary) 100%)';
                            }
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.transform = 'translateY(0)';
                            e.target.style.boxShadow = 'var(--shadow-soft)';
                            if (commande.livreur) {
                              e.target.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
                            } else {
                              e.target.style.background = 'linear-gradient(135deg, var(--color-primary) 0%, #8FB99A 100%)';
                            }
                          }}
                        >
                          <span style={{ fontSize: '1.1rem' }}>🚴</span>
                          <span>{commande.livreur ? 'Changer de livreur' : 'Attribuer à un livreur'}</span>
                        </button>
                      )}
                      {commande.statut === 'confirmed' && (
                        <button
                          className="btn btn-secondary"
                          onClick={() => {
                            if (window.confirm('Êtes-vous sûr de vouloir annuler cette commande ?')) {
                              changerStatut(commande.id, 'annulee');
                            }
                          }}
                          style={{ fontSize: '0.9rem', padding: '0.5rem 1rem', background: '#dc3545', color: 'white' }}
                        >
                          ❌ Annulée
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {/* Pagination */}
              {totalPagesCommandes > 1 && (
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
                    onClick={() => setCurrentPageCommandes(prev => Math.max(1, prev - 1))}
                    disabled={currentPageCommandes === 1}
                    style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}
                  >
                    ← Précédent
                  </button>
                  <span style={{ padding: '0 1rem', color: 'var(--color-secondary)' }}>
                    Page {currentPageCommandes} sur {totalPagesCommandes}
                  </span>
                  <button
                    className="btn btn-secondary"
                    onClick={() => setCurrentPageCommandes(prev => Math.min(totalPagesCommandes, prev + 1))}
                    disabled={currentPageCommandes === totalPagesCommandes}
                    style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}
                  >
                    Suivant →
                  </button>
                </div>
              )}
              </>
            )}
          </div>
        )}

        {/* Utilisateurs */}
        {activeTab === 'clients' && (
          <div>
            {/* Sous-onglets pour les clients */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '2px solid #eee', paddingBottom: '1rem' }}>
              <button
                className={`btn ${clientSubTab === 'liste' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => {
                  setClientSubTab('liste');
                  setSelectedClient(null);
                  setClientDetails(null);
                }}
                style={{ fontSize: '0.9rem', padding: '0.5rem 1rem' }}
              >
                📋 Liste des Clients
              </button>
              {clientSubTab === 'detail' && selectedClient && (
                  <button
                    className="btn btn-secondary"
                    onClick={() => {
                      setClientSubTab('liste');
                      setSelectedClient(null);
                      setClientDetails(null);
                    }}
                    style={{ fontSize: '0.9rem', padding: '0.5rem 1rem' }}
                  >
                    ← Retour à la liste
                  </button>
              )}
            </div>

            {/* Vue liste des clients */}
            {clientSubTab === 'liste' && (
              <div>
                <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h2>Tous les Clients ({clients.filter(c => c.role === 'client').length})</h2>
                  <button className="btn btn-primary" onClick={chargerDonnees}>
                    🔄 Actualiser
                  </button>
                </div>
                
                {clients.filter(c => c.role === 'client').length === 0 ? (
                  <div className="empty-state">
                    <p>Aucun client enregistré</p>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gap: '1rem', marginTop: '1rem' }}>
                    {clients.filter(c => c.role === 'client').map(client => (
                      <div 
                        key={client.id} 
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
                        onClick={() => chargerDetailsClient(client.id)}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                          <div style={{ flex: 1 }}>
                            <h3 style={{ color: '#667eea', marginBottom: '0.5rem' }}>
                              {client.prenom} {client.nom}
                            </h3>
                            <p><strong>📧 Email:</strong> {client.email}</p>
                            {client.telephone && <p><strong>📞 Téléphone:</strong> {client.telephone}</p>}
                            {client.adresse && <p><strong>📍 Adresse:</strong> {client.adresse}</p>}
                            <p><strong>📦 Commandes:</strong> {client.nbCommandes || 0}</p>
                            <p style={{ color: '#666', fontSize: '0.9rem', marginTop: '0.5rem' }}>
                              Inscrit le: {new Date(client.created_at).toLocaleDateString('fr-FR', { 
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric' 
                              })}
                            </p>
                          </div>
                          <div style={{ 
                            display: 'flex', 
                            flexDirection: 'column', 
                            gap: '0.75rem', 
                            alignItems: 'flex-end',
                            minWidth: '140px'
                          }}>
                            <button
                              className="btn btn-primary"
                              onClick={(e) => {
                                e.stopPropagation();
                                chargerDetailsClient(client.id);
                              }}
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
                                gap: '0.5rem',
                                width: '100%',
                                justifyContent: 'center'
                              }}
                              onMouseEnter={(e) => {
                                e.target.style.transform = 'translateY(-2px)';
                                e.target.style.boxShadow = 'var(--shadow-medium)';
                                e.target.style.background = 'var(--color-primary)';
                              }}
                              onMouseLeave={(e) => {
                                e.target.style.transform = 'translateY(0)';
                                e.target.style.boxShadow = 'var(--shadow-soft)';
                                e.target.style.background = 'var(--color-primary)';
                              }}
                            >
                              <span>👁️</span>
                              <span>Voir détails</span>
                            </button>
                            {client.id !== user.id && (
                              <button
                                className="btn btn-secondary"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  supprimerUtilisateur(client.id);
                                }}
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
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Vue détail d'un client */}
            {clientSubTab === 'detail' && selectedClient && (
              <div>
                {loadingClientDetails ? (
                  <div className="empty-state">
                    <p>Chargement des détails...</p>
                  </div>
                ) : clientDetails ? (
                  <div>
                    <div style={{ marginBottom: '2rem' }}>
                      <button
                        className="btn btn-secondary"
                        onClick={() => {
                          setClientSubTab('liste');
                          setSelectedClient(null);
                          setClientDetails(null);
                        }}
                        style={{ marginBottom: '1rem' }}
                      >
                        ← Retour à la liste
                      </button>
                      
                      {/* Informations personnelles du client */}
                      <div className="commande-card" style={{ marginBottom: '2rem' }}>
                        <h2 style={{ color: '#667eea', marginBottom: '1.5rem', borderBottom: '2px solid #eee', paddingBottom: '1rem' }}>
                          👤 Informations Personnelles
                        </h2>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                          <div>
                            <p><strong>Nom complet:</strong></p>
                            <p style={{ fontSize: '1.2rem', color: '#667eea' }}>
                              {clientDetails.prenom} {clientDetails.nom}
                            </p>
                          </div>
                          <div>
                            <p><strong>📧 Email:</strong></p>
                            <p>{clientDetails.email}</p>
                          </div>
                          {clientDetails.telephone && (
                            <div>
                              <p><strong>📞 Téléphone:</strong></p>
                              <p>{clientDetails.telephone}</p>
                            </div>
                          )}
                          {clientDetails.adresse && (
                            <div>
                              <p><strong>📍 Adresse:</strong></p>
                              <p>{clientDetails.adresse}</p>
                            </div>
                          )}
                          <div>
                            <p><strong>📅 Date d'inscription:</strong></p>
                            <p>
                              {new Date(clientDetails.created_at).toLocaleDateString('fr-FR', { 
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                          <div>
                            <p><strong>📦 Total de commandes:</strong></p>
                            <p style={{ fontSize: '1.2rem', color: '#28a745', fontWeight: 'bold' }}>
                              {clientDetails.commandes?.length || 0}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Historique des commandes */}
                      <div>
                        <h2 style={{ marginBottom: '1.5rem', borderBottom: '2px solid #eee', paddingBottom: '1rem' }}>
                          📋 Historique des Commandes
                        </h2>
                        {clientDetails.commandes && clientDetails.commandes.length > 0 ? (
                          <div style={{ display: 'grid', gap: '1rem' }}>
                            {clientDetails.commandes.map(commande => (
                              <div key={commande.id} className="commande-card">
                                <div className="commande-header">
                                  <div style={{ flex: 1 }}>
                                    <h3>Commande #{commande.id}</h3>
                                    <p style={{ color: '#666', marginTop: '0.5rem' }}>
                                      Restaurant: {commande.restaurant_nom || 'Non spécifié'}
                                    </p>
                                    <p style={{ color: '#666' }}>
                                      Date: {new Date(commande.date_commande).toLocaleString('fr-FR')}
                                    </p>
                                    <p style={{ color: '#666' }}>
                                      Statut: 
                                      <span 
                                        style={{
                                          backgroundColor: getStatutColor(commande.statut),
                                          color: 'white',
                                          padding: '0.25rem 0.75rem',
                                          borderRadius: '12px',
                                          marginLeft: '0.5rem',
                                          fontSize: '0.85rem'
                                        }}
                                      >
                                        {getStatutLabel(commande.statut)}
                                      </span>
                                    </p>
                                    
                                    {/* Détails des plats */}
                                    {commande.details && commande.details.length > 0 && (
                                      <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #eee' }}>
                                        <strong>Plats commandés:</strong>
                                        <ul style={{ marginTop: '0.5rem', paddingLeft: '1.5rem' }}>
                                          {commande.details.map((detail, idx) => (
                                            <li key={idx} style={{ marginBottom: '0.5rem' }}>
                                              {detail.quantite}x {detail.plat_nom} - {parseFloat(detail.sous_total || detail.prix * detail.quantite).toFixed(0)} FCFA
                                            </li>
                                          ))}
                                        </ul>
                                      </div>
                                    )}

                                    {commande.adresse_livraison && (
                                      <div style={{ marginTop: '0.5rem' }}>
                                        <p><strong>📍 Adresse de livraison:</strong> {commande.adresse_livraison}</p>
                                      </div>
                                    )}
                                    {commande.notes && (
                                      <div style={{ marginTop: '0.5rem' }}>
                                        <p><strong>📝 Notes:</strong> {commande.notes}</p>
                                      </div>
                                    )}
                                  </div>
                                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                                    <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#667eea' }}>
                                      {parseFloat(commande.total).toFixed(0)} FCFA
                                    </p>
                                    {commande.telephone && (
                                      <WhatsAppButton
                                        phoneNumber={commande.telephone}
                                        message={`Bonjour ${clientDetails.prenom}, concernant votre commande #${commande.id}`}
                                      />
                                    )}
                                  </div>
                                </div>
                                
                                {/* Bouton Voir facture à la base de la commande */}
                                {(() => {
                                  const factureCommande = trouverFactureParCommande(commande.id);
                                  return factureCommande ? (
                                    <div style={{ 
                                      marginTop: '1rem', 
                                      paddingTop: '1rem', 
                                      borderTop: '2px solid #eee',
                                      display: 'flex',
                                      justifyContent: 'center'
                                    }}>
                                      <button
                                        className="btn btn-primary"
                                        onClick={() => chargerFacture(factureCommande.id)}
                                        style={{ 
                                          fontSize: '0.9rem', 
                                          padding: '0.75rem 1.5rem',
                                          display: 'flex',
                                          alignItems: 'center',
                                          gap: '0.5rem'
                                        }}
                                      >
                                        🧾 Voir la facture #{factureCommande.numero_facture || factureCommande.id}
                                      </button>
                                    </div>
                                  ) : null;
                                })()}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="empty-state">
                            <p>Ce client n'a pas encore passé de commande</p>
                          </div>
                        )}
                      </div>

                      {/* Section Factures */}
                      <div style={{ marginTop: '3rem' }}>
                        <h2 style={{ marginBottom: '1.5rem', borderBottom: '2px solid #eee', paddingBottom: '1rem' }}>
                          🧾 Factures ({facturesClient.length})
                        </h2>
                        {loadingFactures ? (
                          <div className="empty-state">
                            <p>Chargement des factures...</p>
                          </div>
                        ) : facturesClient.length > 0 ? (
                          <div style={{ display: 'grid', gap: '1rem' }}>
                            {facturesClient.map(facture => (
                              <div key={facture.id} className="commande-card">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                  <div style={{ flex: 1 }}>
                                    <h3 style={{ color: 'var(--color-primary)', marginBottom: '0.5rem' }}>
                                      Facture #{facture.numero_facture || facture.id}
                                    </h3>
                                    <p><strong>📅 Date:</strong> {new Date(facture.date_facture).toLocaleDateString('fr-FR', {
                                      year: 'numeric',
                                      month: 'long',
                                      day: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}</p>
                                    {facture.commande_numero && (
                                      <p><strong>📦 Commande:</strong> #{facture.commande_numero}</p>
                                    )}
                                    <p><strong>💳 Mode de paiement:</strong> {
                                      facture.mode_paiement === 'carte' ? 'Carte bancaire' : 
                                      facture.mode_paiement === 'livraison' ? 'À la livraison' : 
                                      facture.mode_paiement
                                    }</p>
                                    <p><strong>✅ Statut:</strong> 
                                      <span style={{
                                        backgroundColor: facture.statut_paiement === 'paye' ? '#28a745' : 
                                                       facture.statut_paiement === 'en_attente' ? '#ffc107' : '#dc3545',
                                        color: 'white',
                                        padding: '0.25rem 0.75rem',
                                        borderRadius: '12px',
                                        marginLeft: '0.5rem',
                                        fontSize: '0.85rem'
                                      }}>
                                        {facture.statut_paiement === 'paye' ? '✓ Payé' : 
                                         facture.statut_paiement === 'en_attente' ? '⏳ En attente' : 
                                         '❌ Non payé'}
                                      </span>
                                    </p>
                                  </div>
                                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                                    <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--color-primary)' }}>
                                      {parseFloat(facture.montant_total).toFixed(0)} FCFA
                                    </p>
                                    <button
                                      className="btn btn-primary"
                                      onClick={() => chargerFacture(facture.id)}
                                      style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}
                                    >
                                      👁️ Voir facture
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="empty-state">
                            <p>Ce client n'a pas encore de facture</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="empty-state">
                    <p>Impossible de charger les détails du client</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Modal de facture */}
        {factureSelectionnee && (
          <Facture 
            facture={factureSelectionnee} 
            onClose={() => setFactureSelectionnee(null)} 
          />
        )}

        {/* Gestion du Menu */}
        {activeTab === 'menu' && (
          <AdminMenu user={user} restaurantId={1} />
        )}

        {/* Gestion des Livreurs */}
        {activeTab === 'livreurs' && (
          <div>
            <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2>Gestion des Livreurs</h2>
              <button 
                className="btn btn-primary" 
                onClick={() => {
                  setEditingLivreur(null);
                  setShowLivreurForm(true);
                }}
              >
                ➕ Ajouter un livreur
              </button>
            </div>

            {showLivreurForm && (
              <LivreurForm
                livreur={editingLivreur}
                onClose={() => {
                  setShowLivreurForm(false);
                  setEditingLivreur(null);
                }}
                onSuccess={() => {
                  setShowLivreurForm(false);
                  setEditingLivreur(null);
                  chargerDonnees();
                }}
              />
            )}

            {livreurs.length === 0 ? (
              <div className="empty-state">
                <p>Aucun livreur enregistré</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '1rem', marginTop: '1rem' }}>
                {livreurs.map(livreur => (
                  <div key={livreur.id} className="commande-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                      <div style={{ flex: 1 }}>
                        <h3>{livreur.prenom} {livreur.nom}</h3>
                        <p><strong>Email:</strong> {livreur.email}</p>
                        {livreur.telephone && <p><strong>Téléphone:</strong> {livreur.telephone}</p>}
                        {livreur.adresse && <p><strong>Adresse:</strong> {livreur.adresse}</p>}
                        <p><strong>Commandes livrées:</strong> {livreur.nbCommandesLivrees || 0}</p>
                        <p style={{ color: '#666', fontSize: '0.9rem' }}>
                          Créé le: {new Date(livreur.created_at).toLocaleDateString('fr-FR')}
                        </p>
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
                            setEditingLivreur(livreur);
                            setShowLivreurForm(true);
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
                          onClick={() => supprimerLivreur(livreur.id)}
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
              </div>
            )}
          </div>
        )}

      </div>

      {/* Modal d'attribution de commande à un livreur */}
      {showAttributionModal && commandeAAttribuer && (
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
            setShowAttributionModal(false);
            setCommandeAAttribuer(null);
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
              🚴 Attribuer la commande #{commandeAAttribuer.id}
            </h2>
            <p style={{ 
              marginBottom: '1.5rem',
              color: '#666',
              fontSize: '1rem'
            }}>
              Sélectionnez un livreur pour cette commande
            </p>
            
            {livreurs.length === 0 ? (
              <div style={{ 
                padding: '2rem', 
                textAlign: 'center', 
                background: 'var(--color-light)', 
                borderRadius: '8px',
                marginBottom: '1.5rem'
              }}>
                <p style={{ color: '#666' }}>Aucun livreur disponible</p>
              </div>
            ) : (
              <div style={{ 
                maxHeight: '300px', 
                overflowY: 'auto',
                marginBottom: '1.5rem'
              }}>
                {livreurs.map(livreur => (
                  <div
                    key={livreur.id}
                    onClick={() => confirmerAttribution(livreur.id)}
                    style={{
                      padding: '1rem',
                      marginBottom: '0.75rem',
                      background: commandeAAttribuer.livreur?.id === livreur.id ? 'var(--color-light)' : 'var(--color-light)',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      border: commandeAAttribuer.livreur?.id === livreur.id ? '2px solid var(--color-primary)' : '2px solid transparent',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'var(--color-surface-hover)';
                      e.currentTarget.style.borderColor = 'var(--color-primary)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = commandeAAttribuer.livreur?.id === livreur.id ? 'var(--color-light)' : '#f8f9fa';
                      e.currentTarget.style.borderColor = commandeAAttribuer.livreur?.id === livreur.id ? 'var(--color-primary)' : 'transparent';
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <strong style={{ color: '#333', fontSize: '1rem' }}>
                          {livreur.prenom} {livreur.nom}
                        </strong>
                        {livreur.telephone && (
                          <p style={{ margin: '0.25rem 0 0 0', color: '#666', fontSize: '0.9rem' }}>
                            📞 {livreur.telephone}
                          </p>
                        )}
                        <p style={{ margin: '0.25rem 0 0 0', color: '#999', fontSize: '0.85rem' }}>
                          {livreur.nbCommandesLivrees || 0} livraison(s) effectuée(s)
                        </p>
                      </div>
                      {commandeAAttribuer.livreur?.id === livreur.id && (
                        <span style={{
                          padding: '0.25rem 0.75rem',
                          background: 'var(--color-primary)',
                          color: 'white',
                          borderRadius: '12px',
                          fontSize: '0.75rem',
                          fontWeight: 'bold'
                        }}>
                          Actuel
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div style={{ 
              display: 'flex', 
              gap: '1rem', 
              justifyContent: 'flex-end' 
            }}>
              <button
                onClick={() => {
                  setShowAttributionModal(false);
                  setCommandeAAttribuer(null);
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
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Composant formulaire pour livreur
function LivreurForm({ livreur, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    nom: livreur?.nom || '',
    prenom: livreur?.prenom || '',
    email: livreur?.email || '',
    telephone: livreur?.telephone || '',
    adresse: livreur?.adresse || '',
    password: '',
    confirmPassword: ''
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  
  // Système de notifications toast
  const { showToast } = useToast();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    // Effacer l'erreur du champ modifié
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Validation nom
    if (!formData.nom.trim()) {
      newErrors.nom = 'Le nom est obligatoire';
    } else if (formData.nom.trim().length < 2) {
      newErrors.nom = 'Le nom doit contenir au moins 2 caractères';
    }

    // Validation prénom
    if (!formData.prenom.trim()) {
      newErrors.prenom = 'Le prénom est obligatoire';
    } else if (formData.prenom.trim().length < 2) {
      newErrors.prenom = 'Le prénom doit contenir au moins 2 caractères';
    }

    // Validation email
    if (!formData.email.trim()) {
      newErrors.email = 'L\'email est obligatoire';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Format d\'email invalide';
    }

    // Validation téléphone (optionnel mais format si fourni)
    if (formData.telephone && !/^[\d\s\-\+\(\)]+$/.test(formData.telephone)) {
      newErrors.telephone = 'Format de téléphone invalide';
    }

    // Validation mot de passe
    if (!livreur) {
      // Création : mot de passe obligatoire
      if (!formData.password) {
        newErrors.password = 'Le mot de passe est obligatoire';
      } else if (formData.password.length < 6) {
        newErrors.password = 'Le mot de passe doit contenir au moins 6 caractères';
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Les mots de passe ne correspondent pas';
      }
    } else {
      // Modification : mot de passe optionnel mais validation si fourni
      if (formData.password) {
        if (formData.password.length < 6) {
          newErrors.password = 'Le mot de passe doit contenir au moins 6 caractères';
        } else if (formData.password !== formData.confirmPassword) {
          newErrors.confirmPassword = 'Les mots de passe ne correspondent pas';
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const url = livreur
        ? `${API_URL}/admin/livreurs/${livreur.id}`
        : `${API_URL}/admin/livreurs`;

      const bodyData = { 
        nom: formData.nom.trim(),
        prenom: formData.prenom.trim(),
        email: formData.email.trim(),
        telephone: formData.telephone.trim() || null,
        adresse: formData.adresse.trim() || null
      };
      
      // Ajouter le mot de passe seulement s'il est fourni
      if (formData.password) {
        bodyData.password = formData.password;
      }

      const response = await fetch(url, {
        method: livreur ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(bodyData)
      });

      if (response.ok) {
        showToast(livreur ? '✅ Livreur mis à jour avec succès!' : '✅ Livreur créé avec succès!', 'success');
        onSuccess();
      } else {
        const error = await response.json();
        const errorMessage = error.error || 'Impossible de sauvegarder';
        
        // Gérer les erreurs spécifiques
        if (errorMessage.includes('email') || errorMessage.includes('Email')) {
          setErrors({ ...errors, email: 'Cet email est déjà utilisé' });
        } else {
          showToast('Erreur: ' + errorMessage, 'error');
        }
      }
    } catch (error) {
      console.error('Erreur:', error);
      showToast('Erreur de connexion. Veuillez réessayer.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{
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
    }}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ 
        maxWidth: '600px',
        width: '100%',
        maxHeight: '90vh',
        background: 'var(--color-surface)',
        borderRadius: '16px',
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        <div className="modal-header" style={{
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
              {livreur ? '✏️ Modifier le livreur' : '➕ Ajouter un nouveau livreur'}
            </h2>
            <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem', opacity: 0.9 }}>
              {livreur ? `Modification de ${livreur.prenom} ${livreur.nom}` : 'Remplissez les informations du livreur'}
            </p>
          </div>
          <button 
            className="close-btn" 
            onClick={onClose} 
            disabled={saving}
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              border: 'none',
              color: 'white',
              fontSize: '2rem',
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              cursor: saving ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.3s'
            }}
            onMouseEnter={(e) => {
              if (!saving) e.target.style.background = 'rgba(255, 255, 255, 0.3)';
            }}
            onMouseLeave={(e) => {
              if (!saving) e.target.style.background = 'rgba(255, 255, 255, 0.2)';
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
          {/* Informations personnelles */}
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ 
              marginBottom: '1rem', 
              color: '#333', 
              fontSize: '1.1rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              👤 Informations personnelles
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label style={{ 
                  display: 'block', 
                  marginBottom: '0.5rem', 
                  fontWeight: 500,
                  color: '#555'
                }}>
                  Nom <span style={{ color: '#e74c3c' }}>*</span>
                </label>
                <input
                  type="text"
                  name="nom"
                  value={formData.nom}
                  onChange={handleInputChange}
                  disabled={saving}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: errors.nom ? '2px solid #e74c3c' : '2px solid var(--color-border)',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    transition: 'all 0.3s',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => e.target.style.borderColor = 'var(--color-primary)'}
                  onBlur={(e) => e.target.style.borderColor = errors.nom ? '#e74c3c' : 'var(--color-border)'}
                />
                {errors.nom && (
                  <small style={{ color: '#e74c3c', fontSize: '0.85rem', marginTop: '0.25rem', display: 'block' }}>
                    {errors.nom}
                  </small>
                )}
              </div>
              
              <div className="form-group">
                <label style={{ 
                  display: 'block', 
                  marginBottom: '0.5rem', 
                  fontWeight: 500,
                  color: '#555'
                }}>
                  Prénom <span style={{ color: '#e74c3c' }}>*</span>
                </label>
                <input
                  type="text"
                  name="prenom"
                  value={formData.prenom}
                  onChange={handleInputChange}
                  disabled={saving}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: errors.prenom ? '2px solid #e74c3c' : '2px solid var(--color-border)',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    transition: 'all 0.3s',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => e.target.style.borderColor = 'var(--color-primary)'}
                  onBlur={(e) => e.target.style.borderColor = errors.prenom ? '#e74c3c' : 'var(--color-border)'}
                />
                {errors.prenom && (
                  <small style={{ color: '#e74c3c', fontSize: '0.85rem', marginTop: '0.25rem', display: 'block' }}>
                    {errors.prenom}
                  </small>
                )}
              </div>
            </div>
          </div>

          {/* Informations de contact */}
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ 
              marginBottom: '1rem', 
              color: '#333', 
              fontSize: '1.1rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              📧 Informations de contact
            </h3>
            
            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '0.5rem', 
                fontWeight: 500,
                color: '#555'
              }}>
                Email <span style={{ color: '#e74c3c' }}>*</span>
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                disabled={saving}
                placeholder="exemple@email.com"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: errors.email ? '2px solid #e74c3c' : '2px solid var(--color-border)',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  transition: 'all 0.3s',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => e.target.style.borderColor = 'var(--color-primary)'}
                onBlur={(e) => e.target.style.borderColor = errors.email ? '#e74c3c' : 'var(--color-border)'}
              />
              {errors.email && (
                <small style={{ color: '#e74c3c', fontSize: '0.85rem', marginTop: '0.25rem', display: 'block' }}>
                  {errors.email}
                </small>
              )}
            </div>

            <div className="form-group">
              <label style={{ 
                display: 'block', 
                marginBottom: '0.5rem', 
                fontWeight: 500,
                color: '#555'
              }}>
                Téléphone
              </label>
              <input
                type="tel"
                name="telephone"
                value={formData.telephone}
                onChange={handleInputChange}
                disabled={saving}
                placeholder="+241 7 12 34 56 78"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: errors.telephone ? '2px solid #e74c3c' : '2px solid var(--color-border)',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  transition: 'all 0.3s',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => e.target.style.borderColor = 'var(--color-primary)'}
                onBlur={(e) => e.target.style.borderColor = errors.telephone ? '#e74c3c' : 'var(--color-border)'}
              />
              {errors.telephone && (
                <small style={{ color: '#e74c3c', fontSize: '0.85rem', marginTop: '0.25rem', display: 'block' }}>
                  {errors.telephone}
                </small>
              )}
            </div>
          </div>

          {/* Adresse */}
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ 
              marginBottom: '1rem', 
              color: '#333', 
              fontSize: '1.1rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              📍 Adresse
            </h3>
            <div className="form-group">
              <label style={{ 
                display: 'block', 
                marginBottom: '0.5rem', 
                fontWeight: 500,
                color: '#555'
              }}>
                Adresse complète
              </label>
              <textarea
                name="adresse"
                value={formData.adresse}
                onChange={handleInputChange}
                disabled={saving}
                placeholder="Quartier, Ville, Pays"
                rows="3"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '2px solid var(--color-border)',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  transition: 'all 0.3s',
                  boxSizing: 'border-box',
                  resize: 'vertical',
                  fontFamily: 'inherit'
                }}
                onFocus={(e) => e.target.style.borderColor = 'var(--color-primary)'}
                onBlur={(e) => e.target.style.borderColor = 'var(--color-border)'}
              />
            </div>
          </div>

          {/* Mot de passe */}
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ 
              marginBottom: '1rem', 
              color: '#333', 
              fontSize: '1.1rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              🔒 Sécurité
            </h3>
            
            <div className="form-group" style={{ marginBottom: '1rem', position: 'relative' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '0.5rem', 
                fontWeight: 500,
                color: '#555'
              }}>
                Mot de passe {!livreur && <span style={{ color: '#e74c3c' }}>*</span>}
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  disabled={saving}
                  placeholder={livreur ? 'Laisser vide pour ne pas modifier' : 'Minimum 6 caractères'}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    paddingRight: '45px',
                    border: errors.password ? '2px solid #e74c3c' : '2px solid var(--color-border)',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    transition: 'all 0.3s',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => e.target.style.borderColor = 'var(--color-primary)'}
                  onBlur={(e) => e.target.style.borderColor = errors.password ? '#e74c3c' : 'var(--color-border)'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '1.2rem',
                    color: '#666',
                    padding: '0.25rem'
                  }}
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
              {errors.password && (
                <small style={{ color: '#e74c3c', fontSize: '0.85rem', marginTop: '0.25rem', display: 'block' }}>
                  {errors.password}
                </small>
              )}
              {livreur && !formData.password && (
                <small style={{ color: '#666', fontSize: '0.85rem', marginTop: '0.25rem', display: 'block' }}>
                  💡 Laisser vide pour conserver le mot de passe actuel
                </small>
              )}
            </div>

            {formData.password && (
              <div className="form-group" style={{ position: 'relative' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '0.5rem', 
                  fontWeight: 500,
                  color: '#555'
                }}>
                  Confirmer le mot de passe {!livreur && <span style={{ color: '#e74c3c' }}>*</span>}
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  disabled={saving}
                  placeholder="Répétez le mot de passe"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: errors.confirmPassword ? '2px solid #e74c3c' : '2px solid var(--color-border)',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    transition: 'all 0.3s',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => e.target.style.borderColor = 'var(--color-primary)'}
                  onBlur={(e) => e.target.style.borderColor = errors.confirmPassword ? '#e74c3c' : 'var(--color-border)'}
                />
                {errors.confirmPassword && (
                  <small style={{ color: '#e74c3c', fontSize: '0.85rem', marginTop: '0.25rem', display: 'block' }}>
                    {errors.confirmPassword}
                  </small>
                )}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="form-actions" style={{
            display: 'flex',
            gap: '1rem',
            marginTop: '2rem',
            paddingTop: '1.5rem',
            borderTop: '2px solid #f0f0f0'
          }}>
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
              disabled={saving}
              style={{
                flex: 1,
                padding: '0.875rem',
                background: 'var(--color-secondary)',
                color: 'var(--color-white)',
                border: '1px solid var(--color-secondary)',
                borderRadius: '10px',
                fontSize: '1rem',
                fontWeight: 500,
                cursor: saving ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s',
                opacity: saving ? 0.6 : 1
              }}
              onMouseEnter={(e) => {
                if (!saving) {
                  e.target.style.background = 'var(--color-primary)';
                  e.target.style.borderColor = 'var(--color-primary)';
                }
              }}
              onMouseLeave={(e) => {
                if (!saving) {
                  e.target.style.background = 'var(--color-secondary)';
                  e.target.style.borderColor = 'var(--color-secondary)';
                }
              }}
            >
              Annuler
            </button>
            <button 
              type="submit" 
              className="btn btn-primary" 
              disabled={saving}
              style={{
                flex: 2,
                padding: '0.875rem',
                background: 'var(--color-primary)',
                color: 'var(--color-white)',
                border: '1px solid var(--color-primary)',
                borderRadius: '10px',
                fontSize: '1rem',
                fontWeight: 600,
                cursor: saving ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s',
                boxShadow: 'var(--shadow-soft)',
                opacity: saving ? 0.6 : 1
              }}
              onMouseEnter={(e) => {
                if (!saving) {
                  e.target.style.boxShadow = 'var(--shadow-medium)';
                  e.target.style.transform = 'translateY(-2px)';
                }
              }}
              onMouseLeave={(e) => {
                if (!saving) {
                  e.target.style.boxShadow = 'var(--shadow-soft)';
                  e.target.style.transform = 'translateY(0)';
                }
              }}
            >
              {saving ? (
                <>⏳ Enregistrement en cours...</>
              ) : livreur ? (
                <>✅ Enregistrer les modifications</>
              ) : (
                <>✅ Créer le livreur</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default DashboardAdmin;

