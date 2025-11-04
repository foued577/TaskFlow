# 🔐 Politique de Sécurité – TaskFlow

Bienvenue sur le dépôt officiel de **TaskFlow**, un gestionnaire collaboratif de tâches et projets.

## 🧩 Versions supportées

Voici les versions actuellement maintenues avec des correctifs de sécurité et de stabilité :

| Version | Supportée |
|----------|------------|
| 1.x.x    | ✅ Oui |
| < 1.0.0  | ❌ Non |

---

## 🚨 Signaler une vulnérabilité

Si vous découvrez une faille de sécurité (ex : injection, XSS, fuite de données, etc.) :

1. **Ne la divulguez pas publiquement** dans les issues du dépôt.  
2. Envoyez un rapport privé à :  
   📧 **yousfifouede@gmail.com**
3. Dans votre email, merci d’indiquer :
   - Une description claire de la faille
   - Les étapes pour la reproduire
   - Les fichiers potentiellement concernés
   - Votre suggestion de correction (si possible)

Nous accuserons réception sous **48 heures**, et une correction sera effectuée dès que possible.

---

## 🧠 Bonnes pratiques pour les contributeurs

Avant toute contribution :
- Évitez de committer des fichiers `.env` ou des clés API.  
- Lancez une vérification de sécurité locale avec :
  ```bash
  npm audit
  npm audit fix
