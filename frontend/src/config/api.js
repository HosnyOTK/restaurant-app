// Configuration de l'URL de l'API
// En développement : http://localhost:5000/api
// En production : défini par REACT_APP_API_URL dans les variables d'environnement
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export default API_URL;

