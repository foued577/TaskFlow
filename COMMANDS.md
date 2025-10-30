# 🚀 Commandes Utiles - TaskFlow

## Installation Initiale

### Backend
```bash
cd backend
npm install
```

### Frontend
```bash
cd frontend
npm install
```

## Développement

### Démarrer MongoDB
```bash
# Windows
net start MongoDB

# macOS/Linux
sudo systemctl start mongod
```

### Démarrer le Backend (Port 5000)
```bash
cd backend
npm run dev    # Mode développement avec nodemon
# ou
npm start      # Mode production
```

### Démarrer le Frontend (Port 3000)
```bash
cd frontend
npm start
```

## Build Production

### Backend
```bash
cd backend
npm start
```

### Frontend
```bash
cd frontend
npm run build
```

## Base de Données

### Voir les données
```bash
mongosh
use task_management
db.users.find().pretty()
db.tasks.find().pretty()
```

### Réinitialiser la BDD
```bash
mongosh
use task_management
db.dropDatabase()
```

## Test

### Tester l'API
```bash
# Health check
curl http://localhost:5000/api/health

# Register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"firstName":"John","lastName":"Doe","email":"john@example.com","password":"password123"}'
```

## Scripts NPM Disponibles

### Backend (package.json)
- `npm start` - Démarrer le serveur
- `npm run dev` - Développement avec nodemon

### Frontend (package.json)
- `npm start` - Démarrer l'app React
- `npm run build` - Build pour production
- `npm test` - Lancer les tests
- `npm run eject` - Ejecter de Create React App

## Variables d'Environnement

### Backend (.env)
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/task_management
JWT_SECRET=votre_cle_secrete_jwt
JWT_EXPIRE=7d
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

### Frontend (.env - optionnel)
```env
REACT_APP_API_URL=http://localhost:5000/api
```

## Ports par Défaut
- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:5000
- **MongoDB**: mongodb://localhost:27017

## Dépannage

### Port déjà utilisé
```bash
# Trouver le processus sur le port
# Windows
netstat -ano | findstr :5000

# macOS/Linux
lsof -i :5000

# Tuer le processus
# Windows
taskkill /PID <PID> /F

# macOS/Linux
kill -9 <PID>
```

### Problème MongoDB
```bash
# Vérifier le statut
# Windows
sc query MongoDB

# macOS/Linux
sudo systemctl status mongod

# Redémarrer
# Windows
net stop MongoDB
net start MongoDB

# macOS/Linux
sudo systemctl restart mongod
```

### Nettoyer les modules
```bash
# Backend
cd backend
rm -rf node_modules package-lock.json
npm install

# Frontend
cd frontend
rm -rf node_modules package-lock.json
npm install
```

## Commandes Git

```bash
# Initialiser le repo
git init
git add .
git commit -m "Initial commit: Application de gestion des tâches complète"

# Créer une branche de développement
git checkout -b develop

# Push sur GitHub
git remote add origin <url>
git push -u origin main
```
