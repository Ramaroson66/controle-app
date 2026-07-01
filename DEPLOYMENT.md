# Guide de Déploiement : Projet "Controle"

Ce document décrit la procédure technique pour installer et lancer l'infrastructure de l'application "Controle".

## 🛠 Architecture Technique
- **Backend** : Node.js / Express
- **Base de Données** : JSON File Store (MVP) / PostgreSQL (Production)
- **Dashboard** : HTML5/JS statique servi par le backend
- **Mobile** : React Native (Logique validée en JS/TS)

---

## 🚀 Installation et Lancement

### 1. Prérequis
- **Node.js** (version 18+ recommandée)
- **npm** (installé avec Node.js)

### 2. Installation du Backend
```bash
# Naviguer vers le dossier backend
cd Controle/backend

# Installer les dépendances
npm install

# Lancer le serveur
node index.js
```

### 🚀 Lancement rapide (Recommandé)
À la racine du projet (`Controle/`), un script `start.bat` est fourni. **Double-cliquez dessus** :
- Il ouvre une fenêtre noire qui démarre le serveur Node.js.
- Il ouvre automatiquement votre navigateur sur `http://localhost:3001/agent.html`.
- Gardez la fenêtre noire **ouverte** pendant l'utilisation de l'application.

> C'est la méthode recommandée, surtout pour les superviseurs qui ne sont pas à l'aise avec le terminal.

### 3. Accès aux Services
- **API Backend** : `http://localhost:3001`
- **Dashboard Superviseur** : `http://localhost:3001/` (ouvrez simplement l'URL dans votre navigateur)
- **Mode Agent (simulateur mobile)** : `http://localhost:3001/agent.html`

> ⚠️ **Important :** N'ouvrez **jamais** `agent.html` en double-cliquant dessus (protocole `file://`). Vous passerez en **mode hors-ligne** : les soumissions seront sauvegardées localement dans le navigateur et renvoyées automatiquement au serveur à chaque nouvelle soumission réussie. Une bannière rouge "MODE HORS LIGNE" s'affichera pour vous le rappeler.

---

## ⚙️ Configuration et Maintenance

### Mise à jour des Zones de Geofencing
Pour modifier les limites des communes, éditez le fichier `Controle/backend/geography.json`.
Chaque commune doit avoir :
- `lat_min` / `lat_max`
- `long_min` / `long_max`

> ⚠️ Le fichier `geography.json` est la **source unique de vérité** utilisée à la fois par le backend (`index.js`) et le simulateur mobile (`agent.html` — copie embarquée). Après toute modification, **mettre à jour les deux endroits** (ou redémarrer le serveur pour forcer le rechargement côté client).

### Synchronisation de la géographie
La géographie est lue par `index.js` au démarrage. Si vous modifiez `geography.json`, **redémarrez le serveur** (`Ctrl+C` puis relancer `start.bat`) pour que les changements soient pris en compte côté backend. Côté client (`agent.html`), la géographie est embarquée directement dans le `<script>` ; en cas de modification, mettez à jour la constante `GEOGRAPHY_DATA` en début de script pour rester en cohérence.

### Gestion des Données
Les soumissions sont stockées dans `Controle/backend/submissions.json`. 
Pour réinitialiser la base de données, videz simplement le contenu du tableau dans ce fichier.

---

## 🛡️ Sécurité et Monitoring
Le serveur effectue une double vérification :
1. **Côté Client** : Le mobile bloque la saisie si les règles ne sont pas respectées.
2. **Côté Serveur** : L'API rejette toute donnée dont les coordonnées GPS sont hors des bornes de la commune sélectionnée, même si le client a été manipulé.
