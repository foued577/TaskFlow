# Task Management Application

Application web collaborative de gestion des tâches avec équipes, projets, et tableau Kanban.

## 🚀 Technologies

### Frontend
- React.js 18
- TailwindCSS
- Lucide React (icons)
- Axios
- React Router
- React DnD (Drag & Drop)

### Backend
- Node.js
- Express.js
- MongoDB & Mongoose
- JWT (authentification)
- Bcrypt (sécurité)
- Multer (upload fichiers)

## 📦 Installation

### Backend
```bash
cd backend
npm install

# Créer le fichier .env automatiquement
setup.bat
# OU
node create-env.js

# Démarrer MongoDB (Windows, en tant qu'administrateur)
net start MongoDB

# Lancer le serveur
npm start
```

### Frontend
```bash
cd frontend
npm install

# Corriger les vulnérabilités (optionnel)
npm audit fix

# Lancer l'application
npm start
```

## 🚀 Démarrage Rapide

Consultez [QUICK_START.md](QUICK_START.md) pour un guide de démarrage en 5 minutes.

## 🌐 Déploiement en Production

**Hébergez votre application** :
- **Guide express** (45 min) : [DEPLOIEMENT_RAPIDE.md](DEPLOIEMENT_RAPIDE.md)
- **Guide complet** : [GUIDE_DEPLOIEMENT.md](GUIDE_DEPLOIEMENT.md)
- **Checklist** : [CHECKLIST_DEPLOIEMENT.md](CHECKLIST_DEPLOIEMENT.md)

**Plateformes recommandées** :
- ⭐ **Render.com** (Backend + Frontend + BDD) - Gratuit
- **Vercel** (Frontend) + **Railway** (Backend) - Gratuit
- **Heroku** - Payant (7$/mois)

⚠️ **IMPORTANT** : Le fichier `.env` doit être créé dans le dossier `backend/` avant de démarrer le serveur. Utilisez le script `setup.bat` pour le créer automatiquement.

## 🎯 Fonctionnalités

- ✅ Authentification sécurisée (JWT + bcrypt)
- ✅ Gestion d'équipes et projets
- ✅ Création de tâches et sous-tâches
- ✅ Assignation, priorités, estimations
- ✅ Tableau Kanban interactif
- ✅ Planning quotidien
- ✅ Notifications en temps réel
- ✅ Commentaires et fichiers attachés
- ✅ Historique des actions
- ✅ Interface responsive et moderne

## 🔒 Sécurité

- Mots de passe hashés avec bcrypt
- Tokens JWT avec expiration
- Validation des données
- Protection CORS
- Rate limiting

## 📱 Interface

Interface moderne avec TailwindCSS, responsive pour tous les appareils.
