# Guide d'Utilisation : Application "Controle"

Ce guide est destiné aux agents de terrain (PNP) et aux superviseurs pour l'utilisation correcte du système de collecte de données.

---

## 📱 Guide pour l'Agent de Terrain (PNP)

L'application est conçue pour être **automatique et stricte**. Vous n'avez pas besoin de saisir l'heure ou vos coordonnées GPS manuellement.

### 1. Conditions de Saisie (Règles d'Or)
Pour pouvoir valider un questionnaire, vous devez respecter les conditions suivantes :
- **Horaires** : La collecte est autorisée uniquement entre **07h00 et 19h00**.
- **Pause** : Le système est bloqué durant la pause méridienne (**12h00 - 12h30**).
- **Lieu** : Vous devez vous trouver physiquement à l'intérieur des limites de la **Commune** sélectionnée.
- **Précision** : Votre signal GPS doit être stable (précision inférieure à 4 mètres).
- **Fréquence** : Un délai minimum de **45 minutes** est requis entre deux validations de questionnaires.

### 2. Que faire en cas de blocage ?
- **"Heure interdite"** : Vous tentez de travailler en dehors des plages horaires autorisées. Veuillez attendre l'heure légale.
- **"Vous n'êtes pas sur le lieu indiqué"** : Vous êtes hors de la zone de la commune. Déplacez-vous vers le centre de la zone cible.
- **"Précision GPS insuffisante"** : Sortez des bâtiments ou dégagez-vous des obstacles pour capter un meilleur signal satellite.
- **"Attendez l'heure exacte"** : Vous allez trop vite. Respectez le délai de 45 minutes entre les saisies.

### 3. Mode Hors-ligne
L'application fonctionne sans internet. Vos données sont sauvegardées localement et seront envoyées automatiquement au serveur dès que vous retrouverez une connexion (3G/4G/Wifi).

### 4. Normalisation automatique des noms
Tous les champs texte libres sont automatiquement remis en **Nom Propre** (Première lettre en majuscule, le reste en minuscule). Vous pouvez donc taper en majuscules ou en minuscule, l'application corrige d'elle-même :
- "RAKOTO jean" → "Rakoto Jean"
- "EPICERIE ralaivao" → "Epicerie Ralaivao"
- "andohalo" → "Andohalo"

Les acronymes courants (PNP, PDV, CUA, etc.) sont préservés en majuscules.

### 5. Sauvegarde des coordonnées GPS entre deux questionnaires
Après une sauvegarde réussie, le formulaire se vide mais **conserve vos coordonnées GPS et le district**. Si vous restez dans la même zone de travail, vous n'avez pas besoin de re-saisir ces informations pour le questionnaire suivant.

---

## 💻 Guide pour le Superviseur

Le Dashboard vous permet de surveiller la qualité de la collecte en temps réel.

### 1. Analyse du Tableau de Bord
- **Lignes Vertes (✅ VALIDÉ)** : Données conformes et vérifiées par le serveur.
- **Lignes Rouges (🚨 SUSPECT)** : Données ayant déclenché une alerte de fraude (ex: coordonnées GPS hors zone, tentative de modification d'heure). Ces données doivent être auditées.

### 2. Recherche et Exportation
- **Filtre** : Utilisez la barre de recherche pour isoler les activités d'un agent spécifique.
- **Export CSV** : Cliquez sur "Exporter en CSV" pour télécharger l'intégralité des données et les analyser dans Excel.

### 3. Validation des Données
Le système utilise un **verrouillage définitif**. Une fois qu'un agent a cliqué sur "Clôturer et Sauvegarder", la donnée est scellée et ne peut plus être modifiée, garantissant l'intégrité totale du rapport.
