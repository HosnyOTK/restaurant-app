const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { promisify } = require('util');
const fs = require('fs');

// Chemin vers la base de données SQLite
const dbPath = path.join(__dirname, '..', 'database', 'restaurant.db');
const dbDir = path.dirname(dbPath);

// Créer le dossier database s'il n'existe pas
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
  console.log('Dossier database créé:', dbDir);
}

// Créer la connexion à la base de données avec gestion d'erreur améliorée
const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
  if (err) {
    console.error('❌ Erreur de connexion à la base de données:', err);
    console.error('Chemin:', dbPath);
    process.exit(1);
  }
  console.log('✅ Connecté à la base de données SQLite:', dbPath);
  
  // Activer les clés étrangères et autres optimisations
  db.serialize(() => {
    db.run('PRAGMA foreign_keys = ON', (err) => {
      if (err) console.error('Erreur activation foreign keys:', err);
    });
    db.run('PRAGMA journal_mode = WAL', (err) => {
      if (err) console.error('Erreur activation WAL mode:', err);
    });
    db.run('PRAGMA synchronous = NORMAL', (err) => {
      if (err) console.error('Erreur configuration synchronous:', err);
    });
  });
});

// Gestion des erreurs de la base de données
db.on('error', (err) => {
  console.error('❌ Erreur base de données:', err);
});

// Vérifier que la connexion est active
process.on('SIGINT', () => {
  db.close((err) => {
    if (err) {
      console.error('Erreur lors de la fermeture de la base de données:', err);
    } else {
      console.log('Base de données fermée proprement');
    }
    process.exit(0);
  });
});

// Wrapper pour promisify avec gestion des paramètres
function promisifyRun() {
  return function(sql, ...params) {
    return new Promise((resolve, reject) => {
      db.run(sql, params, function(err) {
        if (err) reject(err);
        else resolve({ lastID: this.lastID, changes: this.changes });
      });
    });
  };
}

function promisifyGet() {
  return function(sql, ...params) {
    return new Promise((resolve, reject) => {
      db.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  };
}

function promisifyAll() {
  return function(sql, ...params) {
    return new Promise((resolve, reject) => {
      db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  };
}

// Promisify les méthodes principales pour utiliser async/await
const dbPromisified = {
  run: promisifyRun(),
  get: promisifyGet(),
  all: promisifyAll(),
  exec: (sql) => {
    return new Promise((resolve, reject) => {
      db.exec(sql, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  },
  prepare: (sql) => {
    const stmt = db.prepare(sql);
    return {
      run: function(...params) {
        return new Promise((resolve, reject) => {
          stmt.run(params, function(err) {
            if (err) reject(err);
            else resolve({ lastID: this.lastID, changes: this.changes });
          });
        });
      },
      get: function(...params) {
        return new Promise((resolve, reject) => {
          stmt.get(params, (err, row) => {
            if (err) reject(err);
            else resolve(row);
          });
        });
      },
      all: function(...params) {
        return new Promise((resolve, reject) => {
          stmt.all(params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
          });
        });
      },
      finalize: promisify(stmt.finalize.bind(stmt))
    };
  }
};

module.exports = dbPromisified;
