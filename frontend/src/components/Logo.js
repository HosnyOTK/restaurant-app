import React from 'react';
import './Logo.css';

function Logo({ onClick, variant = 'dark', size = 'medium' }) {
  return (
    <div 
      className={`logo-container ${variant} ${size}`}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      <div className="logo-icon">
        <div className="line1"></div>
        <div className="line2"></div>
      </div>
      <div className="logo-text">
        <h1>LivraisonServiceFood</h1>
        <p>Bien manger en quantité et en qualité</p>
      </div>
    </div>
  );
}

export default Logo;


