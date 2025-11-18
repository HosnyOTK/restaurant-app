import React, { useEffect, useState } from 'react';
import './BackgroundLogo.css';

function BackgroundLogo() {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="background-logo-container">
      <div 
        className="background-logo"
        style={{
          transform: `translate(-50%, calc(-50% + ${scrollY * 0.3}px))`
        }}
      >
        <div className="logo-icon-bg">
          <div className="line1-bg"></div>
          <div className="line2-bg"></div>
        </div>
        <div className="logo-text-bg">
          <h1>LivraisonServiceFood</h1>
          <p>BIEN MANGER EN QUANTITÉ ET EN QUALITÉ</p>
        </div>
      </div>
    </div>
  );
}

export default BackgroundLogo;

