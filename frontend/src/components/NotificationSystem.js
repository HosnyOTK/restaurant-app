import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const API_URL = 'http://localhost:5000';

function NotificationSystem({ user, onRefresh }) {
  const [notifications, setNotifications] = useState([]);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (!user) return;

    // Créer la connexion Socket.io
    const newSocket = io(API_URL, {
      transports: ['websocket', 'polling']
    });

    newSocket.on('connect', () => {
      console.log('Connecté à Socket.io');
      // Informer le serveur de la connexion avec l'ID utilisateur et le rôle
      newSocket.emit('user-connected', {
        userId: user.id,
        role: user.role
      });
    });

    // Écouter les différentes notifications
    newSocket.on('nouvelle-commande', (data) => {
      if (user.role === 'admin') {
        addNotification({
          ...data,
          id: Date.now(),
          timestamp: new Date()
        });
      }
    });

    newSocket.on('commande-creee', (data) => {
      if (user.role === 'client') {
        addNotification({
          ...data,
          id: Date.now(),
          timestamp: new Date()
        });
        // Rafraîchir les commandes si onRefresh est disponible
        if (onRefresh) {
          setTimeout(() => onRefresh(), 1000);
        }
      }
    });

    newSocket.on('commande-attribuee', (data) => {
      if (user.role === 'livreur') {
        addNotification({
          ...data,
          id: Date.now(),
          timestamp: new Date()
        });
        // Rafraîchir les commandes si onRefresh est disponible
        if (onRefresh) {
          setTimeout(() => onRefresh(), 1000);
        }
      }
    });

    newSocket.on('statut-commande-change', (data) => {
      addNotification({
        ...data,
        id: Date.now(),
        timestamp: new Date()
      });
      // Rafraîchir les données si onRefresh est disponible
      if (onRefresh) {
        setTimeout(() => onRefresh(), 1000);
      }
    });

    newSocket.on('commande-livree', (data) => {
      addNotification({
        ...data,
        id: Date.now(),
        timestamp: new Date()
      });
      // Rafraîchir les données si onRefresh est disponible
      if (onRefresh) {
        setTimeout(() => onRefresh(), 1000);
      }
    });

    newSocket.on('disconnect', () => {
      console.log('Déconnecté de Socket.io');
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [user, onRefresh]);

  const addNotification = (notification) => {
    setNotifications(prev => [notification, ...prev.slice(0, 9)]); // Garder max 10 notifications
    
    // Supprimer automatiquement après 8 secondes
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== notification.id));
    }, 8000);

    // Afficher une notification système du navigateur si supportée
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.message || 'Nouvelle notification', {
        icon: '/favicon.ico',
        badge: '/favicon.ico'
      });
    }
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // Demander la permission pour les notifications système
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  return (
    <div className="notification-container">
      {notifications.map(notification => (
        <div
          key={notification.id}
          data-notification-id={notification.id}
          className="notification-toast"
          onClick={() => removeNotification(notification.id)}
        >
          <div className="notification-content">
            <div className="notification-icon">
              {notification.type === 'nouvelle-commande' && '🆕'}
              {notification.type === 'commande-creee' && '✅'}
              {notification.type === 'commande-attribuee' && '📦'}
              {notification.type === 'statut-commande-change' && '🔄'}
              {notification.type === 'commande-livree' && '🎉'}
            </div>
            <div className="notification-text">
              <strong>{notification.message}</strong>
              {notification.commandeId && (
                <span className="notification-meta">
                  Commande #{notification.commandeId}
                </span>
              )}
            </div>
            <button className="notification-close" onClick={(e) => {
              e.stopPropagation();
              removeNotification(notification.id);
            }}>
              ×
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

export default NotificationSystem;

