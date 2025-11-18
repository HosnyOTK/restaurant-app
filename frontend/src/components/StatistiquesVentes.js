import React, { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import API_URL from '../config/api';

function StatistiquesVentes() {
  const [periode, setPeriode] = useState('jour'); // jour, semaine, mois, annee
  const [donnees, setDonnees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('statistiques'); // statistiques, factures
  const [factures, setFactures] = useState([]);
  const [loadingFactures, setLoadingFactures] = useState(false);
  const [factureSelectionnee, setFactureSelectionnee] = useState(null);
  const [rechercheFacture, setRechercheFacture] = useState('');
  const [filtreStatut, setFiltreStatut] = useState('tous'); // tous, paye, en_attente, refuse, rembourse
  const [filtreDateDebut, setFiltreDateDebut] = useState('');
  const [filtreDateFin, setFiltreDateFin] = useState('');

  useEffect(() => {
    if (activeTab === 'statistiques') {
      chargerDonnees();
    } else if (activeTab === 'factures') {
      chargerFactures();
    }
  }, [periode, activeTab]);

  const chargerDonnees = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/admin/statistiques/ventes?periode=${periode}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        
        // Formater les dates pour l'affichage
        const donneesFormatees = result.data.map(item => {
          let dateFormatee = item.date;
          
          if (periode === 'jour') {
            // Format: "14:00" -> "14h"
            dateFormatee = item.date.replace(':00', 'h');
          } else if (periode === 'semaine' || periode === 'mois') {
            // Format: "2024-01-15" -> "15 Jan"
            const date = new Date(item.date);
            dateFormatee = date.toLocaleDateString('fr-FR', { 
              day: 'numeric', 
              month: 'short' 
            });
          } else if (periode === 'annee') {
            // Format: "2024-01" -> "Jan 2024"
            const [annee, mois] = item.date.split('-');
            const date = new Date(annee, parseInt(mois) - 1);
            dateFormatee = date.toLocaleDateString('fr-FR', { 
              month: 'short', 
              year: 'numeric' 
            });
          }
          
          return {
            ...item,
            dateFormatee,
            chiffreAffairesFormate: item.chiffreAffaires.toFixed(0)
          };
        });

        setDonnees(donneesFormatees);
      }
      setLoading(false);
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error);
      setLoading(false);
    }
  };

  const formaterPrix = (value) => {
    return `${parseFloat(value).toFixed(0)} FCFA`;
  };

  const formaterTooltip = (value, name) => {
    if (name === 'chiffreAffaires') {
      return [formaterPrix(value), 'Chiffre d\'affaires'];
    }
    return [value, name === 'commandes' ? 'Nombre de commandes' : name];
  };

  const chargerFactures = async () => {
    try {
      setLoadingFactures(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/paiement/factures`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        setFactures(result);
      }
      setLoadingFactures(false);
    } catch (error) {
      console.error('Erreur lors du chargement des factures:', error);
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
        setFactureSelectionnee(facture);
      }
    } catch (error) {
      console.error('Erreur lors du chargement de la facture:', error);
    }
  };

  if (loading && activeTab === 'statistiques') {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>Chargement des statistiques...</p>
      </div>
    );
  }

  return (
    <div style={{ marginTop: '2rem' }}>
      {/* Onglets */}
      <div style={{ 
        display: 'flex', 
        gap: '1rem', 
        marginBottom: '2rem', 
        borderBottom: '2px solid #eee', 
        paddingBottom: '1rem' 
      }}>
        <button
          className={`btn ${activeTab === 'statistiques' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('statistiques')}
          style={{ fontSize: '0.9rem', padding: '0.5rem 1rem' }}
        >
          📊 Statistiques
        </button>
        <button
          className={`btn ${activeTab === 'factures' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('factures')}
          style={{ fontSize: '0.9rem', padding: '0.5rem 1rem' }}
        >
          📄 Historique des Factures ({factures.length})
        </button>
      </div>

      {/* Vue Historique des Factures */}
      {activeTab === 'factures' && (
        <div>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '2rem',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
            <h2 style={{ margin: 0 }}>Historique des Factures</h2>
            <button 
              className="btn btn-primary" 
              onClick={chargerFactures}
              style={{ fontSize: '0.9rem', padding: '0.5rem 1rem' }}
            >
              🔄 Actualiser
            </button>
          </div>

          {/* Filtres et recherche */}
          <div style={{ 
            background: '#f8f9fa', 
            padding: '1.5rem', 
            borderRadius: '8px', 
            marginBottom: '2rem',
            border: '1px solid #e0e0e0'
          }}>
            <h3 style={{ marginTop: 0, marginBottom: '1rem', fontSize: '1.1rem' }}>🔍 Recherche et Filtres</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              {/* Recherche */}
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', fontSize: '0.9rem' }}>
                  Rechercher
                </label>
                <input
                  type="text"
                  placeholder="Numéro, client, email..."
                  value={rechercheFacture}
                  onChange={(e) => setRechercheFacture(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '0.9rem'
                  }}
                />
              </div>

              {/* Filtre statut */}
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', fontSize: '0.9rem' }}>
                  Statut de paiement
                </label>
                <select
                  value={filtreStatut}
                  onChange={(e) => setFiltreStatut(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '0.9rem'
                  }}
                >
                  <option value="tous">Tous les statuts</option>
                  <option value="paye">Payé</option>
                  <option value="en_attente">En attente</option>
                  <option value="refuse">Refusé</option>
                  <option value="rembourse">Remboursé</option>
                </select>
              </div>

              {/* Filtre date début */}
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', fontSize: '0.9rem' }}>
                  Date début
                </label>
                <input
                  type="date"
                  value={filtreDateDebut}
                  onChange={(e) => setFiltreDateDebut(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '0.9rem'
                  }}
                />
              </div>

              {/* Filtre date fin */}
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', fontSize: '0.9rem' }}>
                  Date fin
                </label>
                <input
                  type="date"
                  value={filtreDateFin}
                  onChange={(e) => setFiltreDateFin(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '0.9rem'
                  }}
                />
              </div>
            </div>

            {/* Bouton réinitialiser */}
            {(rechercheFacture || filtreStatut !== 'tous' || filtreDateDebut || filtreDateFin) && (
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setRechercheFacture('');
                  setFiltreStatut('tous');
                  setFiltreDateDebut('');
                  setFiltreDateFin('');
                }}
                style={{ marginTop: '1rem', fontSize: '0.9rem', padding: '0.5rem 1rem' }}
              >
                🔄 Réinitialiser les filtres
              </button>
            )}
          </div>

          {loadingFactures ? (
            <div style={{ padding: '2rem', textAlign: 'center' }}>
              <p>Chargement des factures...</p>
            </div>
          ) : factures.length === 0 ? (
            <div style={{ 
              padding: '3rem', 
              textAlign: 'center', 
              background: '#f8f9fa', 
              borderRadius: '8px',
              border: '1px solid #e0e0e0'
            }}>
              <p style={{ color: '#666', fontSize: '1.1rem' }}>
                Aucune facture disponible
              </p>
            </div>
          ) : (
            <div>
              {/* Appliquer les filtres */}
              {(() => {
                let facturesFiltrees = factures;

                // Filtre par recherche
                if (rechercheFacture) {
                  const recherche = rechercheFacture.toLowerCase();
                  facturesFiltrees = facturesFiltrees.filter(f => 
                    f.numero_facture?.toLowerCase().includes(recherche) ||
                    f.client_nom?.toLowerCase().includes(recherche) ||
                    f.client_prenom?.toLowerCase().includes(recherche) ||
                    f.client_email?.toLowerCase().includes(recherche) ||
                    f.commande_id?.toString().includes(recherche)
                  );
                }

                // Filtre par statut
                if (filtreStatut !== 'tous') {
                  facturesFiltrees = facturesFiltrees.filter(f => f.statut_paiement === filtreStatut);
                }

                // Filtre par date
                if (filtreDateDebut) {
                  const dateDebut = new Date(filtreDateDebut);
                  facturesFiltrees = facturesFiltrees.filter(f => {
                    const dateFacture = new Date(f.date_facture);
                    return dateFacture >= dateDebut;
                  });
                }

                if (filtreDateFin) {
                  const dateFin = new Date(filtreDateFin);
                  dateFin.setHours(23, 59, 59, 999); // Fin de journée
                  facturesFiltrees = facturesFiltrees.filter(f => {
                    const dateFacture = new Date(f.date_facture);
                    return dateFacture <= dateFin;
                  });
                }

                // Statistiques des factures filtrées
                const totalFiltre = facturesFiltrees.reduce((sum, f) => sum + parseFloat(f.montant_total || 0), 0);
                const nombreFiltre = facturesFiltrees.length;

                return (
                  <>
                    {/* Résumé des factures filtrées */}
                    <div style={{ 
                      display: 'flex', 
                      gap: '1rem', 
                      marginBottom: '1.5rem',
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
                        <p style={{ margin: 0, fontSize: '0.9rem', opacity: 0.9 }}>Nombre de factures</p>
                        <p style={{ margin: '0.5rem 0 0 0', fontSize: '1.5rem', fontWeight: 'bold' }}>
                          {nombreFiltre} {nombreFiltre !== factures.length && `sur ${factures.length}`}
                        </p>
                      </div>
                      <div style={{ 
                        background: '#28a745', 
                        color: 'white', 
                        padding: '1rem', 
                        borderRadius: '8px',
                        flex: 1,
                        minWidth: '200px'
                      }}>
                        <p style={{ margin: 0, fontSize: '0.9rem', opacity: 0.9 }}>Total</p>
                        <p style={{ margin: '0.5rem 0 0 0', fontSize: '1.5rem', fontWeight: 'bold' }}>
                          {totalFiltre.toFixed(0)} FCFA
                        </p>
                      </div>
                    </div>

                    {/* Liste des factures filtrées */}
                    {facturesFiltrees.length === 0 ? (
                      <div style={{ 
                        padding: '3rem', 
                        textAlign: 'center', 
                        background: '#f8f9fa', 
                        borderRadius: '8px',
                        border: '1px solid #e0e0e0'
                      }}>
                        <p style={{ color: '#666', fontSize: '1.1rem' }}>
                          Aucune facture ne correspond aux critères de recherche
                        </p>
                      </div>
                    ) : (
                      <div style={{ display: 'grid', gap: '1rem' }}>
                        {facturesFiltrees.map(facture => (
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
                      <p><strong>Client:</strong> {facture.client_prenom} {facture.client_nom}</p>
                      {facture.client_email && <p><strong>Email:</strong> {facture.client_email}</p>}
                      <p><strong>Commande:</strong> #{facture.commande_id}</p>
                      <p><strong>Restaurant:</strong> {facture.restaurant_nom}</p>
                      <p><strong>Date:</strong> {new Date(facture.date_facture).toLocaleString('fr-FR')}</p>
                      <p><strong>Mode de paiement:</strong> {facture.mode_paiement === 'carte' ? 'Carte bancaire' : facture.mode_paiement}</p>
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
                          {facture.statut_paiement === 'paye' ? 'Payé' : 
                           facture.statut_paiement === 'en_attente' ? 'En attente' :
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
                  </>
                );
              })()}
            </div>
          )}

          {/* Modal de facture */}
          {factureSelectionnee && (
            <div className="modal-overlay" onClick={() => setFactureSelectionnee(null)}>
              <div 
                className="modal" 
                onClick={(e) => e.stopPropagation()}
                style={{ maxWidth: '800px', width: '90%', maxHeight: '90vh', overflowY: 'auto' }}
              >
                <div className="modal-header">
                  <h2 className="modal-title">Facture #{factureSelectionnee.numero_facture}</h2>
                  <button className="close-btn" onClick={() => setFactureSelectionnee(null)}>×</button>
                </div>
                <div style={{ padding: '2rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
                    <div>
                      <h4 style={{ color: '#667eea', marginBottom: '0.5rem' }}>Informations Client</h4>
                      <p><strong>Nom:</strong> {factureSelectionnee.client_prenom} {factureSelectionnee.client_nom}</p>
                      <p><strong>Email:</strong> {factureSelectionnee.client_email}</p>
                    </div>
                    <div>
                      <h4 style={{ color: '#667eea', marginBottom: '0.5rem' }}>Informations Facture</h4>
                      <p><strong>Date:</strong> {new Date(factureSelectionnee.date_facture).toLocaleString('fr-FR')}</p>
                      <p><strong>Commande:</strong> #{factureSelectionnee.commande_id}</p>
                      <p><strong>Mode:</strong> {factureSelectionnee.mode_paiement === 'carte' ? 'Carte bancaire' : factureSelectionnee.mode_paiement}</p>
                    </div>
                  </div>
                  
                  {factureSelectionnee.details && factureSelectionnee.details.length > 0 && (
                    <div>
                      <h4 style={{ color: '#667eea', marginBottom: '1rem' }}>Détails de la commande</h4>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ borderBottom: '2px solid #eee' }}>
                            <th style={{ padding: '0.75rem', textAlign: 'left' }}>Article</th>
                            <th style={{ padding: '0.75rem', textAlign: 'center' }}>Quantité</th>
                            <th style={{ padding: '0.75rem', textAlign: 'right' }}>Prix unitaire</th>
                            <th style={{ padding: '0.75rem', textAlign: 'right' }}>Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {factureSelectionnee.details.map((detail, idx) => (
                            <tr key={idx} style={{ borderBottom: '1px solid #f0f0f0' }}>
                              <td style={{ padding: '0.75rem' }}>{detail.plat_nom}</td>
                              <td style={{ padding: '0.75rem', textAlign: 'center' }}>{detail.quantite}</td>
                              <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                                {parseFloat(detail.prix_unitaire).toFixed(0)} FCFA
                              </td>
                              <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 'bold' }}>
                                {parseFloat(detail.sous_total).toFixed(0)} FCFA
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  
                  <div style={{ 
                    marginTop: '2rem', 
                    paddingTop: '1rem', 
                    borderTop: '2px solid #eee',
                    textAlign: 'right'
                  }}>
                    <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#667eea' }}>
                      Total: {parseFloat(factureSelectionnee.montant_total).toFixed(0)} FCFA
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Vue Statistiques */}
      {activeTab === 'statistiques' && (
        <>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '2rem',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
            <h2 style={{ margin: 0 }}>Statistiques de Ventes</h2>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                className={`btn ${periode === 'jour' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setPeriode('jour')}
              >
                Jour
              </button>
              <button
                className={`btn ${periode === 'semaine' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setPeriode('semaine')}
              >
                Semaine
              </button>
              <button
                className={`btn ${periode === 'mois' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setPeriode('mois')}
              >
                Mois
              </button>
              <button
                className={`btn ${periode === 'annee' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setPeriode('annee')}
              >
                Année
              </button>
            </div>
          </div>

      {donnees.length === 0 ? (
        <div style={{ 
          padding: '3rem', 
          textAlign: 'center', 
          background: '#f8f9fa', 
          borderRadius: '8px',
          border: '1px solid #e0e0e0'
        }}>
          <p style={{ color: '#666', fontSize: '1.1rem' }}>
            Aucune donnée de vente disponible pour cette période
          </p>
        </div>
      ) : (
        <>
          {/* Graphique en ligne pour le chiffre d'affaires */}
          <div style={{ 
            background: 'white', 
            padding: '2rem', 
            borderRadius: '12px', 
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            marginBottom: '2rem'
          }}>
            <h3 style={{ 
              marginBottom: '1.5rem', 
              fontSize: '1.25rem',
              fontWeight: '500',
              color: '#1a1a1a',
              letterSpacing: '1px'
            }}>
              Évolution du Chiffre d'Affaires ({periode === 'jour' ? 'Jour en cours' : periode === 'semaine' ? '7 derniers jours' : periode === 'mois' ? 'Mois en cours' : 'Année en cours'})
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={donnees}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis 
                  dataKey="dateFormatee" 
                  stroke="#666"
                  style={{ fontSize: '0.875rem' }}
                />
                <YAxis 
                  stroke="#666"
                  tickFormatter={formaterPrix}
                  style={{ fontSize: '0.875rem' }}
                />
                <Tooltip 
                  formatter={formaterTooltip}
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                    padding: '0.75rem'
                  }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="chiffreAffaires" 
                  stroke="#c9a961" 
                  strokeWidth={3}
                  dot={{ fill: '#c9a961', r: 4 }}
                  activeDot={{ r: 6 }}
                  name="Chiffre d'affaires"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Graphique en barres pour le nombre de commandes */}
          <div style={{ 
            background: 'white', 
            padding: '2rem', 
            borderRadius: '12px', 
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ 
              marginBottom: '1.5rem', 
              fontSize: '1.25rem',
              fontWeight: '500',
              color: '#1a1a1a',
              letterSpacing: '1px'
            }}>
              Nombre de Commandes ({periode === 'jour' ? 'Jour en cours' : periode === 'semaine' ? '7 derniers jours' : periode === 'mois' ? 'Mois en cours' : 'Année en cours'})
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={donnees}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis 
                  dataKey="dateFormatee" 
                  stroke="#666"
                  style={{ fontSize: '0.875rem' }}
                />
                <YAxis 
                  stroke="#666"
                  style={{ fontSize: '0.875rem' }}
                />
                <Tooltip 
                  formatter={formaterTooltip}
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                    padding: '0.75rem'
                  }}
                />
                <Legend />
                <Bar 
                  dataKey="commandes" 
                  fill="#667eea" 
                  radius={[8, 8, 0, 0]}
                  name="Nombre de commandes"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Tableau récapitulatif */}
          <div style={{ 
            background: 'white', 
            padding: '2rem', 
            borderRadius: '12px', 
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            marginTop: '2rem'
          }}>
            <h3 style={{ 
              marginBottom: '1.5rem', 
              fontSize: '1.25rem',
              fontWeight: '500',
              color: '#1a1a1a',
              letterSpacing: '1px'
            }}>
              Détails par Période
            </h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ 
                width: '100%', 
                borderCollapse: 'collapse',
                fontSize: '0.875rem'
              }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e0e0e0' }}>
                    <th style={{ 
                      padding: '1rem', 
                      textAlign: 'left',
                      fontWeight: '500',
                      color: '#1a1a1a',
                      letterSpacing: '1px',
                      textTransform: 'uppercase',
                      fontSize: '0.75rem'
                    }}>
                      {periode === 'jour' ? 'Heure' : periode === 'annee' ? 'Mois' : 'Date'}
                    </th>
                    <th style={{ 
                      padding: '1rem', 
                      textAlign: 'right',
                      fontWeight: '500',
                      color: '#1a1a1a',
                      letterSpacing: '1px',
                      textTransform: 'uppercase',
                      fontSize: '0.75rem'
                    }}>
                      Commandes
                    </th>
                    <th style={{ 
                      padding: '1rem', 
                      textAlign: 'right',
                      fontWeight: '500',
                      color: '#1a1a1a',
                      letterSpacing: '1px',
                      textTransform: 'uppercase',
                      fontSize: '0.75rem'
                    }}>
                      Chiffre d'Affaires
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {donnees.map((item, index) => (
                    <tr 
                      key={index}
                      style={{ 
                        borderBottom: '1px solid #f0f0f0',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <td style={{ padding: '1rem', color: '#1a1a1a' }}>
                        {item.dateFormatee}
                      </td>
                      <td style={{ 
                        padding: '1rem', 
                        textAlign: 'right',
                        color: '#667eea',
                        fontWeight: '500'
                      }}>
                        {item.commandes}
                      </td>
                      <td style={{ 
                        padding: '1rem', 
                        textAlign: 'right',
                        color: '#c9a961',
                        fontWeight: '500'
                      }}>
                        {formaterPrix(item.chiffreAffaires)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
        </>
      )}
    </div>
  );
}

export default StatistiquesVentes;

