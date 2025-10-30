# Guide d'Installation - TaskFlow

## Prérequis

- Node.js (v16 ou supérieur)
- MongoDB (v5.0 ou supérieur)
- npm ou yarn

## Installation Backend

1. **Accéder au dossier backend**
   ```bash
   cd backend
   ```

2. **Installer les dépendances**
   ```bash
   npm install
   ```

3. **Configurer les variables d'environnement**
   
   Créez un fichier `.env` à la racine du dossier backend avec le contenu suivant :
   ```env
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/task_management
   JWT_SECRET=votre_cle_secrete_jwt_changez_ceci_en_production
   JWT_EXPIRE=7d
   NODE_ENV=development
   FRONTEND_URL=http://localhost:3000
   ```

   **⚠️ Important**: Changez `JWT_SECRET` par une clé secrète forte en production !

4. **Démarrer MongoDB**
   
   Assurez-vous que MongoDB est en cours d'exécution sur votre machine :
   ```bash
   # Windows
   net start MongoDB
   
   # macOS/Linux
   sudo systemctl start mongod
   # ou
   mongod
   ```

5. **Lancer le serveur**
   ```bash
   # Mode développement (avec nodemon)
   npm run dev
   
   # Mode production
   npm start
   ```

   Le serveur démarrera sur `http://localhost:5000`

## Installation Frontend

1. **Accéder au dossier frontend**
   ```bash
   cd frontend
   ```

2. **Installer les dépendances**
   ```bash
   npm install
   ```

3. **Configurer l'API (optionnel)**
   
   Si votre backend n'est pas sur `http://localhost:5000`, créez un fichier `.env` :
   ```env
   REACT_APP_API_URL=http://localhost:5000/api
   ```

4. **Lancer l'application**
   ```bash
   npm start
   ```

   L'application s'ouvrira automatiquement sur `http://localhost:3000`

## Vérification de l'installation

1. **Vérifier le backend**
   - Ouvrez `http://localhost:5000/api/health`
   - Vous devriez voir : `{"status":"OK","timestamp":"..."}`

2. **Vérifier le frontend**
   - Ouvrez `http://localhost:3000`
   - Vous devriez voir la page de connexion

3. **Créer un compte**
   - Cliquez sur "Créer un compte"
   - Remplissez le formulaire
   - Connectez-vous avec vos identifiants

## Problèmes courants

### Le backend ne démarre pas

- **Erreur MongoDB** : Vérifiez que MongoDB est bien démarré
  ```bash
  # Vérifier le statut
  sudo systemctl status mongod
  ```

- **Port déjà utilisé** : Changez le port dans `.env` (backend)

### Le frontend ne se connecte pas au backend

- Vérifiez que le backend est bien démarré
- Vérifiez l'URL de l'API dans le fichier `frontend/src/utils/api.js`
- Vérifiez la configuration CORS dans `backend/server.js`

### Erreur d'authentification

- Vérifiez que `JWT_SECRET` est bien défini dans le `.env`
- Supprimez le token dans localStorage et reconnectez-vous

## Base de données

### Réinitialiser la base de données

```bash
# Se connecter à MongoDB
mongosh

# Supprimer la base de données
use task_management
db.dropDatabase()
```

### Voir les données

```bash
mongosh
use task_management
db.users.find().pretty()
db.tasks.find().pretty()
```

## Build pour la production

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

Les fichiers de production seront dans `frontend/build/`

## Variables d'environnement complètes

### Backend (.env)
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/task_management
JWT_SECRET=une_cle_secrete_tres_longue_et_complexe
JWT_EXPIRE=7d
NODE_ENV=production
FRONTEND_URL=https://votre-domaine.com
```

### Frontend (.env)
```env
REACT_APP_API_URL=https://api.votre-domaine.com/api
```

## Support

Pour toute question ou problème :
1. Vérifiez les logs du backend
2. Vérifiez la console du navigateur (F12)
3. Consultez la documentation MongoDB et React

## Licence

MIT
