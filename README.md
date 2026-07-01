# 📱 Controle - Application de Collecte Terrain (Antifraude)

Application de collecte de données sur le terrain conçue pour **Madagascar**, avec un contrôle strict et infaillible de l'heure et du lieu (GPS) pour éliminer toute forme de fraude.

## 🎯 Objectif

L'application empêche :
- ❌ Les fausses déclarations de lieu
- ❌ L'antidatage
- ❌ La modification à posteriori des données
- ❌ La fraude de coordonnées GPS

## ✨ Fonctionnalités

### Pour l'Agent
- 📍 **Capture GPS automatique** avec validation par Geofencing
- ⏰ **Contrôle du temps** : collecte autorisée uniquement entre 07h00 et 19h00 (avec pause méridienne 12h00-12h30)
- 🔒 **Verrouillage définitif** des questionnaires après sauvegarde
- 📡 **Mode hors-ligne** avec synchronisation automatique
- 🔤 **Formatage automatique** des noms en "Nom Propre" (avec préservation des acronymes)
- 🚦 **Quota de saisies** défini par le superviseur

### Pour le Superviseur
- 🔐 **Activation manuelle** de chaque appareil (mot de passe maître + quota)
- 📊 **Dashboard web** avec tableau de toutes les soumissions
- 🔍 **Recherche** par agent / matricule / lieu
- 📥 **Export CSV** pour analyse dans Excel
- 🛡️ **Validation symétrique** côté serveur (rejet automatique des données hors zone)

## 🏗️ Architecture

- **Backend** : Node.js / Express
- **Stockage** : JSON File (MVP) — PostgreSQL prévu en production
- **Dashboard** : HTML5/JS statique servi par le backend
- **Mobile** : Logique en JS (simulateur via navigateur)

Voir [`ARCHITECTURE.md`](ARCHITECTURE.md) pour l'analyse comparative des options techniques.

## 🚀 Démarrage rapide

### Prérequis
- **Node.js** (version 18+ recommandée)
- **npm**

### Lancement (Recommandé)

À la racine du projet, double-cliquez sur **`start.bat`** :
- Il lance le serveur Node.js dans une fenêtre dédiée
- Il ouvre automatiquement votre navigateur sur l'application agent

> Gardez la fenêtre noire ouverte pendant l'utilisation.

### Lancement manuel (avancé)

```bash
# 1. Installer les dépendances
cd backend
npm install

# 2. Démarrer le serveur
node index.js

# 3. Ouvrir dans le navigateur
# - Mode Agent    : http://localhost:3001/agent.html
# - Mode Superviseur : http://localhost:3001/
```

## 📚 Documentation

| Fichier | Contenu |
|---|---|
| [`PRD.md`](PRD.md) | Cahier des charges complet (Modules A-F) |
| [`ARCHITECTURE.md`](ARCHITECTURE.md) | Analyse tech stack + cycle de vie + résilience réseau |
| [`CRITICAL_LOGIC.md`](CRITICAL_LOGIC.md) | Algorithmes de validation (temps, geofencing, anti-fraude) |
| [`DATABASE.md`](DATABASE.md) | Modèles de données + format JSON |
| [`DEPLOYMENT.md`](DEPLOYMENT.md) | Guide de déploiement détaillé |
| [`USER_GUIDE.md`](USER_GUIDE.md) | Guide utilisateur (agent + superviseur) |
| [`CHANGELOG.md`](CHANGELOG.md) | Historique des versions |

## 🧪 Tests

Le projet inclut des tests automatisés Playwright :

```bash
# Depuis la racine du projet
node backend/test_cascade.js
```

Tests couverts :
- ✅ Cascade District → Commune
- ✅ Activation de l'appareil
- ✅ Validation du format du Fokontany (saisie libre)

## 🌍 Géographie

Le projet utilise les coordonnées GPS des communes d'Antananarivo (Madagascar) :
- **Tana Ville** : 5 communes urbaines (CUA I à CUA V)
- **Périphérie** : 4 communes (Ambohimanambola, Ampitatafika, Alasora, Betsizaraina)

Voir [`backend/geography.json`](backend/geography.json) pour les bornes min/max de chaque commune.

## 📂 Structure du projet

```
Controle/
├── backend/                # API Node.js
│   ├── index.js            # Serveur Express
│   ├── geography.json      # Districts + communes + bornes GPS
│   ├── submissions.json    # Données collectées (généré à l'usage)
│   └── test_cascade.js     # Tests Playwright
├── dashboard/              # Interfaces web
│   ├── index.html          # Dashboard superviseur
│   └── agent.html          # Simulateur mobile
├── .claude/                # Configuration Claude Code (versionnée)
├── start.bat               # Lanceur Windows
├── PRD.md                  # Cahier des charges
├── ARCHITECTURE.md         # Architecture technique
├── CRITICAL_LOGIC.md       # Algorithmes critiques
├── DATABASE.md             # Modèles de données
├── DEPLOYMENT.md           # Guide de déploiement
├── USER_GUIDE.md           # Guide utilisateur
├── CHANGELOG.md            # Historique des versions
└── README.md               # Ce fichier
```

## 🔒 Sécurité

Le système applique une **validation symétrique** :
1. **Côté client** : bloque la saisie si les règles ne sont pas respectées
2. **Côté serveur** : rejette toute donnée dont les coordonnées sont hors des bornes de la commune, **même si le client a été manipulé** (code HTTP 422)

En production, le système intègrera :
- 📡 Détection des "Mock Locations" (Fake GPS)
- 🕒 Vérification NTP (Network Time Protocol)
- 🔐 Vérification Root/Jailbreak (SafetyNet / Play Integrity)

## 📄 Licence

À définir.
