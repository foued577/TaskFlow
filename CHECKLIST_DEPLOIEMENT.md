# ✅ Checklist de Déploiement - TaskFlow

## 📋 Avant de Commencer

- [ ] Application fonctionne en local
- [ ] Backend + Frontend + MongoDB testés
- [ ] Compte GitHub créé
- [ ] Git installé sur votre machine

---

## 🔧 Étape 1 : Préparation (30 min)

### 1.1 Repository GitHub

- [ ] Créer un repository sur GitHub : `taskflow-app`
- [ ] Initialiser Git localement
  ```bash
  cd C:\Users\Foued\Downloads\planner
  git init
  git add .
  git commit -m "Initial commit"
  git branch -M main
  git remote add origin https://github.com/VOTRE_USERNAME/taskflow-app.git
  git push -u origin main
  ```

### 1.2 Fichiers de Configuration

- [ ] Vérifier que `.gitignore` exclut :
  - `node_modules/`
  - `.env`
  - `uploads/`
  - `build/`

- [ ] Créer `backend/.env.example` avec template
- [ ] Créer `frontend/.env.production` avec template

### 1.3 Sécurité

- [ ] Générer un nouveau JWT_SECRET (32+ caractères)
  ```bash
  # Dans Node.js ou terminal
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```

---

## 🚀 Étape 2 : Déploiement (1h)

### Option A : Render.com (Recommandé)

#### 2.1 Base de Données MongoDB

- [ ] Créer compte sur https://render.com
- [ ] New → MongoDB
- [ ] Nom : `taskflow-mongodb`
- [ ] Plan : Free
- [ ] Copier la Connection String

#### 2.2 Backend

- [ ] New → Web Service
- [ ] Connecter GitHub repository
- [ ] Configuration :
  - Root Directory : `backend`
  - Build Command : `npm install`
  - Start Command : `npm start`
- [ ] Variables d'environnement :
  ```
  PORT=5000
  MONGODB_URI=<coller_connection_string>
  JWT_SECRET=<generer_cle_secrete>
  JWT_EXPIRE=7d
  NODE_ENV=production
  FRONTEND_URL=https://taskflow-frontend.onrender.com
  ```
- [ ] Deploy
- [ ] Copier l'URL du backend

#### 2.3 Frontend

- [ ] New → Static Site
- [ ] Configuration :
  - Root Directory : `frontend`
  - Build Command : `npm install && npm run build`
  - Publish Directory : `build`
- [ ] Variable d'environnement :
  ```
  REACT_APP_API_URL=https://taskflow-backend.onrender.com/api
  ```
- [ ] Deploy

#### 2.4 Finalisation

- [ ] Retourner dans Backend Settings
- [ ] Mettre à jour `FRONTEND_URL` avec l'URL réelle du frontend
- [ ] Sauvegarder (redémarrage automatique)

---

### Option B : Vercel + Railway + MongoDB Atlas

#### 2.1 MongoDB Atlas

- [ ] Créer compte sur https://mongodb.com/cloud/atlas
- [ ] Créer cluster M0 (gratuit)
- [ ] Database Access → Add User
- [ ] Network Access → Allow 0.0.0.0/0
- [ ] Connect → Get Connection String

#### 2.2 Railway (Backend)

- [ ] Créer compte sur https://railway.app
- [ ] New Project → Deploy from GitHub
- [ ] Sélectionner `taskflow-app`
- [ ] Root Directory : `/backend`
- [ ] Variables :
  ```
  PORT=5000
  MONGODB_URI=<atlas_connection_string>
  JWT_SECRET=<votre_cle>
  JWT_EXPIRE=7d
  NODE_ENV=production
  FRONTEND_URL=https://taskflow.vercel.app
  ```
- [ ] Generate Domain
- [ ] Copier l'URL

#### 2.3 Vercel (Frontend)

- [ ] Créer compte sur https://vercel.com
- [ ] Import Project
- [ ] Configuration :
  - Root Directory : `frontend`
  - Framework : Create React App
- [ ] Environment Variable :
  ```
  REACT_APP_API_URL=https://taskflow-backend.up.railway.app/api
  ```
- [ ] Deploy

---

## ✅ Étape 3 : Vérification (15 min)

### 3.1 Backend Fonctionnel

- [ ] Ouvrir : `https://votre-backend.com/api/health`
- [ ] Devrait afficher : `{"status":"OK","database":"connected"}`

### 3.2 Frontend Fonctionnel

- [ ] Ouvrir : `https://votre-frontend.com`
- [ ] Page de connexion s'affiche correctement
- [ ] Pas d'erreurs dans la console (F12)

### 3.3 Tests Fonctionnels

- [ ] Créer un compte
- [ ] Se connecter
- [ ] Créer une équipe
- [ ] Créer un projet
- [ ] Créer une tâche
- [ ] Vérifier les notifications
- [ ] Tester le Kanban
- [ ] Tester le calendrier
- [ ] Tester l'export Excel

### 3.4 Tests de Sécurité

- [ ] HTTPS activé (cadenas dans la barre d'adresse)
- [ ] CORS configuré correctement
- [ ] Token JWT fonctionne
- [ ] Déconnexion après expiration du token

---

## 🌍 Étape 4 : Domaine Personnalisé (Optionnel)

- [ ] Acheter un domaine (Namecheap, Google Domains, etc.)
- [ ] Configurer DNS :
  - Type : CNAME
  - Name : @ ou taskflow
  - Value : URL de votre hébergeur
- [ ] Attendre propagation DNS (5min-48h)
- [ ] Vérifier HTTPS activé automatiquement

---

## 📊 Étape 5 : Monitoring (15 min)

### 5.1 Uptime Monitoring

- [ ] Créer compte sur https://uptimerobot.com (gratuit)
- [ ] Ajouter monitor pour votre backend
- [ ] Ajouter monitor pour votre frontend
- [ ] Configurer alertes email

### 5.2 Logs et Erreurs

- [ ] Backend : Vérifier les logs dans dashboard
- [ ] Frontend : Configurer Sentry (optionnel)

### 5.3 Backups

- [ ] Vérifier backups automatiques MongoDB
- [ ] Tester une restauration

---

## 🔒 Étape 6 : Sécurité Production

- [ ] JWT_SECRET est complexe et unique
- [ ] MongoDB accessible uniquement depuis backend
- [ ] CORS limité au domaine frontend
- [ ] Rate limiting activé
- [ ] Variables sensibles dans .env (pas dans code)
- [ ] .env dans .gitignore
- [ ] HTTPS activé partout

---

## 📝 Étape 7 : Documentation

- [ ] Noter les URLs :
  - Frontend : ________________
  - Backend : ________________
  - MongoDB : ________________

- [ ] Sauvegarder les credentials :
  - Plateforme d'hébergement
  - MongoDB
  - Domaine (si acheté)

- [ ] Documenter les variables d'environnement

---

## 🎉 Félicitations !

Si toutes les cases sont cochées, votre application est **officiellement en ligne** ! 🚀

### Prochaines Étapes

1. **Partager** l'URL avec vos utilisateurs
2. **Surveiller** les logs régulièrement
3. **Mettre à jour** l'application :
   ```bash
   git add .
   git commit -m "Update: description"
   git push origin main
   ```
4. **Backup** hebdomadaire de la base de données
5. **Monitoring** des performances

---

## 🆘 En Cas de Problème

### L'application ne s'affiche pas

1. Vérifier les logs du backend
2. Tester `/api/health`
3. Vérifier les variables d'environnement
4. Console navigateur (F12)

### Erreur de connexion MongoDB

1. Vérifier la connection string
2. Vérifier IP Whitelist
3. Tester depuis MongoDB Compass

### CORS Error

1. Vérifier `FRONTEND_URL` dans backend
2. Vérifier `REACT_APP_API_URL` dans frontend
3. Vérifier configuration CORS dans `server.js`

---

## 📞 Support

- **Render** : https://render.com/docs
- **Vercel** : https://vercel.com/docs
- **Railway** : https://docs.railway.app
- **MongoDB Atlas** : https://docs.atlas.mongodb.com

---

**Temps estimé total** : 2-3 heures (première fois)  
**Difficulté** : Intermédiaire  
**Coût** : 0€ (version gratuite) ou 20-30€/mois (version pro)
