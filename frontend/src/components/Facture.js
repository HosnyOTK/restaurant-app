import React from 'react';

function Facture({ facture, onClose }) {
  if (!facture) {
    return null;
  }

  // Gérer les deux formats possibles de facture
  const factureData = facture.facture || facture;
  const commande = facture.commande || facture.facture?.commande || factureData?.commande;
  
  if (!factureData) {
    console.error('Facture: factureData est null', facture);
    return null;
  }

  // Debug si nécessaire
  if (!commande) {
    console.warn('Facture: commande non trouvée', facture);
  }
  
  const estPaiementLivraison = factureData.mode_paiement === 'livraison';
  const estPaye = factureData.statut_paiement === 'paye';

  const imprimerFacture = () => {
    window.print();
  };

  const telechargerFacturePDF = () => {
    // Créer un contenu HTML pour la facture
    const factureContent = document.getElementById('facture-content');
    if (!factureContent) return;

    // Créer une nouvelle fenêtre pour l'impression/PDF
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Facture ${factureData.numero_facture}</title>
          <style>
            @media print {
              @page {
                size: A4;
                margin: 1.5cm;
              }
              body {
                background: white;
              }
            }
            body {
              font-family: 'Helvetica Neue', Arial, sans-serif;
              padding: 20px;
              color: #333;
              background: white;
            }
            .header {
              background: linear-gradient(135deg, #1a1a1a 0%, #8FB99A 100%);
              color: white;
              padding: 2rem;
              border-radius: 12px;
              margin-bottom: 30px;
            }
            .header h2 {
              color: white;
              margin: 0;
              font-size: 2rem;
            }
            .info-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 2rem;
              margin-bottom: 30px;
              padding: 1.5rem;
              background: #f8f9fa;
              border-radius: 12px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 20px 0;
              border-radius: 12px;
              overflow: hidden;
            }
            th, td {
              padding: 12px;
              text-align: left;
            }
            th {
              background: linear-gradient(135deg, #1a1a1a 0%, #8FB99A 100%);
              color: white;
              font-weight: 600;
            }
            tr:nth-child(even) {
              background: #fafafa;
            }
            .total-box {
              background: linear-gradient(135deg, #1a1a1a 0%, #8FB99A 100%);
              color: white;
              padding: 1.5rem;
              border-radius: 12px;
              text-align: right;
              margin-top: 20px;
            }
            .total-box strong {
              font-size: 2rem;
            }
            .footer {
              margin-top: 40px;
              padding: 2rem;
              background: #f8f9fa;
              border-radius: 12px;
              text-align: center;
              color: #666;
            }
          </style>
        </head>
        <body>
          ${factureContent.innerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
    
    // Attendre que le contenu soit chargé puis imprimer
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  const telechargerFactureHTML = () => {
    const factureContent = document.getElementById('facture-content');
    if (!factureContent) return;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Facture ${factureData.numero_facture}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 20px;
              color: #333;
              max-width: 800px;
              margin: 0 auto;
            }
            .header {
              display: flex;
              justify-content: space-between;
              margin-bottom: 30px;
              border-bottom: 2px solid #667eea;
              padding-bottom: 20px;
            }
            .header h2 {
              color: #667eea;
              margin: 0;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 20px 0;
            }
            th, td {
              padding: 10px;
              text-align: left;
              border-bottom: 1px solid #ddd;
            }
            th {
              background-color: #667eea;
              color: white;
            }
            .total {
              text-align: right;
              margin-top: 20px;
            }
          </style>
        </head>
        <body>
          ${factureContent.innerHTML}
        </body>
      </html>
    `;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Facture_${factureData.numero_facture}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000,
      padding: '20px'
    }}>
      <div 
        className="modal" 
        onClick={(e) => e.stopPropagation()}
        style={{ 
          maxWidth: '900px', 
          width: '100%',
          maxHeight: '95vh',
          overflowY: 'auto',
          background: 'white',
          borderRadius: '16px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
          position: 'relative'
        }}
      >
        {/* En-tête moderne avec gradient */}
        <div style={{
          background: 'linear-gradient(135deg, var(--color-primary) 0%, #8FB99A 100%)',
          padding: '2rem',
          color: 'white',
          borderRadius: '16px 16px 0 0',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{
            position: 'absolute',
            top: '-50px',
            right: '-50px',
            width: '200px',
            height: '200px',
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '50%'
          }} />
          <div style={{
            position: 'absolute',
            bottom: '-30px',
            left: '-30px',
            width: '150px',
            height: '150px',
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '50%'
          }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', position: 'relative', zIndex: 1 }}>
            <div>
              <h2 style={{ 
                margin: 0, 
                fontSize: '2rem', 
                fontWeight: 600,
                textShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
              }}>
                Facture #{factureData.numero_facture}
              </h2>
              <p style={{ margin: '0.5rem 0 0 0', opacity: 0.95, fontSize: '1rem' }}>
                {new Date(factureData.date_facture).toLocaleDateString('fr-FR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button 
                className="btn" 
                onClick={imprimerFacture}
                style={{ 
                  fontSize: '0.9rem', 
                  padding: '0.6rem 1.2rem',
                  background: 'rgba(255, 255, 255, 0.2)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  color: 'white',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  backdropFilter: 'blur(10px)'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = 'rgba(255, 255, 255, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'rgba(255, 255, 255, 0.2)';
                }}
                title="Imprimer la facture"
              >
                🖨️ Imprimer
              </button>
              <button 
                className="btn" 
                onClick={telechargerFacturePDF}
                style={{ 
                  fontSize: '0.9rem', 
                  padding: '0.6rem 1.2rem',
                  background: 'rgba(255, 255, 255, 0.2)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  color: 'white',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  backdropFilter: 'blur(10px)'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = 'rgba(255, 255, 255, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'rgba(255, 255, 255, 0.2)';
                }}
                title="Télécharger en PDF"
              >
                📄 PDF
              </button>
              <button 
                className="close-btn" 
                onClick={onClose}
                style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  color: 'white',
                  width: '40px',
                  height: '40px',
                  borderRadius: '8px',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.3s',
                  backdropFilter: 'blur(10px)'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = 'rgba(255, 255, 255, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'rgba(255, 255, 255, 0.2)';
                }}
              >
                ×
              </button>
            </div>
          </div>
        </div>

        <div style={{ padding: '2.5rem' }} id="facture-content">
          {/* Informations restaurant et client */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr',
            gap: '2rem',
            marginBottom: '2.5rem',
            padding: '1.5rem',
            background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
            borderRadius: '12px',
            border: '1px solid #e0e0e0'
          }}>
            <div>
              <div style={{
                display: 'inline-block',
                padding: '0.5rem 1rem',
                background: 'var(--color-primary)',
                color: 'white',
                borderRadius: '8px',
                fontSize: '0.85rem',
                fontWeight: 600,
                marginBottom: '1rem',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                Restaurant
              </div>
              <h3 style={{ margin: '0.5rem 0', color: 'var(--color-primary)', fontSize: '1.3rem', fontWeight: 600 }}>
                {commande?.restaurant_nom || 'Livraison Service Fastfood'}
              </h3>
              {commande?.restaurant_adresse && (
                <p style={{ margin: '0.5rem 0', color: '#555', fontSize: '0.95rem', lineHeight: '1.6' }}>
                  📍 {commande.restaurant_adresse}
                </p>
              )}
              {commande?.restaurant_telephone && (
                <p style={{ margin: '0.5rem 0', color: '#555', fontSize: '0.95rem' }}>
                  📞 {commande.restaurant_telephone}
                </p>
              )}
            </div>
            <div>
              <div style={{
                display: 'inline-block',
                padding: '0.5rem 1rem',
                background: 'var(--color-secondary)',
                color: 'white',
                borderRadius: '8px',
                fontSize: '0.85rem',
                fontWeight: 600,
                marginBottom: '1rem',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                Client
              </div>
              <h3 style={{ margin: '0.5rem 0', color: 'var(--color-primary)', fontSize: '1.3rem', fontWeight: 600 }}>
                {commande?.client_prenom} {commande?.client_nom}
              </h3>
              {commande?.client_email && (
                <p style={{ margin: '0.5rem 0', color: '#555', fontSize: '0.95rem' }}>
                  ✉️ {commande.client_email}
                </p>
              )}
              {commande?.adresse_livraison && (
                <p style={{ margin: '0.5rem 0', color: '#555', fontSize: '0.95rem', lineHeight: '1.6' }}>
                  📍 {commande.adresse_livraison}
                </p>
              )}
            </div>
          </div>

          {/* Détails de la commande */}
          <div style={{ marginBottom: '2.5rem' }}>
            <h3 style={{ 
              marginBottom: '1.5rem', 
              color: 'var(--color-primary)', 
              fontSize: '1.4rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <span style={{
                display: 'inline-block',
                width: '4px',
                height: '24px',
                background: 'var(--color-primary)',
                borderRadius: '2px'
              }} />
              Détails de la commande
            </h3>
            <div style={{
              border: '1px solid #e0e0e0',
              borderRadius: '12px',
              overflow: 'hidden',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)'
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ 
                    background: 'linear-gradient(135deg, var(--color-primary) 0%, #8FB99A 100%)',
                    color: 'white'
                  }}>
                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, fontSize: '0.95rem' }}>Article</th>
                    <th style={{ padding: '1rem', textAlign: 'center', fontWeight: 600, fontSize: '0.95rem' }}>Qté</th>
                    <th style={{ padding: '1rem', textAlign: 'right', fontWeight: 600, fontSize: '0.95rem' }}>Prix unitaire</th>
                    <th style={{ padding: '1rem', textAlign: 'right', fontWeight: 600, fontSize: '0.95rem' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {commande?.details?.map((detail, index) => (
                    <tr 
                      key={index} 
                      style={{ 
                        borderBottom: index < (commande?.details?.length - 1) ? '1px solid #f0f0f0' : 'none',
                        background: index % 2 === 0 ? '#ffffff' : '#fafafa',
                        transition: 'background 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#f0f7f4';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = index % 2 === 0 ? '#ffffff' : '#fafafa';
                      }}
                    >
                      <td style={{ padding: '1rem', fontWeight: 500, color: '#333' }}>{detail.plat_nom}</td>
                      <td style={{ padding: '1rem', textAlign: 'center', color: '#666' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '0.25rem 0.75rem',
                          background: 'var(--color-light)',
                          borderRadius: '6px',
                          fontWeight: 600,
                          color: 'var(--color-primary)'
                        }}>
                          {detail.quantite}
                        </span>
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'right', color: '#666' }}>
                        {parseFloat(detail.prix_unitaire).toFixed(0)} FCFA
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 600, color: '#333' }}>
                        {parseFloat(detail.sous_total).toFixed(0)} FCFA
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Total et informations de paiement */}
          <div style={{ 
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '2rem',
            marginTop: '2rem'
          }}>
            {/* Total */}
            <div style={{
              padding: '1.5rem',
              background: 'linear-gradient(135deg, var(--color-primary) 0%, #8FB99A 100%)',
              borderRadius: '12px',
              color: 'white',
              textAlign: 'right'
            }}>
              <p style={{ 
                margin: '0 0 0.5rem 0', 
                fontSize: '1rem',
                opacity: 0.9
              }}>
                Total TTC
              </p>
              <p style={{ 
                margin: 0, 
                fontSize: '2.5rem',
                fontWeight: 700,
                textShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
              }}>
                {parseFloat(factureData.montant_total).toFixed(0)} FCFA
              </p>
            </div>

            {/* Statut et mode de paiement */}
            <div style={{
              padding: '1.5rem',
              background: '#f8f9fa',
              borderRadius: '12px',
              border: '1px solid #e0e0e0'
            }}>
              <div style={{ marginBottom: '1rem' }}>
                <p style={{ 
                  margin: '0 0 0.5rem 0', 
                  color: '#666', 
                  fontSize: '0.9rem',
                  fontWeight: 500
                }}>
                  Statut du paiement
                </p>
                <div style={{
                  display: 'inline-block',
                  padding: '0.5rem 1rem',
                  background: estPaye ? '#28a745' : estPaiementLivraison ? '#ffc107' : '#dc3545',
                  color: 'white',
                  borderRadius: '8px',
                  fontSize: '0.9rem',
                  fontWeight: 600
                }}>
                  {estPaye ? '✓ Paiement confirmé' : estPaiementLivraison ? '⏳ À la livraison' : '⏳ En attente'}
                </div>
              </div>
              <div>
                <p style={{ 
                  margin: '0 0 0.5rem 0', 
                  color: '#666', 
                  fontSize: '0.9rem',
                  fontWeight: 500
                }}>
                  Mode de paiement
                </p>
                <p style={{ 
                  margin: 0, 
                  color: '#333', 
                  fontSize: '1rem',
                  fontWeight: 600
                }}>
                  {factureData.mode_paiement === 'carte' ? '💳 Carte bancaire' : factureData.mode_paiement === 'livraison' ? '🚚 À la livraison' : factureData.mode_paiement}
                </p>
              </div>
            </div>
          </div>

          {/* Informations bancaires (si paiement à la livraison) */}
          {factureData.mode_paiement === 'livraison' && factureData.numero_carte && (
            <div style={{ 
              marginTop: '1.5rem', 
              padding: '1.5rem', 
              background: 'linear-gradient(135deg, #fff9e6 0%, #fff5d6 100%)', 
              borderRadius: '12px',
              border: '1px solid #ffd700'
            }}>
              <h4 style={{ 
                margin: '0 0 1rem 0', 
                color: '#856404',
                fontSize: '1rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                💳 Informations bancaires enregistrées
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <p style={{ margin: '0.25rem 0', color: '#856404', fontSize: '0.85rem', fontWeight: 500 }}>
                    Numéro de carte
                  </p>
                  <p style={{ margin: 0, color: '#333', fontSize: '0.95rem', fontWeight: 600 }}>
                    {factureData.numero_carte}
                  </p>
                </div>
                {factureData.date_expiration && (
                  <div>
                    <p style={{ margin: '0.25rem 0', color: '#856404', fontSize: '0.85rem', fontWeight: 500 }}>
                      Date d'expiration
                    </p>
                    <p style={{ margin: 0, color: '#333', fontSize: '0.95rem', fontWeight: 600 }}>
                      {factureData.date_expiration}
                    </p>
                  </div>
                )}
                {factureData.nom_titulaire && (
                  <div style={{ gridColumn: '1 / -1' }}>
                    <p style={{ margin: '0.25rem 0', color: '#856404', fontSize: '0.85rem', fontWeight: 500 }}>
                      Titulaire
                    </p>
                    <p style={{ margin: 0, color: '#333', fontSize: '0.95rem', fontWeight: 600 }}>
                      {factureData.nom_titulaire}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Notes */}
          {commande?.notes && (
            <div style={{ 
              marginTop: '1.5rem', 
              padding: '1.5rem', 
              background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)', 
              borderRadius: '12px',
              border: '1px solid #90caf9'
            }}>
              <h4 style={{ 
                margin: '0 0 0.75rem 0', 
                color: '#1565c0',
                fontSize: '1rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                📝 Notes spéciales
              </h4>
              <p style={{ margin: 0, color: '#333', fontSize: '0.95rem', lineHeight: '1.6' }}>
                {commande.notes}
              </p>
            </div>
          )}

          {/* Pied de page */}
          <div style={{ 
            marginTop: '2.5rem', 
            padding: '2rem', 
            background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
            borderRadius: '12px',
            border: '1px solid #e0e0e0',
            textAlign: 'center'
          }}>
            <p style={{ 
              margin: '0 0 0.5rem 0', 
              color: 'var(--color-primary)', 
              fontSize: '1.1rem',
              fontWeight: 600
            }}>
              Merci de votre confiance ! 🙏
            </p>
            <p style={{ 
              margin: 0, 
              color: '#666', 
              fontSize: '0.95rem',
              lineHeight: '1.6'
            }}>
              Pour toute question, contactez-nous au 
              <strong style={{ color: 'var(--color-primary)', marginLeft: '0.25rem' }}>
                {commande?.restaurant_telephone || '062998295'}
              </strong>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Facture;

