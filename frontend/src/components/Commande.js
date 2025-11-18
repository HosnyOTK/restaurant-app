import React, { useState, useEffect, useRef } from 'react';
import Paiement from './Paiement';
import Facture from './Facture';
import { useToast, ToastContainer } from './ToastNotification';
import API_URL from '../config/api';

// Liste des quartiers de Libreville, Owendo et Akanda
const QUARTIERS_GABON = [
  // Libreville
  'Akébé', 'Alibandeng', 'Angondjé', 'Anguier', 'Awendjé', 'Batavéa', 'Bikélé', 'Bordamur', 'Charbonnages',
  'Cocotiers', 'Derrière la Prison', 'Diba-Diba', 'Glass', 'Gros-Bouquet', 'Haut de Gué-Gué', 'Kinguélé',
  'La Sablière', 'Lalala', 'Louis', 'Mikolongo', 'Mindoubé', 'Mont-Bouët', 'Nkembo', 'Nombakélé',
  'Oloumi', 'Ondôgô', 'PK8', 'PK10', 'PK12', 'PK15', 'PK20', 'PK24', 'PK30', 'PK36', 'PK45',
  'Plaine Niger', 'Quartier Louis', 'Rond-Point Charbonnages', 'Sotega', 'Tchibanga', 'Wolé Ntem',
  // Owendo
  'Owendo Centre', 'PK6', 'PK7', 'PK9', 'PK11', 'PK13', 'PK14', 'PK16', 'PK18', 'PK22', 'PK26',
  'PK28', 'PK32', 'PK34', 'PK38', 'PK40', 'PK42', 'PK44', 'PK46', 'PK48', 'PK50',
  // Akanda
  'Akanda Centre', 'Cap Estérias', 'Cocobeach', 'Corisco', 'Ekouk', 'Ntoum', 'PK2', 'PK4', 'PK5'
];

function Commande({ panier, restaurant, user, total, onConfirmer, onRetour, onNavigateToFactures }) {
  const [adresse, setAdresse] = useState(user?.adresse || '');
  const [telephone, setTelephone] = useState(user?.telephone || '');
  const [notes, setNotes] = useState('');
  const [commandeId, setCommandeId] = useState(null);
  const [etape, setEtape] = useState('infos'); // 'infos', 'mode_paiement', 'paiement_livraison', 'paiement', 'facture'
  
  // États pour l'autocomplétion
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [quartiersPersonnalises, setQuartiersPersonnalises] = useState([]);
  const adresseInputRef = useRef(null);
  const suggestionsRef = useRef(null);
  
  // Système de notifications toast
  const { toasts, showToast, removeToast } = useToast();
  const [facture, setFacture] = useState(null);
  const [modePaiement, setModePaiement] = useState('carte'); // 'carte', 'livraison' ou 'mobile_money'
  const [infosBancaires, setInfosBancaires] = useState({
    numero_carte: '',
    date_expiration: '',
    cvv: '',
    nom_titulaire: ''
  });
  const [infosMobileMoney, setInfosMobileMoney] = useState({
    operateur: '', // 'airtel' ou 'moov'
    numero_telephone: ''
  });

  // Charger les quartiers personnalisés depuis le backend
  useEffect(() => {
    const chargerQuartiersPersonnalises = async () => {
      try {
        const response = await fetch(`${API_URL}/quartiers`);
        if (response.ok) {
          const data = await response.json();
          setQuartiersPersonnalises(data.quartiers || []);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des quartiers:', error);
      }
    };
    chargerQuartiersPersonnalises();
  }, []);

  // Gérer les suggestions d'autocomplétion
  const handleAdresseChange = (value) => {
    setAdresse(value);
    setSelectedIndex(-1);
    
    if (value.length >= 2) {
      const valueLower = value.toLowerCase().trim();
      const tousQuartiers = [...QUARTIERS_GABON, ...quartiersPersonnalises];
      const filtered = tousQuartiers
        .filter(quartier => quartier.toLowerCase().includes(valueLower))
        .slice(0, 8); // Limiter à 8 suggestions
      setSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  // Enregistrer un nouveau quartier si nécessaire
  const enregistrerNouveauQuartier = async (quartier) => {
    // Vérifier si le quartier n'existe pas déjà
    const tousQuartiers = [...QUARTIERS_GABON, ...quartiersPersonnalises];
    const existeDeja = tousQuartiers.some(q => q.toLowerCase() === quartier.toLowerCase().trim());
    
    if (!existeDeja && quartier.trim().length >= 2) {
      try {
        const response = await fetch(`${API_URL}/quartiers`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ nom: quartier.trim() })
        });
        
        if (response.ok) {
          const data = await response.json();
          setQuartiersPersonnalises(prev => [...prev, data.quartier.nom]);
        }
      } catch (error) {
        console.error('Erreur lors de l\'enregistrement du quartier:', error);
      }
    }
  };

  // Sélectionner une suggestion
  const selectSuggestion = (suggestion) => {
    setAdresse(suggestion);
    setShowSuggestions(false);
    setSelectedIndex(-1);
    adresseInputRef.current?.focus();
  };

  // Gérer les touches du clavier
  const handleKeyDown = (e) => {
    if (!showSuggestions || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault();
      selectSuggestion(suggestions[selectedIndex]);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setSelectedIndex(-1);
    }
  };

  // Fermer les suggestions quand on clique ailleurs
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target) && 
          adresseInputRef.current && !adresseInputRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Enregistrer le quartier s'il est nouveau
    if (adresse.trim()) {
      await enregistrerNouveauQuartier(adresse.trim());
    }
    
    // Passer à l'étape de choix du mode de paiement
    setEtape('mode_paiement');
  };

  const handleChoisirModePaiement = async (mode) => {
    setModePaiement(mode);
    
    if (mode === 'mobile_money') {
      // Pour mobile money, on passe directement à l'étape de saisie des infos
      setEtape('mobile_money');
      return;
    }
    
    // Créer la commande
    const result = await onConfirmer({
      adresse,
      telephone,
      notes,
      mode_paiement: mode
    });
    
    if (result && result.commandeId) {
      setCommandeId(result.commandeId);
      
      if (mode === 'carte') {
        // Si paiement par carte, aller à l'étape de paiement
        setEtape('paiement');
      } else if (mode === 'livraison') {
        // Si paiement à la livraison, créer la facture immédiatement
        const factureData = await creerFactureLivraison(result.commandeId, null);
        if (factureData) {
          setFacture(factureData);
          // Après création de la facture, proposer les informations bancaires (optionnel)
          setEtape('paiement_livraison');
        }
      }
    }
  };

  const handleSubmitMobileMoney = async (e) => {
    e.preventDefault();
    
    if (!infosMobileMoney.operateur || !infosMobileMoney.numero_telephone) {
      showToast('Veuillez remplir tous les champs', 'warning');
      return;
    }

    // Valider le numéro de téléphone (format gabonais: 9 chiffres au total, commençant par 06 ou 07)
    const phoneRegex = /^(06|07)\d{7}$/;
    const cleanedPhone = infosMobileMoney.numero_telephone.replace(/\s/g, '');
    
    if (!phoneRegex.test(cleanedPhone)) {
      showToast('Numéro de téléphone invalide. Format attendu: 06XXXXXXX ou 07XXXXXXX (9 chiffres)', 'error');
      return;
    }

    // Créer la commande
    const result = await onConfirmer({
      adresse,
      telephone,
      notes,
      mode_paiement: 'mobile_money'
    });
    
    if (result && result.commandeId) {
      setCommandeId(result.commandeId);
      
      // Créer la facture avec les infos mobile money
      const factureData = await creerFactureMobileMoney(result.commandeId, infosMobileMoney);
      if (factureData) {
        setFacture(factureData);
        setEtape('facture');
      }
    }
  };

  const creerFactureMobileMoney = async (commandeId, infosMobileMoneyData) => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_URL}/paiement/creer-facture-mobile-money`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          commande_id: commandeId,
          operateur: infosMobileMoneyData.operateur,
          numero_telephone: infosMobileMoneyData.numero_telephone.replace(/\s/g, '')
        })
      });

      if (response.ok) {
        const factureData = await response.json();
        setFacture(factureData);
        return factureData;
      } else {
        const errorData = await response.json();
        showToast('Erreur: ' + (errorData.error || 'Impossible de créer la facture'), 'error');
        return null;
      }
    } catch (error) {
      console.error('Erreur lors de la création de la facture:', error);
      showToast('Erreur lors de la création de la facture', 'error');
      return null;
    }
  };

  const creerFactureLivraison = async (commandeId, infosBancairesData = null) => {
    try {
      const token = localStorage.getItem('token');
      
      const bodyData = {
        commande_id: commandeId
      };

      // Ajouter les informations bancaires si fournies
      if (infosBancairesData) {
        bodyData.infos_bancaires = infosBancairesData;
      }
      
      const response = await fetch(`${API_URL}/paiement/creer-facture-livraison`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(bodyData)
      });

      if (response.ok) {
        const factureData = await response.json();
        setFacture(factureData);
        // Retourner la facture pour permettre la suite du processus
        return factureData;
      } else {
        const errorData = await response.json();
        showToast('Erreur: ' + (errorData.error || 'Impossible de créer la facture'), 'error');
        return null;
      }
    } catch (error) {
      console.error('Erreur lors de la création de la facture:', error);
      showToast('Erreur lors de la création de la facture', 'error');
      return null;
    }
  };

  const handleSubmitInfosBancaires = async (e) => {
    e.preventDefault();
    
    // Vérifier si des informations bancaires ont été saisies
    const hasInfosBancaires = infosBancaires.numero_carte || infosBancaires.date_expiration || infosBancaires.cvv || infosBancaires.nom_titulaire;
    
    if (hasInfosBancaires) {
      // Si des informations sont saisies, valider qu'elles sont complètes
      if (!infosBancaires.numero_carte || !infosBancaires.date_expiration || !infosBancaires.cvv || !infosBancaires.nom_titulaire) {
        showToast('Veuillez remplir tous les champs des informations bancaires ou passer sans informations', 'warning');
        return;
      }

      // Validation du numéro de carte
      const numeroCarteNettoye = infosBancaires.numero_carte.replace(/\s/g, '');
      if (numeroCarteNettoye.length < 13 || numeroCarteNettoye.length > 19 || !/^\d+$/.test(numeroCarteNettoye)) {
        showToast('Le numéro de carte doit contenir entre 13 et 19 chiffres', 'warning');
        return;
      }

      // Validation de la date d'expiration (MM/YY)
      if (!/^\d{2}\/\d{2}$/.test(infosBancaires.date_expiration)) {
        showToast('La date d\'expiration doit être au format MM/AA (ex: 12/25)', 'warning');
        return;
      }

      // Validation du CVV (3 ou 4 chiffres)
      if (!/^\d{3,4}$/.test(infosBancaires.cvv)) {
        showToast('Le CVV doit contenir 3 ou 4 chiffres', 'warning');
        return;
      }

      // Mettre à jour la facture avec les informations bancaires
      await mettreAJourFactureAvecInfosBancaires(commandeId, infosBancaires);
    } else {
      // Pas d'informations bancaires, passer directement à la facture
      setEtape('facture');
    }
  };

  const mettreAJourFactureAvecInfosBancaires = async (commandeId, infosBancairesData) => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_URL}/paiement/mettre-a-jour-infos-bancaires`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          commande_id: commandeId,
          infos_bancaires: infosBancairesData
        })
      });

      if (response.ok) {
        const factureData = await response.json();
        setFacture(factureData);
        setEtape('facture');
      } else {
        const errorData = await response.json();
        showToast('Erreur: ' + (errorData.error || 'Impossible de mettre à jour les informations bancaires'), 'error');
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      showToast('Erreur lors de la mise à jour des informations bancaires', 'error');
    }
  };

  const handlePaiementSuccess = (factureData) => {
    setFacture(factureData);
    setEtape('facture');
  };

  const handlePaiementError = (error) => {
    showToast('Erreur lors du paiement: ' + error, 'error');
  };

  const handleFermerFacture = () => {
    setFacture(null);
    setEtape('infos');
    setCommandeId(null);
    // Revenir au menu
    if (onRetour) {
      onRetour();
    }
  };

  // Afficher la facture si le paiement est réussi ou si paiement à la livraison
  if (etape === 'facture' && facture) {
    const factureData = facture.facture || facture;
    const estPaiementLivraison = factureData?.mode_paiement === 'livraison';
    const estPaiementMobileMoney = factureData?.mode_paiement === 'mobile_money';
    
    return (
      <>
        <Facture facture={facture} onClose={handleFermerFacture} />
        <div className="commande-container">
          <div className="container">
            <h1 className="menu-title">
              {estPaiementLivraison || estPaiementMobileMoney ? 'Commande confirmée !' : 'Paiement confirmé !'}
            </h1>
            <p style={{ textAlign: 'center', fontSize: '1.1rem', color: '#28a745', marginBottom: '1rem' }}>
              {estPaiementLivraison 
                ? '✓ Votre commande a été enregistrée. Vous paierez à la livraison.'
                : estPaiementMobileMoney
                ? '✓ Votre commande a été enregistrée. Effectuez le paiement via votre application mobile money. L\'admin confirmera votre paiement.'
                : '✓ Votre paiement a été effectué avec succès'}
            </p>
            
            <div style={{ 
              textAlign: 'center', 
              marginTop: '2rem',
              padding: '1.5rem',
              background: '#f8f9fa',
              borderRadius: '8px'
            }}>
              <p style={{ marginBottom: '1rem', color: '#666' }}>
                Vous pouvez consulter votre facture et l'historique de toutes vos factures dans "Mes Commandes"
              </p>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  // Rediriger vers Mes Commandes avec l'onglet Factures
                  if (onNavigateToFactures) {
                    onNavigateToFactures();
                  } else if (onRetour) {
                    onRetour();
                  }
                }}
                style={{ 
                  fontSize: '1rem', 
                  padding: '0.75rem 1.5rem',
                  marginRight: '0.5rem'
                }}
              >
                📄 Voir l'historique des factures
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleFermerFacture}
                style={{ 
                  fontSize: '1rem', 
                  padding: '0.75rem 1.5rem'
                }}
              >
                Retour au menu
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Afficher le choix du mode de paiement
  if (etape === 'mode_paiement') {
    return (
      <div className="commande-container">
        <div className="container">
          <button 
            onClick={() => setEtape('infos')} 
            className="btn btn-secondary" 
            style={{ marginBottom: '1rem' }}
          >
            ← Retour aux informations
          </button>

          <h1 className="menu-title">Choisir le mode de paiement</h1>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginTop: '2rem', maxWidth: '800px', margin: '2rem auto' }}>
            {/* Récapitulatif */}
            <div>
              <h2>Récapitulatif</h2>
              <div className="commande-recap">
                <h3>{restaurant.nom}</h3>
                <div className="panier-items" style={{ marginTop: '1rem' }}>
                  {panier.map(item => (
                    <div key={item.id} className="panier-item">
                      <div className="panier-item-info">
                        <div className="panier-item-nom">{item.nom}</div>
                        <div className="panier-item-prix">
                          {parseFloat(item.prix).toFixed(0)} FCFA × {item.quantite}
                        </div>
                      </div>
                      <div style={{ fontWeight: 'bold' }}>
                        {(parseFloat(item.prix) * item.quantite).toFixed(0)} FCFA
                      </div>
                    </div>
                  ))}
                </div>
                <div className="panier-total">
                  <span>Total:</span>
                  <span>{total.toFixed(0)} FCFA</span>
                </div>
              </div>
            </div>

            {/* Choix du mode de paiement */}
            <div>
              <h2 style={{ marginBottom: '1.5rem', color: 'var(--color-primary)', fontSize: '1.5rem', fontWeight: 600 }}>Mode de paiement</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginTop: '1rem' }}>
                <button
                  type="button"
                  onClick={() => handleChoisirModePaiement('carte')}
                  className="btn btn-primary"
                  style={{ 
                    padding: '1.75rem 1.5rem',
                    fontSize: '1rem',
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '1rem',
                    background: modePaiement === 'carte' 
                      ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
                      : 'var(--color-white)',
                    color: modePaiement === 'carte' ? 'white' : 'var(--color-text)',
                    border: `2px solid ${modePaiement === 'carte' ? '#667eea' : 'var(--color-border)'}`,
                    borderRadius: '16px',
                    boxShadow: modePaiement === 'carte' 
                      ? '0 8px 24px rgba(102, 126, 234, 0.3)' 
                      : 'var(--shadow-soft)',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    cursor: 'pointer',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                  onMouseEnter={(e) => {
                    if (modePaiement !== 'carte') {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = 'var(--shadow-medium)';
                      e.currentTarget.style.borderColor = '#667eea';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (modePaiement !== 'carte') {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'var(--shadow-soft)';
                      e.currentTarget.style.borderColor = 'var(--color-border)';
                    }
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
                    <div style={{ 
                      fontSize: '2.5rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '60px',
                      height: '60px',
                      background: modePaiement === 'carte' 
                        ? 'rgba(255, 255, 255, 0.2)' 
                        : 'var(--color-light)',
                      borderRadius: '12px',
                      flexShrink: 0
                    }}>
                      💳
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '0.25rem' }}>
                      <span style={{ fontWeight: 600, fontSize: '1.1rem' }}>Payer par carte bancaire</span>
                      <span style={{ fontSize: '0.85rem', opacity: 0.8 }}>Paiement sécurisé en ligne</span>
                    </div>
                  </div>
                  {modePaiement === 'carte' && (
                    <div style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      background: 'rgba(255, 255, 255, 0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      ✓
                    </div>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => handleChoisirModePaiement('mobile_money')}
                  className="btn btn-secondary"
                  style={{ 
                    padding: '1.75rem 1.5rem',
                    fontSize: '1rem',
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '1rem',
                    background: modePaiement === 'mobile_money' 
                      ? 'linear-gradient(135deg, var(--color-primary) 0%, #2d2d2d 100%)' 
                      : 'var(--color-white)',
                    color: modePaiement === 'mobile_money' ? 'white' : 'var(--color-text)',
                    border: `2px solid ${modePaiement === 'mobile_money' ? 'var(--color-primary)' : 'var(--color-border)'}`,
                    borderRadius: '16px',
                    boxShadow: modePaiement === 'mobile_money' 
                      ? '0 8px 24px rgba(26, 26, 26, 0.3)' 
                      : 'var(--shadow-soft)',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    cursor: 'pointer',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                  onMouseEnter={(e) => {
                    if (modePaiement !== 'mobile_money') {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = 'var(--shadow-medium)';
                      e.currentTarget.style.borderColor = 'var(--color-primary)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (modePaiement !== 'mobile_money') {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'var(--shadow-soft)';
                      e.currentTarget.style.borderColor = 'var(--color-border)';
                    }
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
                    <div style={{ 
                      fontSize: '2.5rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '60px',
                      height: '60px',
                      background: modePaiement === 'mobile_money' 
                        ? 'rgba(255, 255, 255, 0.2)' 
                        : 'var(--color-light)',
                      borderRadius: '12px',
                      flexShrink: 0
                    }}>
                      📱
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '0.25rem' }}>
                      <span style={{ fontWeight: 600, fontSize: '1.1rem' }}>Payer par Mobile Money</span>
                      <span style={{ fontSize: '0.85rem', opacity: 0.8 }}>Airtel Money ou Moov Money</span>
                    </div>
                  </div>
                  {modePaiement === 'mobile_money' && (
                    <div style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      background: 'rgba(255, 255, 255, 0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      ✓
                    </div>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => handleChoisirModePaiement('livraison')}
                  className="btn btn-secondary"
                  style={{ 
                    padding: '1.75rem 1.5rem',
                    fontSize: '1rem',
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '1rem',
                    background: modePaiement === 'livraison' 
                      ? 'linear-gradient(135deg, #28a745 0%, #20c997 100%)' 
                      : 'var(--color-white)',
                    color: modePaiement === 'livraison' ? 'white' : 'var(--color-text)',
                    border: `2px solid ${modePaiement === 'livraison' ? '#28a745' : 'var(--color-border)'}`,
                    borderRadius: '16px',
                    boxShadow: modePaiement === 'livraison' 
                      ? '0 8px 24px rgba(40, 167, 69, 0.3)' 
                      : 'var(--shadow-soft)',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    cursor: 'pointer',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                  onMouseEnter={(e) => {
                    if (modePaiement !== 'livraison') {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = 'var(--shadow-medium)';
                      e.currentTarget.style.borderColor = '#28a745';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (modePaiement !== 'livraison') {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'var(--shadow-soft)';
                      e.currentTarget.style.borderColor = 'var(--color-border)';
                    }
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
                    <div style={{ 
                      fontSize: '2.5rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '60px',
                      height: '60px',
                      background: modePaiement === 'livraison' 
                        ? 'rgba(255, 255, 255, 0.2)' 
                        : 'var(--color-light)',
                      borderRadius: '12px',
                      flexShrink: 0
                    }}>
                      🚚
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '0.25rem' }}>
                      <span style={{ fontWeight: 600, fontSize: '1.1rem' }}>Payer à la livraison</span>
                      <span style={{ fontSize: '0.85rem', opacity: 0.8 }}>Paiement en espèces</span>
                    </div>
                  </div>
                  {modePaiement === 'livraison' && (
                    <div style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      background: 'rgba(255, 255, 255, 0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      ✓
                    </div>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Afficher le formulaire Mobile Money
  if (etape === 'mobile_money') {
    return (
      <div className="commande-container">
        <div className="container">
          <button 
            onClick={() => setEtape('mode_paiement')} 
            className="btn btn-secondary" 
            style={{ marginTop: '5rem', marginBottom: '1rem' }}
          >
            ← Retour au choix du paiement
          </button>

          <h1 className="menu-title">Paiement Mobile Money</h1>

          <div style={{ maxWidth: '600px', margin: '2rem auto' }}>
            <div style={{ 
              background: '#f8f9fa', 
              padding: '1.5rem', 
              borderRadius: '12px', 
              marginBottom: '2rem',
              border: '1px solid #e0e0e0'
            }}>
              <h2 style={{ marginBottom: '1rem', color: '#333' }}>Récapitulatif</h2>
              <div className="commande-recap">
                <h3>{restaurant.nom}</h3>
                <div className="panier-items" style={{ marginTop: '1rem' }}>
                  {panier.map(item => (
                    <div key={item.id} className="panier-item">
                      <div className="panier-item-info">
                        <div className="panier-item-nom">{item.nom}</div>
                        <div className="panier-item-prix">
                          {parseFloat(item.prix).toFixed(0)} FCFA × {item.quantite}
                        </div>
                      </div>
                      <div style={{ fontWeight: 'bold' }}>
                        {(parseFloat(item.prix) * item.quantite).toFixed(0)} FCFA
                      </div>
                    </div>
                  ))}
                </div>
                <div className="panier-total">
                  <span>Total:</span>
                  <span>{total.toFixed(0)} FCFA</span>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmitMobileMoney} style={{ 
              background: 'white', 
              padding: '2rem', 
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}>
              <h2 style={{ marginBottom: '1.5rem', color: '#333' }}>Informations Mobile Money</h2>
              
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '0.5rem', 
                  fontWeight: 600,
                  color: '#333'
                }}>
                  Opérateur *
                </label>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button
                    type="button"
                    onClick={() => setInfosMobileMoney({ ...infosMobileMoney, operateur: 'airtel' })}
                    style={{
                      flex: 1,
                      padding: '1rem',
                      background: infosMobileMoney.operateur === 'airtel' 
                        ? 'linear-gradient(135deg, #E60012 0%, #FF1A2E 100%)' 
                        : '#f8f9fa',
                      color: infosMobileMoney.operateur === 'airtel' ? 'white' : '#333',
                      border: `2px solid ${infosMobileMoney.operateur === 'airtel' ? '#E60012' : '#ddd'}`,
                      borderRadius: '10px',
                      cursor: 'pointer',
                      fontWeight: 600,
                      fontSize: '1rem',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    📱 Airtel Money
                  </button>
                  <button
                    type="button"
                    onClick={() => setInfosMobileMoney({ ...infosMobileMoney, operateur: 'moov' })}
                    style={{
                      flex: 1,
                      padding: '1rem',
                      background: infosMobileMoney.operateur === 'moov' 
                        ? 'linear-gradient(135deg, #00A859 0%, #00C96A 100%)' 
                        : '#f8f9fa',
                      color: infosMobileMoney.operateur === 'moov' ? 'white' : '#333',
                      border: `2px solid ${infosMobileMoney.operateur === 'moov' ? '#00A859' : '#ddd'}`,
                      borderRadius: '10px',
                      cursor: 'pointer',
                      fontWeight: 600,
                      fontSize: '1rem',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    📱 Moov Money
                  </button>
                </div>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '0.5rem', 
                  fontWeight: 600,
                  color: '#333'
                }}>
                  Numéro de téléphone Mobile Money *
                </label>
                <input
                  type="tel"
                  value={infosMobileMoney.numero_telephone}
                  onChange={(e) => {
                    let value = e.target.value.replace(/\D/g, ''); // Garder seulement les chiffres
                    if (value.length <= 9) {
                      setInfosMobileMoney({ ...infosMobileMoney, numero_telephone: value });
                    }
                  }}
                  placeholder="06XXXXXXX ou 07XXXXXXX"
                  required
                  maxLength="9"
                  style={{
                    width: '100%',
                    padding: '0.875rem',
                    border: '2px solid var(--color-border)',
                    borderRadius: '10px',
                    fontSize: '1rem',
                    transition: 'all 0.3s ease'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = 'var(--color-primary)';
                    e.target.style.boxShadow = '0 0 0 3px rgba(107, 159, 120, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'var(--color-border)';
                    e.target.style.boxShadow = 'none';
                  }}
                />
                <p style={{ 
                  marginTop: '0.5rem', 
                  fontSize: '0.85rem', 
                  color: '#666',
                  fontStyle: 'italic'
                }}>
                  Format: 06XXXXXXX ou 07XXXXXXX (9 chiffres au total)
                </p>
              </div>

              <div style={{ 
                background: '#fff3cd', 
                padding: '1rem', 
                borderRadius: '8px', 
                marginBottom: '1.5rem',
                border: '1px solid #ffc107'
              }}>
                <p style={{ margin: 0, fontSize: '0.9rem', color: '#856404' }}>
                  <strong>⚠️ Important:</strong> Après confirmation, vous recevrez un code de transaction. 
                  Effectuez le paiement via votre application mobile money, puis l'admin confirmera votre paiement.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setEtape('mode_paiement')}
                  className="btn btn-secondary"
                  style={{ 
                    padding: '0.875rem 1.5rem',
                    background: 'var(--color-secondary)',
                    color: 'var(--color-white)',
                    border: '1px solid var(--color-secondary)',
                    borderRadius: '10px'
                  }}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ 
                    padding: '0.875rem 1.5rem',
                    background: 'var(--color-primary)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '10px',
                    fontWeight: 600
                  }}
                >
                  Confirmer et créer la commande
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Afficher le formulaire d'informations bancaires pour paiement à la livraison
  if (etape === 'paiement_livraison' && commandeId && facture) {
    return (
      <div className="commande-container">
        <div className="container">
          <h1 className="menu-title">Commande confirmée !</h1>
          
          <div style={{ 
            textAlign: 'center', 
            padding: '1.5rem',
            background: '#e7f3ff',
            borderRadius: '8px',
            marginBottom: '2rem',
            border: '1px solid #b3d9ff'
          }}>
            <p style={{ fontSize: '1.1rem', color: '#28a745', marginBottom: '0.5rem' }}>
              ✓ Votre commande a été enregistrée et la facture a été générée
            </p>
            <p style={{ color: '#666', fontSize: '0.9rem' }}>
              Vous paierez à la livraison en espèces, mobile money ou carte bancaire
            </p>
          </div>

          <h2 style={{ marginBottom: '1rem' }}>Informations bancaires (optionnel)</h2>
          <p style={{ color: '#666', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
            Vous pouvez enregistrer vos informations bancaires pour faciliter le paiement lors de la livraison.
            Si vous préférez payer en espèces, vous pouvez ignorer cette étape.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginTop: '2rem', maxWidth: '900px', margin: '2rem auto' }}>
            {/* Récapitulatif */}
            <div>
              <h2>Récapitulatif</h2>
              <div className="commande-recap">
                <h3>{restaurant.nom}</h3>
                <div className="panier-items" style={{ marginTop: '1rem' }}>
                  {panier.map(item => (
                    <div key={item.id} className="panier-item">
                      <div className="panier-item-info">
                        <div className="panier-item-nom">{item.nom}</div>
                        <div className="panier-item-prix">
                          {parseFloat(item.prix).toFixed(0)} FCFA × {item.quantite}
                        </div>
                      </div>
                      <div style={{ fontWeight: 'bold' }}>
                        {(parseFloat(item.prix) * item.quantite).toFixed(0)} FCFA
                      </div>
                    </div>
                  ))}
                </div>
                <div className="panier-total">
                  <span>Total:</span>
                  <span>{total.toFixed(0)} FCFA</span>
                </div>
              </div>
            </div>

            {/* Formulaire d'informations bancaires */}
            <div>
              <h2>Informations bancaires</h2>
              <div style={{ 
                padding: '1rem', 
                background: '#e7f3ff', 
                borderRadius: '8px', 
                marginBottom: '1rem',
                border: '1px solid #b3d9ff'
              }}>
                <p style={{ margin: 0, color: '#0066cc', fontSize: '0.9rem' }}>
                  ℹ️ Ces informations sont optionnelles et vous permettront de faciliter le paiement lors de la livraison.
                  Vous pouvez également payer en espèces ou mobile money.
                </p>
              </div>

              <form onSubmit={handleSubmitInfosBancaires} className="commande-form">
                <div className="form-group">
                  <label>Numéro de carte bancaire</label>
                  <input
                    type="text"
                    value={infosBancaires.numero_carte}
                    onChange={(e) => {
                      // Formater le numéro de carte avec des espaces tous les 4 chiffres
                      let value = e.target.value.replace(/\s/g, '');
                      if (value.length <= 19) {
                        value = value.match(/.{1,4}/g)?.join(' ') || value;
                        setInfosBancaires({ ...infosBancaires, numero_carte: value });
                      }
                    }}
                    placeholder="1234 5678 9012 3456"
                    maxLength="19"
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label>Date d'expiration (MM/AA)</label>
                    <input
                      type="text"
                      value={infosBancaires.date_expiration}
                      onChange={(e) => {
                        let value = e.target.value.replace(/\D/g, '');
                        if (value.length <= 4) {
                          if (value.length >= 2) {
                            value = value.substring(0, 2) + '/' + value.substring(2);
                          }
                          setInfosBancaires({ ...infosBancaires, date_expiration: value });
                        }
                      }}
                      placeholder="12/25"
                      maxLength="5"
                    />
                  </div>

                  <div className="form-group">
                    <label>CVV</label>
                    <input
                      type="text"
                      value={infosBancaires.cvv}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '').substring(0, 4);
                        setInfosBancaires({ ...infosBancaires, cvv: value });
                      }}
                      placeholder="123"
                      maxLength="4"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Nom du titulaire de la carte</label>
                  <input
                    type="text"
                    value={infosBancaires.nom_titulaire}
                    onChange={(e) => setInfosBancaires({ ...infosBancaires, nom_titulaire: e.target.value.toUpperCase() })}
                    placeholder="NOM PRENOM"
                  />
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={async () => {
                      // Passer sans informations bancaires - la facture est déjà créée
                      setEtape('facture');
                    }}
                    style={{ flex: 1 }}
                  >
                    Passer sans informations bancaires
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ flex: 1 }}
                  >
                    Enregistrer les informations
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Afficher le formulaire de paiement
  if (etape === 'paiement' && commandeId) {
    return (
      <div className="commande-container">
        <div className="container">
          <button 
            onClick={() => setEtape('mode_paiement')} 
            className="btn btn-secondary" 
            style={{ marginBottom: '1rem' }}
          >
            ← Retour au choix du paiement
          </button>

          <h1 className="menu-title">Paiement</h1>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginTop: '2rem' }}>
            {/* Récapitulatif */}
            <div>
              <h2>Récapitulatif de la commande</h2>
              <div className="commande-recap">
                <h3>{restaurant.nom}</h3>
                <div className="panier-items" style={{ marginTop: '1rem' }}>
                  {panier.map(item => (
                    <div key={item.id} className="panier-item">
                      <div className="panier-item-info">
                        <div className="panier-item-nom">{item.nom}</div>
                        <div className="panier-item-prix">
                          {parseFloat(item.prix).toFixed(0)} FCFA × {item.quantite}
                        </div>
                      </div>
                      <div style={{ fontWeight: 'bold' }}>
                        {(parseFloat(item.prix) * item.quantite).toFixed(0)} FCFA
                      </div>
                    </div>
                  ))}
                </div>
                <div className="panier-total">
                  <span>Total:</span>
                  <span>{total.toFixed(0)} FCFA</span>
                </div>
              </div>
            </div>

            {/* Formulaire de paiement */}
            <div>
              <h2>Paiement par carte bancaire</h2>
              <Paiement
                commandeId={commandeId}
                montant={total}
                onSuccess={handlePaiementSuccess}
                onError={handlePaiementError}
                onRetour={() => setEtape('mode_paiement')}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Afficher le formulaire d'informations
  return (
    <div className="commande-container">
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <div className="container">
        <button onClick={onRetour} className="btn btn-secondary" style={{ marginBottom: '1rem' }}>
          ← Retour au menu
        </button>

        <h1 className="menu-title">Finaliser votre commande</h1>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginTop: '2rem' }}>
          {/* Détails de la commande */}
          <div>
            <h2>Récapitulatif</h2>
            <div className="commande-recap">
              <h3>{restaurant.nom}</h3>
              <div className="panier-items" style={{ marginTop: '1rem' }}>
                {panier.map(item => (
                  <div key={item.id} className="panier-item">
                    <div className="panier-item-info">
                      <div className="panier-item-nom">{item.nom}</div>
                      <div className="panier-item-prix">
                        {parseFloat(item.prix).toFixed(0)} FCFA × {item.quantite}
                      </div>
                    </div>
                    <div style={{ fontWeight: 'bold' }}>
                      {(parseFloat(item.prix) * item.quantite).toFixed(0)} FCFA
                    </div>
                  </div>
                ))}
              </div>
              <div className="panier-total">
                <span>Total:</span>
                <span>{total.toFixed(0)} FCFA</span>
              </div>
            </div>
          </div>

          {/* Formulaire */}
          <div>
            <h2>Informations de livraison</h2>
            <form onSubmit={handleSubmit} className="commande-form">
              <div className="form-group" style={{ position: 'relative' }}>
                <label>Adresse de livraison *</label>
                <input
                  ref={adresseInputRef}
                  type="text"
                  value={adresse}
                  onChange={(e) => handleAdresseChange(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onFocus={() => {
                    if (suggestions.length > 0) {
                      setShowSuggestions(true);
                    }
                  }}
                  required
                  placeholder="Commencez à taper un quartier (ex: Mont-Bouët, PK8...)"
                  style={{
                    width: '100%',
                    padding: '0.875rem',
                    border: '2px solid var(--color-border)',
                    borderRadius: '10px',
                    fontSize: '1rem',
                    transition: 'all 0.3s ease',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = 'var(--color-primary)';
                    e.target.style.boxShadow = '0 0 0 3px rgba(107, 159, 120, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'var(--color-border)';
                    e.target.style.boxShadow = 'none';
                  }}
                />
                {showSuggestions && suggestions.length > 0 && (
                  <div
                    ref={suggestionsRef}
                    style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      background: 'white',
                      border: '2px solid var(--color-border)',
                      borderRadius: '10px',
                      boxShadow: 'var(--shadow-medium)',
                      zIndex: 1000,
                      marginTop: '0.25rem',
                      maxHeight: '300px',
                      overflowY: 'auto',
                      overflowX: 'hidden'
                    }}
                  >
                    {suggestions.map((suggestion, index) => (
                      <div
                        key={index}
                        onClick={() => selectSuggestion(suggestion)}
                        style={{
                          padding: '0.875rem 1rem',
                          cursor: 'pointer',
                          background: selectedIndex === index 
                            ? 'var(--color-light)' 
                            : 'white',
                          borderBottom: index < suggestions.length - 1 
                            ? '1px solid var(--color-border)' 
                            : 'none',
                          transition: 'all 0.2s ease',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem'
                        }}
                        onMouseEnter={() => setSelectedIndex(index)}
                        onMouseLeave={() => setSelectedIndex(-1)}
                      >
                        <span style={{ fontSize: '1.1rem' }}>📍</span>
                        <span style={{ 
                          color: 'var(--color-text)',
                          fontSize: '0.95rem',
                          fontWeight: selectedIndex === index ? 600 : 400
                        }}>
                          {suggestion}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
                <small style={{ 
                  color: '#666', 
                  fontSize: '0.85rem', 
                  marginTop: '0.5rem', 
                  display: 'block',
                  fontStyle: 'italic'
                }}>
                  💡 Saisissez le nom d'un quartier de Libreville, Owendo ou Akanda
                </small>
              </div>

              <div className="form-group">
                <label>Numéro WhatsApp *</label>
                <input
                  type="tel"
                  value={telephone}
                  onChange={(e) => setTelephone(e.target.value)}
                  required
                  placeholder="Votre numéro WhatsApp (ex: +241 7 72 40 40 7)"
                />
                <small style={{ color: '#666', fontSize: '0.85rem', marginTop: '0.25rem', display: 'block' }}>
                  Ce numéro sera utilisé pour vous contacter sur WhatsApp en cas de besoin
                </small>
              </div>

              <div className="form-group">
                <label>Notes pour le restaurant (optionnel)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Instructions spéciales, code d'accès, etc."
                  rows="4"
                  style={{ width: '100%', padding: '0.75rem', border: '2px solid #ddd', borderRadius: '8px' }}
                />
              </div>

              <button type="submit" className="btn-commander" style={{ width: '100%', marginTop: '1rem' }}>
                Continuer
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Commande;


