# 🏗️ Architecture - TaskFlow

## 📐 Vue d'ensemble

```
Frontend (React) → API REST → Backend (Express) → MongoDB
```

## 🎨 Frontend

### Structure
```
src/
├── components/     # Composants réutilisables
├── pages/         # Pages de l'app
├── context/       # Context API (Auth)
├── utils/         # API calls
└── App.js         # Routing
```

### Stack
- React 18 + React Router
- TailwindCSS + Lucide Icons
- Axios + Context API
- date-fns

## ⚙️ Backend

### Structure
```
backend/
├── controllers/   # Logique métier
├── models/        # Schémas MongoDB
├── routes/        # Routes API
├── middleware/    # Auth, Upload
└── server.js      # Entry point
```

### Stack
- Node.js + Express
- MongoDB + Mongoose
- JWT + Bcrypt
- Multer + Helmet

## 🗄️ Database

### Collections
- **Users** - Utilisateurs
- **Teams** - Équipes
- **Projects** - Projets
- **Tasks** - Tâches
- **Comments** - Commentaires
- **Notifications** - Notifications
- **History** - Historique

## 🔐 Sécurité

- JWT pour l'authentification
- Bcrypt (10 rounds) pour les mots de passe
- Rate limiting (100 req/15min)
- Helmet pour les headers HTTP
- Validation des données
- CORS configuré

## 🚀 Performance

- Compression gzip
- Indexation MongoDB
- Temps de réponse < 2s
- Lazy loading
