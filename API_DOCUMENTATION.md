# 📡 Documentation API - TaskFlow

API REST complète pour l'application de gestion des tâches.

**Base URL**: `http://localhost:5000/api`

## 🔐 Authentification

Toutes les routes (sauf `/auth/register` et `/auth/login`) nécessitent un token JWT dans le header :
```
Authorization: Bearer <token>
```

---

## 📚 Endpoints

### Authentification

#### Inscription
```http
POST /auth/register
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "password": "password123"
}

Réponse 201:
{
  "success": true,
  "data": {
    "user": {
      "id": "...",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com",
      "avatar": null
    },
    "token": "eyJhbGciOiJIUzI1..."
  }
}
```

#### Connexion
```http
POST /auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}

Réponse 200:
{
  "success": true,
  "data": {
    "user": { ... },
    "token": "eyJhbGciOiJIUzI1..."
  }
}
```

#### Profil actuel
```http
GET /auth/me
Authorization: Bearer <token>

Réponse 200:
{
  "success": true,
  "data": {
    "id": "...",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "teams": [...],
    ...
  }
}
```

#### Mettre à jour le profil
```http
PUT /auth/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "bio": "Développeur passionné",
  "phone": "+33612345678"
}

Réponse 200:
{
  "success": true,
  "data": { ... }
}
```

---

### Équipes

#### Liste des équipes
```http
GET /teams
Authorization: Bearer <token>

Réponse 200:
{
  "success": true,
  "count": 2,
  "data": [
    {
      "_id": "...",
      "name": "Équipe Frontend",
      "description": "...",
      "color": "#3B82F6",
      "members": [...],
      "createdBy": {...},
      "createdAt": "2024-01-15T10:00:00.000Z"
    }
  ]
}
```

#### Créer une équipe
```http
POST /teams
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Équipe Backend",
  "description": "Développement API",
  "color": "#10B981",
  "memberIds": ["userId1", "userId2"]
}

Réponse 201:
{
  "success": true,
  "data": { ... }
}
```

#### Détails d'une équipe
```http
GET /teams/:id
Authorization: Bearer <token>

Réponse 200:
{
  "success": true,
  "data": {
    "_id": "...",
    "name": "...",
    "members": [
      {
        "user": {
          "_id": "...",
          "firstName": "John",
          "lastName": "Doe",
          "email": "...",
          "avatar": null
        },
        "joinedAt": "2024-01-15T10:00:00.000Z"
      }
    ],
    ...
  }
}
```

#### Modifier une équipe
```http
PUT /teams/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Nouveau nom",
  "description": "Nouvelle description",
  "color": "#EF4444"
}

Réponse 200:
{
  "success": true,
  "data": { ... }
}
```

#### Ajouter un membre
```http
POST /teams/:id/members
Authorization: Bearer <token>
Content-Type: application/json

{
  "userId": "userId123"
}

Réponse 200:
{
  "success": true,
  "data": { ... }
}
```

#### Retirer un membre
```http
DELETE /teams/:id/members/:userId
Authorization: Bearer <token>

Réponse 200:
{
  "success": true,
  "message": "Member removed successfully"
}
```

---

### Projets

#### Liste des projets
```http
GET /projects?teamId=...&status=active
Authorization: Bearer <token>

Query Parameters:
- teamId (optional): Filter par équipe
- status (optional): active, archived, completed

Réponse 200:
{
  "success": true,
  "count": 5,
  "data": [...]
}
```

#### Créer un projet
```http
POST /projects
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Site Web E-commerce",
  "description": "Développement du site",
  "teamId": "...",
  "startDate": "2024-01-15",
  "endDate": "2024-06-30",
  "priority": "high",
  "color": "#8B5CF6",
  "tags": ["frontend", "backend", "design"]
}

Réponse 201:
{
  "success": true,
  "data": { ... }
}
```

#### Modifier un projet
```http
PUT /projects/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Nouveau nom",
  "status": "completed",
  "priority": "medium"
}

Réponse 200:
{
  "success": true,
  "data": { ... }
}
```

#### Supprimer un projet
```http
DELETE /projects/:id
Authorization: Bearer <token>

Réponse 200:
{
  "success": true,
  "message": "Project deleted successfully"
}
```

---

### Tâches

#### Liste des tâches
```http
GET /tasks?projectId=...&status=in_progress&priority=high
Authorization: Bearer <token>

Query Parameters:
- projectId (optional): Filter par projet
- status (optional): not_started, in_progress, completed
- priority (optional): low, medium, high, urgent
- assignedTo (optional): Filter par utilisateur assigné
- dueDate (optional): Filter par date d'échéance

Réponse 200:
{
  "success": true,
  "count": 10,
  "data": [
    {
      "_id": "...",
      "title": "Développer la page d'accueil",
      "description": "...",
      "project": {...},
      "assignedTo": [...],
      "status": "in_progress",
      "priority": "high",
      "estimatedHours": 8,
      "startDate": "...",
      "dueDate": "...",
      "subtasks": [...],
      "completionPercentage": 50,
      "isOverdue": false,
      "createdAt": "...",
      "updatedAt": "..."
    }
  ]
}
```

#### Créer une tâche
```http
POST /tasks
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Intégrer l'API de paiement",
  "description": "Stripe ou PayPal",
  "projectId": "...",
  "assignedTo": ["userId1", "userId2"],
  "priority": "urgent",
  "status": "not_started",
  "estimatedHours": 12,
  "startDate": "2024-01-20",
  "dueDate": "2024-01-25",
  "tags": ["backend", "urgent"]
}

Réponse 201:
{
  "success": true,
  "data": { ... }
}
```

#### Détails d'une tâche
```http
GET /tasks/:id
Authorization: Bearer <token>

Réponse 200:
{
  "success": true,
  "data": {
    "_id": "...",
    "title": "...",
    "subtasks": [
      {
        "_id": "...",
        "title": "Sous-tâche 1",
        "isCompleted": false,
        "completedAt": null,
        "completedBy": null
      }
    ],
    "attachments": [
      {
        "filename": "doc-123.pdf",
        "originalName": "document.pdf",
        "mimetype": "application/pdf",
        "size": 1024000,
        "path": "...",
        "uploadedBy": {...},
        "uploadedAt": "..."
      }
    ],
    ...
  }
}
```

#### Modifier une tâche
```http
PUT /tasks/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Nouveau titre",
  "status": "completed",
  "priority": "medium",
  "assignedTo": ["userId1", "userId3"]
}

Réponse 200:
{
  "success": true,
  "data": { ... }
}
```

#### Supprimer une tâche
```http
DELETE /tasks/:id
Authorization: Bearer <token>

Réponse 200:
{
  "success": true,
  "message": "Task deleted successfully"
}
```

#### Ajouter une sous-tâche
```http
POST /tasks/:id/subtasks
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Nouvelle sous-tâche"
}

Réponse 200:
{
  "success": true,
  "data": { ... }
}
```

#### Toggle sous-tâche
```http
PUT /tasks/:id/subtasks/:subtaskId
Authorization: Bearer <token>

Réponse 200:
{
  "success": true,
  "data": { ... }
}
```

#### Ajouter une pièce jointe
```http
POST /tasks/:id/attachments
Authorization: Bearer <token>
Content-Type: multipart/form-data

Form Data:
- file: [fichier]

Réponse 200:
{
  "success": true,
  "data": { ... }
}
```

#### Tâches en retard
```http
GET /tasks/overdue
Authorization: Bearer <token>

Réponse 200:
{
  "success": true,
  "count": 3,
  "data": [...]
}
```

---

### Commentaires

#### Liste des commentaires d'une tâche
```http
GET /comments/task/:taskId
Authorization: Bearer <token>

Réponse 200:
{
  "success": true,
  "count": 5,
  "data": [
    {
      "_id": "...",
      "task": "...",
      "user": {
        "_id": "...",
        "firstName": "John",
        "lastName": "Doe",
        "avatar": null
      },
      "content": "Excellent travail !",
      "mentions": [...],
      "isEdited": false,
      "editedAt": null,
      "createdAt": "2024-01-15T14:30:00.000Z"
    }
  ]
}
```

#### Créer un commentaire
```http
POST /comments
Authorization: Bearer <token>
Content-Type: application/json

{
  "taskId": "...",
  "content": "Super travail ! @userId123",
  "mentions": ["userId123"]
}

Réponse 201:
{
  "success": true,
  "data": { ... }
}
```

#### Modifier un commentaire
```http
PUT /comments/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "content": "Contenu modifié"
}

Réponse 200:
{
  "success": true,
  "data": { ... }
}
```

#### Supprimer un commentaire
```http
DELETE /comments/:id
Authorization: Bearer <token>

Réponse 200:
{
  "success": true,
  "message": "Comment deleted successfully"
}
```

---

### Notifications

#### Liste des notifications
```http
GET /notifications?isRead=false&limit=20
Authorization: Bearer <token>

Query Parameters:
- isRead (optional): true/false
- limit (optional): nombre de notifications (default: 50)

Réponse 200:
{
  "success": true,
  "count": 10,
  "unreadCount": 5,
  "data": [
    {
      "_id": "...",
      "recipient": "...",
      "sender": {...},
      "type": "task_assigned",
      "title": "Nouvelle tâche assignée",
      "message": "John vous a assigné à la tâche 'Développer API'",
      "relatedTask": {...},
      "relatedProject": {...},
      "relatedTeam": null,
      "isRead": false,
      "readAt": null,
      "createdAt": "2024-01-15T10:00:00.000Z"
    }
  ]
}
```

#### Marquer comme lu
```http
PUT /notifications/:id/read
Authorization: Bearer <token>

Réponse 200:
{
  "success": true,
  "data": { ... }
}
```

#### Tout marquer comme lu
```http
PUT /notifications/read-all
Authorization: Bearer <token>

Réponse 200:
{
  "success": true,
  "message": "All notifications marked as read"
}
```

#### Supprimer une notification
```http
DELETE /notifications/:id
Authorization: Bearer <token>

Réponse 200:
{
  "success": true,
  "message": "Notification deleted successfully"
}
```

---

### Historique

#### Historique d'un projet
```http
GET /history/project/:projectId?limit=100
Authorization: Bearer <token>

Réponse 200:
{
  "success": true,
  "count": 50,
  "data": [
    {
      "_id": "...",
      "user": {...},
      "action": "created",
      "entityType": "task",
      "entityId": "...",
      "entityName": "Développer API",
      "details": {...},
      "project": {...},
      "createdAt": "2024-01-15T10:00:00.000Z"
    }
  ]
}
```

#### Historique de l'utilisateur
```http
GET /history/user?limit=50
Authorization: Bearer <token>

Réponse 200:
{
  "success": true,
  "count": 25,
  "data": [...]
}
```

#### Historique d'une entité
```http
GET /history/:entityType/:entityId?limit=50
Authorization: Bearer <token>

entityType: task, project, team, comment

Réponse 200:
{
  "success": true,
  "count": 15,
  "data": [...]
}
```

---

### Utilisateurs

#### Rechercher des utilisateurs
```http
GET /users/search?q=john&teamId=...
Authorization: Bearer <token>

Query Parameters:
- q (required): terme de recherche (min 2 caractères)
- teamId (optional): exclure les membres de cette équipe

Réponse 200:
{
  "success": true,
  "count": 3,
  "data": [
    {
      "_id": "...",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com",
      "avatar": null
    }
  ]
}
```

#### Détails d'un utilisateur
```http
GET /users/:id
Authorization: Bearer <token>

Réponse 200:
{
  "success": true,
  "data": {
    "_id": "...",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "bio": "...",
    "phone": "...",
    "teams": [...],
    "createdAt": "..."
  }
}
```

---

## ⚠️ Codes d'erreur

- **400** - Bad Request (validation échouée)
- **401** - Unauthorized (token manquant ou invalide)
- **403** - Forbidden (pas les permissions)
- **404** - Not Found (ressource non trouvée)
- **429** - Too Many Requests (rate limit dépassé)
- **500** - Internal Server Error

Format d'erreur :
```json
{
  "success": false,
  "message": "Description de l'erreur"
}
```

---

## 🔒 Sécurité

- **Rate Limiting** : 100 requêtes / 15 minutes par IP
- **JWT Expiration** : 7 jours
- **File Upload Limit** : 10 MB
- **Allowed File Types** : jpeg, jpg, png, gif, pdf, doc, docx, xls, xlsx, txt, zip, rar

---

## 📊 Performances

- Temps de réponse moyen : **< 200ms**
- Temps de réponse max acceptable : **< 2s**
- Compression gzip activée
- Indexation MongoDB optimisée

---

## 🛠️ Environnement de développement

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/task_management
JWT_SECRET=votre_secret_jwt
JWT_EXPIRE=7d
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

---

## 📝 Notes

- Toutes les dates sont en format ISO 8601
- Les IDs MongoDB sont en format ObjectId
- Les réponses incluent toujours un champ `success`
- Les listes incluent un champ `count`
- Les populations sont automatiques pour les relations importantes
