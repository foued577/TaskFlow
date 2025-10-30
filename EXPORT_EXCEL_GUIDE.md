# 📊 Guide d'Utilisation - Export Excel

## ✅ Fonctionnalité Ajoutée !

J'ai ajouté une section complète d'export des statistiques en format Excel à votre application TaskFlow.

## 🎯 Fonctionnalités Disponibles

### 1. **Export des Tâches**
- Exporte toutes vos tâches avec détails complets
- **Filtres disponibles** : Projet, Statut, Priorité, Dates
- **Colonnes incluses** :
  - ID, Titre, Description
  - Projet, Statut, Priorité
  - Assigné à (liste des membres)
  - Heures estimées
  - Dates début/échéance
  - Sous-tâches (total et complétées)
  - Progression (%)
  - Indicateur de retard
  - Créé par, Date création, Dernière MAJ

### 2. **Export des Projets**
- Vue d'ensemble de tous les projets avec statistiques
- **Colonnes incluses** :
  - ID, Nom, Description
  - Équipe, Statut, Priorité
  - Total tâches, Terminées, En cours, En retard
  - Taux de complétion (%)
  - Dates, Tags, Créateur

### 3. **Statistiques Globales** (Multiple onglets)
- **Onglet 1 : Statistiques Globales**
  - Total utilisateurs, équipes, projets, tâches
  - Répartition par statut
  - Taux de complétion global
  
- **Onglet 2 : Par Priorité**
  - Nombre de tâches par priorité
  - Tâches terminées par priorité
  
- **Onglet 3 : Par Projet**
  - Top 20 projets avec métriques

### 4. **Rapport d'Équipe**
- Statistiques détaillées par membre
- Performance individuelle
- Tâches assignées, terminées, en cours
- Taux de complétion par membre

### 5. **Historique des Actions**
- Journal complet des activités
- Date, heure, utilisateur, action, entité
- Limité aux 1000 dernières actions
- Filtres par date et type d'entité

## 🚀 Installation

### Étape 1 : Installer la librairie XLSX (Backend)

```bash
cd C:\Users\Foued\Downloads\planner\backend
npm install xlsx
```

### Étape 2 : Redémarrer le Backend

```bash
# Arrêtez le backend (Ctrl+C)
# Puis relancez :
npm start
```

### Étape 3 : Rafraîchir le Frontend

Le frontend est déjà prêt ! Rafraîchissez simplement la page (F5).

## 📱 Comment Utiliser

### Accès
1. Connectez-vous à TaskFlow
2. Cliquez sur **"Exports Excel"** dans la sidebar (📥)

### Exporter des Données

#### Export Simple
1. Cliquez sur le bouton d'export souhaité
2. Le fichier Excel se télécharge automatiquement
3. Ouvrez-le avec Excel, Google Sheets, ou LibreOffice

#### Export avec Filtres (Tâches uniquement)
1. Sélectionnez vos filtres :
   - Projet spécifique
   - Statut (non démarrée, en cours, terminée)
   - Priorité (basse, moyenne, haute, urgente)
   - Plage de dates
2. Cliquez sur "Exporter les Tâches"
3. Seules les tâches correspondantes seront exportées

#### Export d'un Rapport d'Équipe
1. Scrollez jusqu'à la section "Rapports par Équipe"
2. Cliquez sur "Exporter" pour l'équipe souhaitée
3. Le rapport inclut les statistiques de tous les membres

## 📋 Format des Fichiers

- **Format** : Excel (.xlsx)
- **Nom** : `[type]_[timestamp].xlsx`
  - Exemple : `taches_1730280000000.xlsx`
- **Encodage** : UTF-8 (supporte les caractères spéciaux)
- **Colonnes** : Largeurs automatiquement ajustées

## 🎨 Exemples d'Utilisation

### Cas 1 : Rapport Mensuel
```
1. Export des Statistiques Globales
2. Voir les 3 onglets :
   - Vue d'ensemble
   - Répartition par priorité
   - Performance par projet
```

### Cas 2 : Suivi de Projet
```
1. Filtrer par projet spécifique
2. Export des Tâches
3. Analyser la progression dans Excel
```

### Cas 3 : Évaluation d'Équipe
```
1. Export Rapport d'Équipe
2. Voir les performances individuelles
3. Identifier les membres les plus actifs
```

### Cas 4 : Audit et Conformité
```
1. Export de l'Historique
2. Filtrer par dates
3. Vérifier toutes les actions effectuées
```

## 📊 API Endpoints

Si vous voulez appeler directement les APIs :

```
GET /api/export/tasks?projectId=...&status=...&priority=...
GET /api/export/projects
GET /api/export/statistics
GET /api/export/team/:teamId
GET /api/export/history?startDate=...&endDate=...
```

**Headers requis** :
```
Authorization: Bearer <token>
```

**Response** : Fichier Excel binaire

## 🔧 Personnalisation

### Modifier les Colonnes
Éditez `backend/controllers/exportController.js` :
```javascript
const data = tasks.map(task => ({
  'Nouvelle Colonne': task.nouveauChamp,
  // ... autres colonnes
}));
```

### Ajouter un Nouveau Type d'Export
1. Créez une nouvelle fonction dans `exportController.js`
2. Ajoutez une route dans `routes/export.js`
3. Ajoutez un bouton dans `frontend/src/pages/Export.js`

### Changer le Style Excel
Modifiez les configurations XLSX :
```javascript
ws['!cols'] = [{ wch: 30 }, { wch: 40 }, ...];
```

## ⚠️ Limites

- **Historique** : Limité à 1000 dernières entrées
- **Projets (Stats)** : Top 20 projets seulement
- **Taille fichier** : Pas de limite côté backend, mais Excel a une limite de ~1M de lignes
- **Performances** : Les gros exports (>10 000 lignes) peuvent prendre quelques secondes

## 🎯 Fichiers Modifiés/Créés

### Backend
- ✅ `controllers/exportController.js` (NOUVEAU)
- ✅ `routes/export.js` (NOUVEAU)
- ✅ `server.js` (ajout route export)
- ✅ `package.json` (ajout dépendance xlsx)

### Frontend
- ✅ `pages/Export.js` (NOUVEAU)
- ✅ `App.js` (ajout route /export)
- ✅ `components/Layout.js` (ajout lien sidebar)

## 📖 Technologies Utilisées

- **XLSX** (SheetJS) : Librairie de génération Excel
- **Fetch API** : Téléchargement des fichiers
- **Blob API** : Gestion des fichiers binaires

## 🆘 Dépannage

### Erreur "XLSX is not defined"
```bash
cd backend
npm install xlsx
# Redémarrer le backend
```

### Le téléchargement ne démarre pas
1. Vérifiez que le backend tourne
2. Ouvrez F12 → Network
3. Regardez si la requête `/api/export/...` réussit (200)

### Fichier corrompu
1. Vérifiez la version de XLSX : `npm list xlsx`
2. Mettez à jour si nécessaire : `npm update xlsx`

### Export vide
1. Vérifiez qu'il y a des données dans la BDD
2. Vérifiez les filtres appliqués
3. Regardez les logs backend

## ✨ Améliorations Futures Possibles

- [ ] Export PDF
- [ ] Export CSV
- [ ] Graphiques intégrés dans Excel
- [ ] Envoi automatique par email
- [ ] Exports programmés (hebdomadaires, mensuels)
- [ ] Templates d'export personnalisés
- [ ] Compression ZIP pour gros exports
- [ ] Export multi-projets comparatif

---

## 🎉 Résumé

Vous avez maintenant une **fonctionnalité complète d'export Excel** qui vous permet de :
- ✅ Exporter toutes vos données
- ✅ Filtrer avant l'export
- ✅ Générer des rapports statistiques
- ✅ Analyser les performances d'équipe
- ✅ Auditer l'historique des actions

**Pour commencer** : Installez `npm install xlsx` dans le backend, redémarrez, et c'est prêt ! 📊

---

**Créé le** : 30 octobre 2024
**Version** : 1.0
