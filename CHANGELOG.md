# Changelog - Projet "Controle"

Historique des modifications du projet. Chaque entrée reflète un changement fonctionnel ou technique ayant un impact sur l'application.

---

## [Non versionné] - 2026-06-23

### 🆕 Ajouts
- **Lanceur automatique `start.bat`** à la racine du projet. Double-cliquer dessus lance le serveur Node.js et ouvre automatiquement `http://localhost:3001/agent.html` dans le navigateur.
- **Mode fallback local (`file://`)** : Lorsque l'application est ouverte localement (sans serveur), les soumissions sont sauvegardées dans le `localStorage` du navigateur. À chaque nouvelle soumission, l'application tente de rejouer toutes les données en attente vers le serveur. Les entrées synchronisées sont marquées `_synced: true`.
- **Bannière d'avertissement "Mode hors-ligne"** affichée en haut de l'écran `agent.html` quand l'application est ouverte en `file://`.
- **Normalisation "Nom propre"** appliquée sur les champs texte libres :
  - `Nom du PNP`
  - `Nom de l'Étude`
  - `Nom du Répondant / PDV`
  - `Fokontany`
  - Le formatage est appliqué au blur (perte de focus) et au moment de la soumission, garantissant la cohérence côté serveur.
  - Une liste d'acronymes préservés en majuscules : `PNP`, `PDV`, `CUA`, `CU`, `RN`, `RNI`, `EST`, `OUEST`, `NORD`, `SUD`.
  - Les séparateurs (espace, trait d'union, apostrophe) sont respectés : `jean-pierre`, `d'arc`.

### 🐛 Corrections
- **Bug `validate(data)`** : La fonction déstructurait `communeId` alors que l'objet envoyé utilisait `commune_id`. L'erreur "Commune non sélectionnée" était déclenchée à tort. Variable renommée pour correspondre au payload.
- **Bug bouton "Obtenir ma position"** : Un `return` manquant faisait que le code tombait dans la branche `navigator.geolocation` même quand des coordonnées simulées étaient déjà saisies. Ajout d'un `return` + parsing explicite avec `parseFloat()` et validation `isNaN()`.
- **Bug `form.reset()` après sauvegarde** : La réinitialisation vidait les champs GPS, obligeant l'agent à les ressaisir pour le questionnaire suivant. La nouvelle implémentation **conserve les coordonnées GPS et le district** entre deux soumissions consécutives (utile dans une même zone de travail).
- **Bug `geofencing` après changement de commune** : Si l'agent restait dans la même commune mais changeait ses coordonnées, l'ancien affichage persistait. Maintenant, l'affichage GPS est rafraîchi à partir des coordonnées effectives envoyées au serveur.
- **Bug intervalle 45 min en mode simulation** : Le calcul `new Date() - lastSubmissionTime` utilisait l'heure réelle du système au lieu de l'heure simulée (`data.systemTime`), permettant à un agent malveillant de soumettre plusieurs questionnaires en quelques secondes. Correction : la base de calcul est désormais `data.systemTime`, et `lastSubmissionTime` est également stockée à partir de `data.systemTime` pour rester cohérent.

### 🧹 Nettoyage
- Suppression du fichier obsolète `backend/communes_bounds.json` (faisait référence à des communes `commune-1`/`commune-2` qui n'existent pas dans `geography.json` et n'était pas utilisé par `index.js`).
- Suppression du dossier vide `backend/Controle/` (reliquat sans contenu).
- Mise à jour de `DEPLOYMENT.md` : section "Mise à jour des zones de Geofencing" pointe désormais vers `geography.json` (la source de vérité unique). Ajout d'une note sur la synchronisation entre backend et `<script>` embarqué.

### 📝 Documentation
- Mise à jour de `PRD.md` : précision sur la "Cascade de Lieux" (Fokontany = saisie libre, pas un menu filtré).
- Mise à jour de `ARCHITECTURE.md` : ajout du paragraphe "Cycle de Vie" et de la note sur le mode local de secours.
- Mise à jour de `CRITICAL_LOGIC.md` : ajout d'une section "Normalisation des saisies libres" et "Stratégie de résilience réseau (file:// fallback)".
- Mise à jour de `DEPLOYMENT.md` : procédure `start.bat` documentée + note sur la synchro automatique des données en local.
- Mise à jour de `USER_GUIDE.md` : ajout de la section "Normalisation automatique des noms".

---

## [MVP-1.0] - 2026-06-22

### 🆕 Ajouts
- Backend Node.js / Express avec endpoints `/api/submissions`, `/api/geography`, `/api/export` (CSV).
- Dashboard superviseur (`/`) avec tableau des soumissions, filtre de recherche, et export CSV.
- Simulateur mobile (`/agent.html`) avec :
  - Écran d'activation par superviseur (mot de passe maître + quota).
  - Écran principal avec panneau de simulation (heure + GPS).
  - Formulaire : Matricule, Nom PNP, Étude, Répondant, Questionnaire N°, District → Commune (cascade) → Fokontany.
  - Validation côté client (heure, geofencing, intervalle 45 min).
- Validation côté serveur (symétrie de validation) : rejet des coordonnées hors zone avec code HTTP 422.
- Fichier `geography.json` : 2 districts, 9 communes, avec bornes GPS min/max.
- Fichier `test_cascade.js` (Playwright) : tests automatisés pour la cascade District/Commune.

### 📝 Documentation initiale
- `PRD.md`, `ARCHITECTURE.md`, `CRITICAL_LOGIC.md`, `DEPLOYMENT.md`, `USER_GUIDE.md`.