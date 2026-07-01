

# CAHIER DES CHARGES MVP - APPLICATION DE CONTRÔLE TERRAIN (Geofencing & Time-Tracking)

## 1. CONTEXTE ET OBJECTIF
L'objectif de cette application mobile est de permettre la collecte de données sur le terrain (Madagascar) avec un contrôle **strict, automatisé et infaillible** de l'HEURE et du LIEU (GPS) de l'agent. 
L'application doit empêcher toute forme de fraude (fausses déclarations de lieu, antidatage, modification à posteriori) en automatisant les captures et en verrouillant les données.

## 2. PÉRIMÈTRE DU MVP (Minimum Viable Product)

### MODULE A : Interface de Saisie (Données textuelles)
L'interface doit être simple et limiter au maximum la saisie manuelle libre pour éviter les erreurs.
*   **Matricule du PNP** : Champ texte/numérique.
*   **Nom du PNP** : Champ texte avec **formatage automatique en Nom Propre** (ex : "rakoto jean" → "Rakoto Jean").
*   **Nom de l'Étude** : Champ texte avec **formatage automatique en Nom Propre**.
*   **Nom du Répondant / PDV** : Champ texte avec **formatage automatique en Nom Propre**.
*   **Questionnaire N°** : Champ texte avec **conversion automatique et forcée en MAJUSCULES**.
*   **Cascade de Lieux (District → Commune en menus déroulants, Fokontany en saisie libre)** :
    *   Choix du **District** (menu déroulant obligatoire).
    *   Le choix du District filtre automatiquement la liste des **Communes** (menu déroulant obligatoire).
    *   **Fokontany** : champ texte libre avec formatage Nom Propre (le PRD ne fournit pas de base de données des fokontany, d'où la saisie libre).

### Règle de formatage "Nom Propre"
Tous les champs texte libres subissent un **reformatage automatique** lors de la perte de focus et lors de la soumission :
- Première lettre en majuscule, reste en minuscule.
- Acronymes préservés en majuscules : `PNP`, `PDV`, `CUA`, `CU`, `RN`, `RNI`, `EST`, `OUEST`, `NORD`, `SUD`.
- Séparateurs (espace, trait d'union, apostrophe) respectés.
- Objectif : uniformiser la donnée collectée et éliminer les erreurs de saisie (`BOISSONS` → `Boissons`, `raKoto JEAN` → `Rakoto Jean`).

### MODULE B : Automatisation et Contrôle du Temps (Le Cœur du système)
**Règle d'or :** L'agent ne saisit JAMAIS l'heure manuellement. L'application capture silencieusement l'heure du système à l'ouverture ou à la validation du formulaire.
*   **Règles de Métier (Conditions de blocage) :**
    *   Interdiction de travailler tôt : Si l'heure est **avant 07h00** -> Afficher *"Heure interdite"*.
    *   Interdiction de travailler tard : Si l'heure est **après 19h00** -> Afficher *"Heure interdite"*.
    *   Pause méridienne obligatoire : Si l'heure est comprise **entre 12h00 et 12h30** -> Afficher *"Heure interdite"*.
    *   Délai minimum d'exécution : L'application doit calculer le temps écoulé depuis la capture silencieuse de l'heure du système de la dernière sauvegarde. Si le délai est **inférieur à 45 minutes** -> Afficher *"Attendez l'heure exacte"*.
*   **Comportement UX (Expérience Utilisateur) :** Si l'une des conditions n'est pas remplie, l'agent reçoit le message d'erreur et ne peut pas valider la tâche. L'écran ne se "bloque" pas (pas de crash), mais il est invité à patienter ou revenir à la bonne heure.

### MODULE C : Automatisation et Contrôle GPS (Geofencing)
**Règle d'or :** Si possible, l'agent ne devait saisir ses coordonnées (Latitude/Longitude) manuellement au clavier, sauf si l'appareil ne possède pas de système de coordonnées gps, ou, si les coordonnées du système sont défaillantes (précision des coordonnées doit etre moins de 4 mètre). Dans ces cas, les coordonnées peuvent etre saisies manuellement, mais doivent toujours etre confrontées à la base de données 'Coordonnees_min_max_des_Communes'.
*   **Le bouton d'action :** L'interface doit comporter un bouton *"Obtenir ma position"*.
*   **Précision technique :** L'application doit utiliser l'API de localisation en mode **"Haute Précision"** (croisement GPS/Réseau/Wifi) pour garantir la fiabilité.
*   **Logique de contrôle (Geofencing interne) :** 
    *   L'application doit intégrer en dur (dans une base locale ou un fichier JSON interne) la table de données fournie par le client : `Coordonnées_min_max_des_Communes` (contenant Latitude Min/Max et Longitude Min/Max pour chaque Commune).
    *   Lorsque le point GPS est capté, l'IA de l'application compare les coordonnées trouvées avec les limites de la **Commune** sélectionnée par l'agent dans le Module A.
    *   **Si les coordonnées sont hors limites :** Afficher *"Vous n'êtes pas sur le lieu indiqué"*. Les champs GPS se vident, l'agent ne peut pas enregistrer et doit retenter la capture.
    *   **Si les coordonnées sont valides :** Les champs visible ou invisibles, selon le cas, sont validés, l'agent peut passer à la sauvegarde.

### MODULE D : Sécurités Anti-Fraude (Fonctionnalités cachées en arrière-plan)
L'application doit empêcher la manipulation du système d'exploitation par l'agent :
*   **Anti-Fake GPS :** Le code doit détecter l'utilisation de `Mock Locations` (positions fictives). Si détecté, afficher "Changez de position" et revenir à la prise de GPS.
*   **Anti-Modification de l'Heure :** Le code doit vérifier si le réglage de l'appareil *"Heure automatique fournie par le réseau"* est activé. S'il est désactivé (heure réglée manuellement), l'application affiche un message d'erreur et bloque la collecte.

### MODULE E : Enregistrement, Verrouillage et Mode Hors-ligne
L'application doit être "Offline-First" et garantir l'intégrité de la donnée.
*   **Bouton de validation :** Un seul bouton *"Clôturer et Sauvegarder"*. Avant l'utilisation de ce bouton, l'agent peut revenir sur ses saisies précedentes pour modifier une erreur de saisie.
*   **Verrouillage définitif :** Une fois cliqué, le questionnaire est scellé. Aucun mode "Brouillon", aucune modification à posteriori n'est permise.
*   **Gestion Hors-ligne :** La donnée scellée est sauvegardée dans une base de données locale sécurisée (ex: SQLite/Room).
*   **Synchronisation Automatique :** Un service en arrière-plan (Worker) surveille la connexion internet (3G/4G/Wifi). Dès qu'un réseau est disponible, toutes les données en attente sont envoyées silencieusement vers le serveur distant. 

### MODULE F : Tableau de Bord Web (Backend Superviseur)
Interface très simple pour la gestion par le superviseur.
*   **Réception (Endpoint API) :** Un serveur web sécurisé capable de recevoir et stocker les données synchronisées par les telephones ou tablettes.
*   **Interface Web (UI) :** Un accès web protégé par mot de passe.
*   **Affichage :** Un tableau récapitulatif listant toutes les données reçues (Agent, Heure, GPS, Lieu, Statut).
*   **Export :** Un bouton *"Exporter"*, permettant de télécharger l'intégralité de la base de données au format Excel (.xlsx ou .csv propre).

## 3. INSTRUCTIONS POUR L'IA DE CODAGE
1. Merci de proposer une architecture technique adaptée à ce MVP (ex: Flutter ou React Native pour le mobile afin de gérer facilement le GPS et l'offline ; Node.js/Express ou Firebase pour le backend).
2. Commencer par générer les modèles de base de données (Schéma des utilisateurs, Schéma des lieux avec Min/Max, Schéma des soumissions de formulaires).
3. Rédiger les fonctions critiques en premier : la vérification Geofencing (Module C) et les règles de validation du Temps (Module B).

