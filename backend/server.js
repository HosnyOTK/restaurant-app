const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

// Initialiser la base de données
require('./database/init');

const app = express();
const server = http.createServer(app);

// Configuration CORS pour accepter les requêtes depuis le frontend
const allowedOrigins = [
  'http://localhost:3000',
  process.env.FRONTEND_URL,
  process.env.NETLIFY_URL
].filter(Boolean); // Retire les valeurs undefined

// Configuration Socket.io avec CORS
const io = new Server(server, {
  cors: {
    origin: allowedOrigins.length > 0 ? allowedOrigins : "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Middleware pour rendre io accessible dans les routes
app.set('io', io);

// Middleware CORS
app.use(cors({
  origin: function (origin, callback) {
    // Autoriser les requêtes sans origine (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    // Autoriser les origines dans la liste
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      callback(null, true); // Pour l'instant, on autorise tout en production
      // En production stricte, décommenter la ligne suivante :
      // callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Servir les fichiers statiques (images uploadées)
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
const restaurantRoutes = require('./routes/restaurants');
const menuRoutes = require('./routes/menu');
const commandeRoutes = require('./routes/commandes');
const authRoutes = require('./routes/auth');
const clientRoutes = require('./routes/clients');
const adminRoutes = require('./routes/admin');
const livreurRoutes = require('./routes/livreur');
const paiementRoutes = require('./routes/paiement');
const avisRoutes = require('./routes/avis');
const quartiersRoutes = require('./routes/quartiers');

app.use('/api/restaurants', restaurantRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/commandes', commandeRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/livreur', livreurRoutes);
app.use('/api/paiement', paiementRoutes);
app.use('/api/avis', avisRoutes);
app.use('/api/quartiers', quartiersRoutes);

// Route de test
app.get('/api', (req, res) => {
  res.json({ message: 'API Livraison Service Fastfood - Backend fonctionnel' });
});

// Gestion des connexions Socket.io
io.on('connection', (socket) => {
  console.log('Client connecté:', socket.id);

  // Gérer la connexion d'un utilisateur avec son ID et rôle
  socket.on('user-connected', (data) => {
    const { userId, role } = data;
    socket.userId = userId;
    socket.role = role;
    
    // Rejoindre les rooms selon le rôle
    if (role === 'admin') {
      socket.join('admin');
    } else if (role === 'livreur') {
      socket.join('livreur');
      socket.join(`livreur-${userId}`);
    } else if (role === 'client') {
      socket.join(`client-${userId}`);
    }
    
    console.log(`Utilisateur ${userId} (${role}) connecté`);
  });

  socket.on('disconnect', () => {
    console.log('Client déconnecté:', socket.id);
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
  console.log(`Socket.io activé`);
});

