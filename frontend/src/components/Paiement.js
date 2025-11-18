import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import API_URL from '../config/api';

// Initialiser Stripe (utilisez votre clé publique Stripe)
const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY || 'pk_test_51Qdummy_key_for_testing');

// Fonction helper pour fetch avec timeout
const fetchWithTimeout = (url, options, timeout = 10000) => {
  return Promise.race([
    fetch(url, options),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Timeout: La requête a pris trop de temps')), timeout)
    )
  ]);
};

// Composant de formulaire de paiement
function CheckoutForm({ commandeId, montant, onSuccess, onError }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [loadingIntent, setLoadingIntent] = useState(true);
  const [error, setError] = useState(null);
  const [clientSecret, setClientSecret] = useState(null);
  const [paymentIntentId, setPaymentIntentId] = useState(null);
  const [isSimulated, setIsSimulated] = useState(false);

  useEffect(() => {
    // Créer l'intention de paiement
    const createPaymentIntent = async () => {
      setLoadingIntent(true);
      setError(null);
      
      try {
        const token = localStorage.getItem('token');
        
        // Utiliser fetch avec timeout de 8 secondes
        const response = await fetchWithTimeout(
          `${API_URL}/paiement/create-payment-intent`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              commande_id: commandeId,
              montant: montant
            })
          },
          8000 // 8 secondes de timeout
        );

        if (response.ok) {
          const data = await response.json();
          setClientSecret(data.clientSecret);
          setPaymentIntentId(data.paymentIntentId);
          setIsSimulated(data.simulated || false);
        } else {
          const errorData = await response.json().catch(() => ({ error: 'Erreur serveur' }));
          setError(errorData.error || 'Erreur lors de la création de l\'intention de paiement');
        }
      } catch (err) {
        console.error('Erreur:', err);
        if (err.message.includes('Timeout')) {
          setError('Le chargement prend trop de temps. Veuillez réessayer ou choisir le paiement à la livraison.');
        } else {
          setError('Erreur de connexion au serveur. Veuillez réessayer.');
        }
      } finally {
        setLoadingIntent(false);
      }
    };

    if (commandeId && montant) {
      createPaymentIntent();
    }
  }, [commandeId, montant]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    // Pour les paiements simulés, on n'a pas besoin de Stripe
    if (!isSimulated && (!stripe || !elements)) {
      return;
    }

    setLoading(true);
    setError(null);

    // Si c'est un paiement simulé, passer directement à la confirmation
    if (isSimulated) {
      // Simuler un délai pour le feedback utilisateur
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Confirmer directement le paiement côté serveur
      const token = localStorage.getItem('token');
      const confirmResponse = await fetch(`${API_URL}/paiement/confirm-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          commande_id: commandeId,
          payment_intent_id: paymentIntentId,
          transaction_id: paymentIntentId
        })
      });

      if (confirmResponse.ok) {
        const facture = await confirmResponse.json();
        if (onSuccess) {
          onSuccess(facture);
        }
      } else {
        const errorData = await confirmResponse.json();
        setError(errorData.error || 'Erreur lors de la confirmation du paiement');
        if (onError) {
          onError(errorData.error);
        }
      }
      setLoading(false);
      return;
    }

    const cardElement = elements.getElement(CardElement);

    try {
      // Confirmer le paiement avec Stripe
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            // Ajouter les informations de facturation si nécessaire
          }
        }
      });

      if (stripeError) {
        setError(stripeError.message);
        setLoading(false);
        if (onError) {
          onError(stripeError.message);
        }
        return;
      }

      if (paymentIntent.status === 'succeeded') {
        // Confirmer le paiement côté serveur et créer la facture
        const token = localStorage.getItem('token');
        const confirmResponse = await fetch(`${API_URL}/paiement/confirm-payment`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            commande_id: commandeId,
            payment_intent_id: paymentIntentId,
            transaction_id: paymentIntent.id
          })
        });

        if (confirmResponse.ok) {
          const facture = await confirmResponse.json();
          if (onSuccess) {
            onSuccess(facture);
          }
        } else {
          const errorData = await confirmResponse.json();
          setError(errorData.error || 'Erreur lors de la confirmation du paiement');
          if (onError) {
            onError(errorData.error);
          }
        }
      } else {
        setError('Le paiement n\'a pas été confirmé');
        if (onError) {
          onError('Le paiement n\'a pas été confirmé');
        }
      }
    } catch (err) {
      console.error('Erreur lors du paiement:', err);
      setError('Une erreur est survenue lors du paiement');
      if (onError) {
        onError('Une erreur est survenue lors du paiement');
      }
    } finally {
      setLoading(false);
    }
  };

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#424770',
        '::placeholder': {
          color: '#aab7c4',
        },
      },
      invalid: {
        color: '#9e2146',
      },
    },
  };

  return (
    <form onSubmit={handleSubmit} style={{ marginTop: '1rem' }}>
      {loadingIntent && (
        <div style={{ 
          textAlign: 'center', 
          padding: '2rem',
          background: '#f8f9fa',
          borderRadius: '8px',
          marginBottom: '1rem'
        }}>
          <div style={{ 
            display: 'inline-block',
            width: '40px',
            height: '40px',
            border: '4px solid #f3f3f3',
            borderTop: '4px solid #667eea',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            marginBottom: '1rem'
          }}></div>
          <p style={{ color: '#666', margin: 0 }}>Chargement du formulaire de paiement...</p>
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      )}

      <div style={{ 
        padding: '1rem', 
        border: '1px solid #ddd', 
        borderRadius: '8px',
        marginBottom: '1rem',
        background: '#f9f9f9',
        opacity: loadingIntent ? 0.5 : 1,
        pointerEvents: loadingIntent ? 'none' : 'auto'
      }}>
        <label style={{ 
          display: 'block', 
          marginBottom: '0.5rem', 
          fontWeight: 'bold',
          fontSize: '0.9rem'
        }}>
          Informations de la carte bancaire
        </label>
        {!loadingIntent && !isSimulated && <CardElement options={cardElementOptions} />}
        {!loadingIntent && isSimulated && (
          <div style={{ 
            padding: '1rem', 
            background: '#e7f3ff',
            borderRadius: '4px',
            border: '1px solid #b3d9ff'
          }}>
            <p style={{ margin: 0, color: '#0066cc', fontSize: '0.9rem' }}>
              ℹ️ Mode test activé : Le paiement sera simulé sans communication avec Stripe.
            </p>
          </div>
        )}
        {loadingIntent && (
          <div style={{ 
            padding: '2rem', 
            textAlign: 'center', 
            color: '#999',
            fontSize: '0.9rem'
          }}>
            Chargement du champ de carte...
          </div>
        )}
      </div>

      {error && (
        <div style={{ 
          color: '#dc3545', 
          padding: '0.75rem', 
          marginBottom: '1rem',
          background: '#f8d7da',
          border: '1px solid #f5c6cb',
          borderRadius: '4px'
        }}>
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={(!isSimulated && (!stripe || !elements)) || loading || loadingIntent || !clientSecret}
        className="btn btn-primary"
        style={{ 
          width: '100%', 
          padding: '1rem',
          fontSize: '1.1rem',
          fontWeight: 'bold',
          opacity: ((!isSimulated && (!stripe || !elements)) || loadingIntent || !clientSecret) ? 0.6 : 1,
          cursor: ((!isSimulated && (!stripe || !elements)) || loadingIntent || !clientSecret) ? 'not-allowed' : 'pointer'
        }}
      >
        {loadingIntent ? 'Chargement...' : loading ? 'Traitement du paiement...' : `Payer ${parseFloat(montant).toFixed(0)} FCFA`}
      </button>

      <p style={{ 
        fontSize: '0.85rem', 
        color: '#666', 
        marginTop: '1rem',
        textAlign: 'center'
      }}>
        🔒 Paiement sécurisé par Stripe
      </p>
    </form>
  );
}

// Composant principal de paiement
function Paiement({ commandeId, montant, onSuccess, onError, onRetour }) {
  return (
    <Elements stripe={stripePromise}>
      {onRetour && (
        <button 
          onClick={onRetour} 
          className="btn btn-secondary" 
          style={{ 
            marginBottom: '1rem',
            padding: '0.75rem 1.5rem',
            fontSize: '1rem'
          }}
        >
          ← Retour
        </button>
      )}
      <CheckoutForm 
        commandeId={commandeId} 
        montant={montant} 
        onSuccess={onSuccess}
        onError={onError}
      />
    </Elements>
  );
}

export default Paiement;

