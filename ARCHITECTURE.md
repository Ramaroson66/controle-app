# Rapport de Recommandation Tech Stack : Projet "Controle"

Ce rapport analyse et compare les différentes options technologiques pour le développement de l'application "Controle", dont l'objectif principal est la collecte de données terrain avec un contrôle strict et infaillible de l'heure et du lieu pour prévenir toute fraude.

---

## 1. Analyse des Besoins Critiques
L'application repose sur trois piliers techniques non négociables :
- **Anti-Fraude GPS & Temps** : Détection des "Fake GPS" et blocage des modifications manuelles de l'heure système.
- **Offline-First** : Stockage local robuste et synchronisation intelligente en arrière-plan pour les zones à faible connectivité.
- **Intégrité des Données** : Verrouillage définitif des formulaires après validation.

---

## 2. Comparatif des Options Technologiques

| Critères | Option 1 : Flutter + Firebase | Option 2 : React Native + Node.js + SQL | Option 3 : Natif (Kotlin/Swift) + Custom Backend |
| :--- | :--- | :--- | :--- |
| **Force Anti-Fraude** | $\text{Faible} \rightarrow \text{Moyenne}$ | $\text{Moyenne} \rightarrow \text{Haute}$ | $\text{Maximum}$ |
| **Fiabilité Offline** | Haute (Automatisé) | Haute (Personnalisable) | Maximum (Intégration OS) |
| **Vitesse de Dév.** | Maximum | Haute | Faible |
| **Dashboard Superviseur** | Moyenne | Maximum | Haute |
| **Perf. Bas Débit** | Moyenne | Haute | Maximum |

### Analyse détaillée :

#### Option 1 : Flutter + Firebase
C'est l'option la plus rapide pour sortir un MVP. Cependant, Firebase est une "boîte noire" qui offre peu de contrôle sur la séquence exacte de synchronisation et les mécanismes de sécurité bas niveau. La détection de fraude repose sur des plugins tiers dont la réactivité aux mises à jour d'OS peut être lente.

#### Option 2 : React Native + Node.js + PostgreSQL
Cette approche offre un compromis idéal. Elle permet de développer l'interface utilisateur rapidement en JavaScript, tout en permettant l'écriture de **Modules Natifs (Native Modules)** en Kotlin et Swift pour les fonctions critiques (capteurs, détection de mock location, vérification NTP du temps). Le backend Node.js associé à PostgreSQL permet une gestion rigoureuse des données et un dashboard superviseur extrêmement performant.

#### Option 3 : Natif (Kotlin/Swift)
C'est l'option la plus sécurisée. L'accès direct aux API Android et iOS garantit une détection de fraude quasi-impossible à contourner. Cependant, le coût de développement est doublé et la maintenance devient complexe, ce qui est souvent disproportionné pour un MVP.

---

## 3. Focus : Stratégie Anti-Fraude (Le Cœur du Système)

Pour garantir l'infaillibilité du système, la stack recommandée (Option 2) implémentera les mesures suivantes via des ponts natifs :

1. **Détection GPS** : 
   - Android : Vérification de `Location.isMock()` et interrogation des paramètres `allow_mock_locations`.
   - iOS : Validation de la précision horizontale et détection des anomalies de signal.
2. **Contrôle du Temps** : 
   - Implémentation d'un client **NTP (Network Time Protocol)** léger pour récupérer l'heure réelle du réseau, indépendamment du réglage de l'utilisateur.
   - Comparaison du delta entre l'heure système et l'heure réseau ; blocage si l'écart est suspect.
3. **Intégrité OS** : 
   - Vérification du statut Root/Jailbreak (via SafetyNet/Play Integrity API) car la plupart des outils de fraude nécessitent un accès root.

---

## 4. Recommandation Finale

### Choix recommandé : **React Native + Node.js + PostgreSQL**

**Justification :**
L'Option 2 est choisie car elle permet d'atteindre un niveau de sécurité "quasi-natif" tout en conservant l'agilité d'un développement cross-platform. 

- **Sécurité** : L'utilisation de modules natifs pour le GPS et le Temps répond strictement aux exigences du Module C et D du PRD.
- **Données** : PostgreSQL est indispensable pour le reporting complexe du superviseur (Module F) et la gestion des limites de communes.
- **Robustesse** : L'architecture offline-first avec une base SQLite locale et un synchroniseur custom assure que les données sont préservées même dans les conditions les plus difficiles.

### Architecture cible :
- **Frontend Mobile** : React Native (avec modules natifs pour la sécurité).
- **Base Locale** : SQLite / WatermelonDB.
- **Backend** : Node.js / Express.
- **Base de Données Serveur** : PostgreSQL.
## 5. Cycle de Vie de l'Application (Provisionnement)

Pour garantir un contrôle total sur l'utilisation des appareils, l'application implémente un cycle de provisionnement manuel par le superviseur :

1. **Installation** : L'application est installée sur l'appareil.
2. **Activation** : Au premier lancement, l'application est verrouillée. Le superviseur doit saisir un **Mot de Passe Maître** et définir un **Quota de Saisies** (ex: 50 questionnaires).
3. **Utilisation** : L'agent peut collecter des données tant que le quota n'est pas épuisé.
4. **Expiration** : Une fois le quota atteint, l'application se verrouille automatiquement.
5. **Réactivation** : L'appareil doit être remis au superviseur pour une nouvelle activation (Saisie du mot de passe + Nouveau quota).

## 6. Résilience Réseau (Mode Local de Secours)

Pour répondre au cas où l'agent ouvrirait l'application directement depuis le système de fichiers (protocole `file://`) au lieu de passer par le serveur, l'application intègre un **fallback local** :

- Si la requête `POST /api/submissions` échoue (réseau, `file://`, serveur éteint), la soumission est stockée dans le `localStorage` du navigateur sous la clé `controle_local_submissions`.
- À chaque nouvelle tentative de soumission, l'application essaie de rejouer **toutes les données en attente** vers le serveur.
- Les entrées synchronisées avec succès sont marquées `_synced: true` et ignorées lors des prochaines tentatives.
- Une bannière rouge "MODE HORS LIGNE" s'affiche en haut de l'écran pour informer l'agent.
- ⚠️ En mode local, le superviseur ne voit pas immédiatement les soumissions sur son dashboard. La synchronisation est automatique au retour à un fonctionnement normal.

## 7. Normalisation des Saisies Libres (Format "Nom Propre")

Tous les champs de saisie libre subissent un reformatage automatique :

| Champ | Comportement |
|---|---|
| Nom du PNP | Nom Propre |
| Nom de l'Étude | Nom Propre |
| Nom du Répondant / PDV | Nom Propre |
| Fokontany | Nom Propre |
| Questionnaire N° | MAJUSCULES |

**Règles du format Nom Propre :**
- Première lettre en majuscule, reste en minuscule.
- Acronymes préservés : `PNP`, `PDV`, `CUA`, `CU`, `RN`, `RNI`, `EST`, `OUEST`, `NORD`, `SUD`.
- Séparateurs (espace, trait d'union, apostrophe) respectés.
- Application : au blur du champ + au moment de la soumission (cohérence garantie côté serveur).

## 8. Lancement Simplifié (`start.bat`)

À la racine du projet, un script `start.bat` automatise le démarrage :
- Lance le serveur Node.js dans une fenêtre dédiée (à garder ouverte).
- Ouvre automatiquement le navigateur sur `http://localhost:3001/agent.html`.

Objectif : éviter au superviseur d'avoir à taper des commandes dans un terminal.
