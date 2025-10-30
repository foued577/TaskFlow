# 🚀 Démarrage Rapide - Corrections Appliquées

## ⚠️ Problèmes Détectés et Solutions

### 1. ❌ Fichier `.env` manquant dans le backend

**Solution automatique** : Lancez le script de configuration

```bash
cd C:\Users\Foued\Downloads\planner\backend

# Option 1 : Script Windows (recommandé)
setup.bat

# Option 2 : Script Node.js
node create-env.js
```

### 2. ⚠️ 9 Vulnérabilités dans le frontend

**Solution** :
```bash
cd C:\Users\Foued\Downloads\planner\frontend
npm audit fix
```

## 🎯 Ordre de Démarrage Correct

### Étape 1 : Créer le fichier .env (IMPORTANT)
```bash
cd C:\Users\Foued\Downloads\planner\backend
setup.bat
```

### Étape 2 : Démarrer MongoDB
```bash
# PowerShell en tant qu'administrateur
net start MongoDB
```

Si MongoDB n'est pas installé :
- Téléchargez : https://www.mongodb.com/try/download/community
- Installez avec l'option "Install MongoDB as a Service"

### Étape 3 : Démarrer le Backend
```bash
cd C:\Users\Foued\Downloads\planner\backend
npm start
```

✅ Vous devriez voir :
```
🚀 Server running on port 5000
📊 Environment: development
✅ MongoDB Connected
```

### Étape 4 : Démarrer le Frontend (nouveau terminal)
```bash
cd C:\Users\Foued\Downloads\planner\frontend
npm start
```

✅ L'application s'ouvrira sur **http://localhost:3000**

## 🐛 Dépannage

### Erreur "MongoDB Connection Error"
1. Vérifiez que MongoDB est démarré : `sc query MongoDB`
2. Si non installé, installez MongoDB Community Edition
3. Vérifiez le fichier `.env` existe dans `backend/`

### Erreur "Port 5000 already in use"
```bash
# Trouver le processus
netstat -ano | findstr :5000

# Tuer le processus
taskkill /PID <PID> /F
```

### Le fichier .env n'est pas créé
Créez-le manuellement dans `backend/.env` :
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/task_management
JWT_SECRET=task_flow_super_secret_key_2024_change_this_in_production
JWT_EXPIRE=7d
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

## ✅ Checklist de Démarrage

- [ ] Backend : npm install ✅
- [ ] Frontend : npm install ✅
- [ ] Fichier .env créé ⏳ **← À FAIRE**
- [ ] MongoDB démarré ⏳
- [ ] Backend lancé (port 5000) ⏳
- [ ] Frontend lancé (port 3000) ⏳
- [ ] Application accessible ⏳

## 🎉 Une fois tout démarré

1. Ouvrez http://localhost:3000
2. Cliquez sur "Créer un compte"
3. Remplissez le formulaire
4. Commencez à utiliser TaskFlow !

## 📞 Commandes Utiles

```bash
# Voir les logs MongoDB
mongosh
use task_management
db.users.find()

# Arrêter proprement
# Backend : Ctrl+C
# Frontend : Ctrl+C
# MongoDB : net stop MongoDB
```

---

**🔥 COMMENCEZ PAR : `cd backend` puis `setup.bat`**
