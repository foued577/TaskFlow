# 🚀 Guide de Déploiement - TaskFlow

## 📋 Table des Matières

1. [Options d'Hébergement](#options-dhébergement)
2. [Préparation de l'Application](#préparation-de-lapplication)
3. [Déploiement sur Render (Recommandé)](#déploiement-sur-render)
4. [Déploiement sur Vercel + Railway](#déploiement-sur-vercel--railway)
5. [Déploiement sur Heroku](#déploiement-sur-heroku)
6. [Configuration du Domaine](#configuration-du-domaine)
7. [Maintenance et Monitoring](#maintenance)

---

## 🌐 Options d'Hébergement

### Option 1 : Render.com (⭐ RECOMMANDÉ)

**Avantages** :
- ✅ Plan gratuit généreux
- ✅ Backend + Base de données inclus
- ✅ Déploiement automatique depuis GitHub
- ✅ SSL gratuit
- ✅ Très simple à configurer

**Prix** :
- Gratuit : Backend + MongoDB (limité)
- Payant : 7$/mois par service

**Idéal pour** : Déploiement complet (backend + frontend + BDD)

---

### Option 2 : Vercel (Frontend) + Railway (Backend + BDD)

**Avantages** :
- ✅ Vercel excellent pour React
- ✅ Railway simple pour backend
- ✅ Performance optimale
- ✅ Plans gratuits disponibles

**Prix** :
- Vercel : Gratuit (limites généreuses)
- Railway : 5$/mois (500h gratuit au départ)

**Idéal pour** : Performance maximale

---

### Option 3 : Heroku

**Avantages** :
- ✅ Très populaire
- ✅ Documentation complète
- ✅ Addons nombreux

**Prix** :
- À partir de 7$/mois (plus de plan gratuit depuis nov 2022)

---

### Option 4 : VPS (DigitalOcean, AWS, etc.)

**Avantages** :
- ✅ Contrôle total
- ✅ Performance élevée
- ✅ Scalabilité

**Prix** :
- À partir de 5$/mois

**Idéal pour** : Production professionnelle

---

## 🔧 Préparation de l'Application

### Étape 1 : Créer un Compte GitHub

Si pas déjà fait :
1. Allez sur https://github.com
2. Créez un compte gratuit
3. Installez Git : https://git-scm.com/downloads

### Étape 2 : Initialiser le Repository Git

```bash
cd C:\Users\Foued\Downloads\planner

# Initialiser Git
git init

# Créer .gitignore si pas déjà fait
echo node_modules/ >> .gitignore
echo .env >> .gitignore
echo uploads/ >> .gitignore
echo build/ >> .gitignore
echo dist/ >> .gitignore

# Premier commit
git add .
git commit -m "Initial commit: TaskFlow application"
```

### Étape 3 : Créer le Repository sur GitHub

1. Allez sur https://github.com/new
2. Nom du repository : `taskflow-app`
3. Description : "Application de gestion des tâches collaborative"
4. Public ou Private (votre choix)
5. Créez le repository

```bash
# Lier au repository GitHub
git remote add origin https://github.com/VOTRE_USERNAME/taskflow-app.git
git branch -M main
git push -u origin main
```

### Étape 4 : Préparer les Fichiers de Configuration

#### Backend - Créer `backend/.env.example`

```env
# Copiez votre .env et remplacez les valeurs sensibles
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_very_long_and_secure_jwt_secret_key_here
JWT_EXPIRE=7d
NODE_ENV=production
FRONTEND_URL=https://your-frontend-url.com
```

#### Frontend - Créer `frontend/.env.production`

```env
REACT_APP_API_URL=https://your-backend-url.com/api
```

---

## 🚀 Déploiement sur Render (RECOMMANDÉ)

### Étape 1 : Créer un Compte Render

1. Allez sur https://render.com
2. Inscrivez-vous avec GitHub
3. Autorisez l'accès à vos repositories

### Étape 2 : Déployer la Base de Données MongoDB

1. Dans Render Dashboard, cliquez **"New +"**
2. Sélectionnez **"MongoDB"**
3. Configuration :
   - **Name** : `taskflow-mongodb`
   - **Database User** : `taskflow_admin`
   - **Database Name** : `task_management`
   - **Plan** : Free (ou Starter 7$/mois)
4. Cliquez **"Create Database"**
5. **Copiez la Connection String** (Internal ou External)

### Étape 3 : Déployer le Backend

1. Cliquez **"New +"** → **"Web Service"**
2. Connectez votre repository GitHub `taskflow-app`
3. Configuration :
   - **Name** : `taskflow-backend`
   - **Region** : Choisissez le plus proche
   - **Branch** : `main`
   - **Root Directory** : `backend`
   - **Runtime** : `Node`
   - **Build Command** : `npm install`
   - **Start Command** : `npm start`
   - **Plan** : Free (ou Starter 7$/mois)

4. **Variables d'Environnement** (Section "Environment") :
   ```
   PORT=5000
   MONGODB_URI=mongodb+srv://... (copiée à l'étape 2)
   JWT_SECRET=votre_cle_secrete_tres_longue_et_complexe_123456789
   JWT_EXPIRE=7d
   NODE_ENV=production
   FRONTEND_URL=https://taskflow-frontend.onrender.com
   ```

5. Cliquez **"Create Web Service"**
6. **Copiez l'URL du backend** : `https://taskflow-backend.onrender.com`

### Étape 4 : Déployer le Frontend

1. Cliquez **"New +"** → **"Static Site"**
2. Sélectionnez votre repository
3. Configuration :
   - **Name** : `taskflow-frontend`
   - **Branch** : `main`
   - **Root Directory** : `frontend`
   - **Build Command** : `npm install && npm run build`
   - **Publish Directory** : `build`

4. **Variables d'Environnement** :
   ```
   REACT_APP_API_URL=https://taskflow-backend.onrender.com/api
   ```

5. Cliquez **"Create Static Site"**

### Étape 5 : Mettre à Jour FRONTEND_URL dans le Backend

1. Retournez dans les settings du backend
2. Mettez à jour `FRONTEND_URL` avec l'URL du frontend
3. Sauvegardez (le backend redémarrera automatiquement)

### Étape 6 : Tester l'Application

1. Ouvrez l'URL du frontend : `https://taskflow-frontend.onrender.com`
2. Créez un compte
3. Testez les fonctionnalités

**✅ Votre application est en ligne ! 🎉**

---

## 🌐 Déploiement sur Vercel + Railway

### Option Alternative : Frontend sur Vercel, Backend sur Railway

#### Partie 1 : MongoDB sur MongoDB Atlas (Gratuit)

1. Allez sur https://www.mongodb.com/cloud/atlas/register
2. Créez un compte gratuit
3. Créez un cluster (M0 Free)
4. Database Access → Add New User
5. Network Access → Allow Access from Anywhere (0.0.0.0/0)
6. Clusters → Connect → Connect Your Application
7. Copiez la connection string

#### Partie 2 : Backend sur Railway

1. Allez sur https://railway.app
2. Connectez-vous avec GitHub
3. **New Project** → **Deploy from GitHub**
4. Sélectionnez `taskflow-app`
5. Configuration :
   - **Root Directory** : `/backend`
   - **Start Command** : `npm start`

6. **Variables** :
   ```
   PORT=5000
   MONGODB_URI=mongodb+srv://... (de Atlas)
   JWT_SECRET=votre_cle_secrete
   JWT_EXPIRE=7d
   NODE_ENV=production
   FRONTEND_URL=https://taskflow.vercel.app
   ```

7. **Generate Domain** pour obtenir l'URL

#### Partie 3 : Frontend sur Vercel

1. Allez sur https://vercel.com
2. Connectez-vous avec GitHub
3. **Import Project** → Sélectionnez `taskflow-app`
4. Configuration :
   - **Root Directory** : `frontend`
   - **Framework Preset** : Create React App
   - **Build Command** : `npm run build`
   - **Output Directory** : `build`

5. **Environment Variables** :
   ```
   REACT_APP_API_URL=https://taskflow-backend.up.railway.app/api
   ```

6. **Deploy**

---

## 🏠 Déploiement sur Heroku

### Prérequis

```bash
# Installer Heroku CLI
# Windows : https://devcenter.heroku.com/articles/heroku-cli
```

### Étape 1 : Créer les Applications

```bash
# Login
heroku login

# Créer app backend
heroku create taskflow-backend-api

# Créer app frontend
heroku create taskflow-frontend-app
```

### Étape 2 : MongoDB Atlas

Utilisez MongoDB Atlas (gratuit) comme expliqué ci-dessus

### Étape 3 : Déployer le Backend

```bash
cd backend

# Créer Procfile
echo "web: npm start" > Procfile

# Configurer les variables
heroku config:set -a taskflow-backend-api \
  MONGODB_URI="mongodb+srv://..." \
  JWT_SECRET="votre_cle" \
  JWT_EXPIRE="7d" \
  NODE_ENV="production" \
  FRONTEND_URL="https://taskflow-frontend-app.herokuapp.com"

# Déployer
git subtree push --prefix backend heroku main
```

### Étape 4 : Déployer le Frontend

```bash
cd frontend

# Créer buildpack pour React
heroku buildpacks:set -a taskflow-frontend-app https://github.com/mars/create-react-app-buildpack

# Variables
heroku config:set -a taskflow-frontend-app \
  REACT_APP_API_URL="https://taskflow-backend-api.herokuapp.com/api"

# Déployer
git subtree push --prefix frontend heroku main
```

---

## 🌍 Configuration du Domaine Personnalisé

### Acheter un Domaine

Plateformes recommandées :
- Namecheap : ~10$/an
- Google Domains : ~12$/an
- OVH : ~8€/an

### Configurer le DNS (Exemple avec Render)

1. Dans Render Dashboard → Settings
2. **Custom Domain** → Add
3. Entrez : `taskflow.votredomaine.com`
4. Render vous donne des enregistrements DNS
5. Dans votre registrar de domaine :
   - Type: `CNAME`
   - Name: `taskflow` (ou `@` pour root)
   - Value: `taskflow-frontend.onrender.com`
6. Attendez la propagation DNS (5min-48h)

**SSL** : Render active automatiquement HTTPS gratuit (Let's Encrypt)

---

## 📊 Monitoring et Maintenance

### Logs Backend (Render)

1. Dashboard → Votre backend
2. Onglet **Logs**
3. Surveillez les erreurs

### Alertes

Configurez :
- Notifications email en cas de downtime
- Monitoring uptime (UptimeRobot gratuit)

### Backups MongoDB

**MongoDB Atlas** (gratuit) :
- Backups automatiques quotidiens
- Restore en 1 clic

**Render MongoDB** :
- Backups manuels recommandés

### Mises à Jour

```bash
# Faire des changements localement
git add .
git commit -m "Update: description des changements"
git push origin main

# Render/Vercel redéploient automatiquement !
```

---

## 🔒 Checklist de Sécurité Production

Avant de lancer en production :

- [ ] Changez `JWT_SECRET` (minimum 32 caractères aléatoires)
- [ ] MongoDB : IP Whitelist configurée
- [ ] CORS : Limité au domaine frontend uniquement
- [ ] Rate limiting activé (déjà fait)
- [ ] HTTPS activé (automatique sur Render/Vercel)
- [ ] Variables `.env` JAMAIS dans GitHub
- [ ] Backups MongoDB configurés
- [ ] Monitoring et alertes actifs

---

## 💰 Estimation des Coûts

### Option Gratuite (Débutant)

- **Render Free** : Backend + Frontend
- **MongoDB Atlas M0** : Base de données
- **Total** : 0€/mois
- **Limites** : 750h/mois, sommeil après 15min inactivité

### Option Startup (Recommandé)

- **Render Starter** : 7$/mois × 2 (back + front) = 14$/mois
- **MongoDB Atlas M10** : 57$/mois (ou M2 9$/mois)
- **Domaine** : 10$/an
- **Total** : ~25-70$/mois

### Option Business

- **VPS DigitalOcean** : 12$/mois
- **MongoDB Atlas M10** : 57$/mois
- **CDN Cloudflare** : Gratuit
- **Domaine** : 10$/an
- **Total** : ~70$/mois

---

## 🆘 Dépannage

### Erreur CORS

```javascript
// backend/server.js
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));
```

### Erreur MongoDB Connection

Vérifiez :
1. IP Whitelist (0.0.0.0/0 pour autoriser tout)
2. Connection string correcte
3. Username/password corrects

### Frontend ne se connecte pas au Backend

1. Vérifiez `REACT_APP_API_URL` dans Vercel/Render
2. Testez l'API : `https://votre-backend.com/api/health`
3. Console navigateur (F12) pour voir les erreurs

### Build Frontend échoue

```bash
# Localement
cd frontend
npm run build

# Si ça marche localement mais pas en prod :
# Vérifiez les variables d'environnement
```

---

## 🎉 Félicitations !

Votre application TaskFlow est maintenant en ligne et accessible au monde entier ! 🌍

**Prochaines étapes** :
1. Partagez l'URL avec vos utilisateurs
2. Configurez Google Analytics (optionnel)
3. Ajoutez un domaine personnalisé
4. Configurez les backups automatiques
5. Surveillez les performances

---

**Créé le** : 30 octobre 2024
**Version** : 1.0
**Support** : Consultez la documentation de votre plateforme d'hébergement
