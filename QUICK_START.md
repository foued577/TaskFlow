# 🚀 Démarrage Rapide - TaskFlow

Guide pour démarrer l'application en 5 minutes !

## Étape 1 : Prérequis ✅

Assurez-vous d'avoir installé :
- ✅ Node.js (v16+) : [nodejs.org](https://nodejs.org)
- ✅ MongoDB (v5+) : [mongodb.com](https://www.mongodb.com/try/download/community)

## Étape 2 : Configuration Backend ⚙️

```bash
# 1. Ouvrir un terminal et aller dans le dossier backend
cd backend

# 2. Installer les dépendances
npm install

# 3. Créer le fichier .env
# Créez un fichier .env dans le dossier backend avec ce contenu :
```

**Contenu du fichier `backend/.env` :**
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/task_management
JWT_SECRET=ma_super_cle_secrete_a_changer_en_production_12345
JWT_EXPIRE=7d
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

```bash
# 4. Démarrer MongoDB
# Windows PowerShell (en tant qu'administrateur) :
net start MongoDB

# macOS/Linux :
sudo systemctl start mongod

# 5. Lancer le serveur backend
npm run dev
```

✅ **Le backend devrait maintenant tourner sur http://localhost:5000**

## Étape 3 : Configuration Frontend 🎨

```bash
# 1. Ouvrir un NOUVEAU terminal et aller dans le dossier frontend
cd frontend

# 2. Installer les dépendances
npm install

# 3. Lancer l'application React
npm start
```

✅ **L'application devrait s'ouvrir automatiquement sur http://localhost:3000**

## Étape 4 : Premier Compte 👤

1. Cliquez sur **"Créer un compte"**
2. Remplissez le formulaire :
   - Prénom : John
   - Nom : Doe
   - Email : john@example.com
   - Mot de passe : password123
3. Cliquez sur **"Créer un compte"**
4. Vous êtes automatiquement connecté !

## Étape 5 : Découvrir l'Application 🎯

### 1. Créer votre première équipe
- Allez dans **"Équipes"**
- Cliquez sur **"Nouvelle équipe"**
- Nom : "Mon équipe"
- Choisissez une couleur
- Cliquez sur **"Créer"**

### 2. Créer votre premier projet
- Allez dans **"Projets"**
- Cliquez sur **"Nouveau projet"**
- Nom : "Site Web"
- Sélectionnez votre équipe
- Choisissez une priorité et une couleur
- Cliquez sur **"Créer"**

### 3. Créer votre première tâche
- Allez dans **"Tâches"**
- Cliquez sur **"Nouvelle tâche"**
- Titre : "Design de la page d'accueil"
- Sélectionnez votre projet
- Définissez une priorité et une date d'échéance
- Cliquez sur **"Créer"**

### 4. Utiliser le Kanban
- Allez dans **"Kanban"**
- Glissez-déposez votre tâche entre les colonnes
- Cliquez sur une tâche pour voir les détails

### 5. Voir le Planning
- Allez dans **"Planning"**
- Visualisez vos tâches dans le calendrier
- Cliquez sur une date pour voir les tâches du jour

## 🎉 C'est Parti !

Vous êtes prêt à utiliser TaskFlow ! Explorez toutes les fonctionnalités :
- 📊 Tableau de bord avec statistiques
- 👥 Gestion d'équipes collaboratives
- 📁 Organisation par projets
- ✅ Suivi des tâches et sous-tâches
- 🎨 Tableau Kanban interactif
- 📅 Calendrier pour la planification
- 🔔 Notifications en temps réel
- 💬 Commentaires et pièces jointes
- 📜 Historique des actions

## 🆘 Problèmes ?

### Le backend ne démarre pas
```bash
# Vérifier que MongoDB est démarré
# Windows :
sc query MongoDB

# macOS/Linux :
sudo systemctl status mongod
```

### Erreur de connexion
- Vérifiez que le backend tourne sur le port 5000
- Vérifiez le fichier `.env` dans le dossier backend
- Ouvrez http://localhost:5000/api/health dans votre navigateur

### L'interface ne charge pas
- Vérifiez que vous êtes dans le bon dossier `frontend`
- Supprimez `node_modules` et réinstallez :
```bash
rm -rf node_modules
npm install
npm start
```

## 📚 Documentation Complète

Pour plus de détails, consultez :
- **INSTALLATION.md** - Guide d'installation détaillé
- **FEATURES.md** - Liste complète des fonctionnalités
- **README.md** - Vue d'ensemble du projet

## 🎓 Tutoriel Vidéo (Concept)

1. **Inscription et connexion** (0:00 - 1:00)
2. **Créer une équipe** (1:00 - 2:00)
3. **Créer un projet** (2:00 - 3:00)
4. **Gérer les tâches** (3:00 - 5:00)
5. **Utiliser le Kanban** (5:00 - 7:00)
6. **Planning et calendrier** (7:00 - 9:00)
7. **Notifications et collaboration** (9:00 - 10:00)

Bon travail avec TaskFlow ! 🚀
