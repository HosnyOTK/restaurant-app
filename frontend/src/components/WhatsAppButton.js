import React from 'react';

const WHATSAPP_NUMBER = '24162998295'; // Format international sans le +

// Fonction pour nettoyer le numéro de téléphone (enlever espaces, +, etc.)
const cleanPhoneNumber = (phone) => {
  if (!phone) return WHATSAPP_NUMBER;
  // Enlever tous les caractères non numériques sauf le premier + si présent
  let cleaned = phone.replace(/[^\d+]/g, '');
  // Si ça commence par +, on l'enlève
  if (cleaned.startsWith('+')) {
    cleaned = cleaned.substring(1);
  }
  return cleaned || WHATSAPP_NUMBER;
};

function WhatsAppButton({ message = '', className = '', phoneNumber = null }) {
  const defaultMessage = message || 'Bonjour, je souhaite avoir plus d\'informations';
  const phone = cleanPhoneNumber(phoneNumber);
  const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(defaultMessage)}`;

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`whatsapp-button ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.75rem 1.5rem',
        backgroundColor: '#25D366',
        color: 'white',
        textDecoration: 'none',
        borderRadius: '50px',
        fontWeight: 'bold',
        transition: 'all 0.3s',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = '#20BA5A';
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 6px 12px rgba(0,0,0,0.15)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = '#25D366';
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
      }}
    >
      <span style={{ fontSize: '1.5rem' }}>💬</span>
      <span>Contacter sur WhatsApp</span>
    </a>
  );
}

export default WhatsAppButton;



