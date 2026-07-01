# Modèles de Données : Projet "Controle"

Ce document définit la structure des données pour l'application, tant pour le stockage local (SQLite sur mobile) que pour le stockage distant (PostgreSQL sur serveur).

## 1. Schéma Relationnel (Backend PostgreSQL / Local SQLite)

### A. Référentiels Géographiques (Lecture seule sur mobile)
Ces tables sont pré-remplies et servent à la cascade de menus et au Geofencing.

#### `districts`
- `id` : UUID / Integer (PK)
- `name` : VARCHAR (Nom du district)

#### `communes`
- `id` : UUID / Integer (PK)
- `district_id` : FK $\rightarrow$ `districts.id`
- `name` : VARCHAR (Nom de la commune)
- `lat_min` : DECIMAL (Latitude minimum pour le geofencing)
- `lat_max` : DECIMAL (Latitude maximum)
- `long_min` : DECIMAL (Longitude minimum)
- `long_max` : DECIMAL (Longitude maximum)

#### `fokontany`
> **Note MVP :** Le PRD ne fournit pas de base de référence des fokontany. Dans le MVP, ce champ est traité comme une **saisie libre** dans le formulaire (avec formatage Nom Propre) et stocké comme VARCHAR directement dans `submissions.fokontany` (pas de table de référence, pas de FK). La création d'une table `fokontany` pourra être envisagée dans une version ultérieure si le besoin d'auto-complétion se fait sentir.

---

### B. Gestion des Utilisateurs et Études

#### `agents`
- `matricule` : VARCHAR (PK, Unique)
- `name` : VARCHAR (Nom complet du PNP)

#### `studies`
- `id` : UUID / Integer (PK)
- `name` : VARCHAR (Nom de l'étude)

---

### C. Collecte de Données (La table principale)

#### `submissions`
Cette table stocke les questionnaires validés. Sur mobile, elle est scellée après sauvegarde.

| Champ | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID (PK) | Identifiant unique généré sur le mobile pour éviter les doublons lors de la sync. |
| `agent_matricule` | VARCHAR (FK) | Référence à `agents.matricule` |
| `study_id` | UUID (FK) | Référence à `studies.id` (pré-rempli ou sais libre avec Nom Propre dans le MVP) |
| `respondent_name` | VARCHAR | Nom du répondant / Point de Vente (PDV) |
| `questionnaire_no` | VARCHAR | Numéro du questionnaire (Forcé en MAJUSCULES) |
| `district_id` | UUID (FK) | Référence au district sélectionné |
| `commune_id` | UUID (FK) | Référence à la commune sélectionnée |
| `fokontany` | VARCHAR | Saisie libre (formatage Nom Propre) |
| `captured_at` | TIMESTAMP | Heure exacte de capture (système + validation NTP) |
| `latitude` | DECIMAL | Coordonnées GPS captées |
| `longitude` | DECIMAL | Coordonnées GPS captées |
| `accuracy` | DECIMAL | Précision du GPS en mètres |
| `is_mock_location` | BOOLEAN | Indicateur si un Fake GPS a été détecté lors de la capture |
| `is_network_time_valid` | BOOLEAN | Indicateur si l'heure réseau correspondait à l'heure système |
| `sync_status` | VARCHAR | Statut : `PENDING` (local uniquement), `SYNCED` (envoyé au serveur) |
| `created_at` | TIMESTAMP | Date de création de l'enregistrement |

### D. Configuration et Activation (Local uniquement)

#### `app_config`
Cette table stocke l'état d'activation de l'appareil. Elle est gérée localement sur le mobile.

| Champ | Type | Description |
| :--- | :--- | :--- |
| `key` | VARCHAR (PK) | Clé de configuration (ex: 'activation_status', 'max_quota', 'current_count') |
| `value` | VARCHAR | Valeur associée |

**Exemple de configuration :**
- `is_activated` : `true` / `false`
- `max_quota` : `50` (Nombre de questionnaires autorisés)
- `current_count` : `12` (Nombre de questionnaires déjà validés)
- `master_password_hash` : Hash du mot de passe défini lors de l'installation |

### Stockage Mobile (SQLite)
- **Immuabilité** : Une fois qu'une entrée est insérée dans `submissions` avec le statut `SYNCED` ou après la clôture du formulaire, aucune modification n'est permise via l'interface utilisateur.
- **Indexation** : Index sur `sync_status` pour optimiser le travail du Worker de synchronisation.
- **Cache** : Les tables `districts`, `communes` et `fokontany` sont stockées localement pour permettre le fonctionnement 100% hors-ligne.

### Stockage Serveur (PostgreSQL)
- **Intégrité** : Contraintes de clés étrangères strictes pour garantir que chaque soumission est liée à un agent, une étude et un lieu valide.
- **Audit** : Conservation des colonnes `is_mock_location` et `is_network_time_valid` pour permettre au superviseur de filtrer les données suspectes dans le dashboard.
- **Export** : Vue optimisée pour l'export CSV/Excel regroupant les noms (JOIN) plutôt que les IDs.

---

## 2. Stockage Fichier (MVP Actuel)

En attendant la mise en place de PostgreSQL, le projet utilise un **stockage fichier JSON** :
- `Controle/backend/submissions.json` : tableau de toutes les soumissions.
- `Controle/backend/geography.json` : districts + communes avec bornes GPS.

**Format d'une soumission (tel que stocké dans `submissions.json`) :**
```json
{
  "id": "uuid-v4",
  "agent_matricule": "PNP-001",
  "agent_name": "Rakoto Jean",
  "study_name": "Étude Pilote Marché Central",
  "respondent_name": "Épicerie Ralaivao",
  "questionnaire_no": "Q-001",
  "district_id": "dist-tana-ville",
  "commune_id": "com-cu1",
  "fokontany": "Andohalo",
  "systemTime": "2026-06-23T08:30:00.000Z",
  "latitude": -18.895,
  "longitude": 47.525,
  "captured_at": "2026-06-23T08:30:00.000Z",
  "received_at": "2026-06-23T08:30:01.234Z",
  "server_verified": true
}
```

**Notes :**
- `server_verified: true` indique que le serveur a validé la conformité Geofencing.
- Tous les champs texte ont été formatés en **Nom Propre** par le client avant envoi.
- Si l'application tourne en `file://` (mode local), les entrées sont d'abord stockées dans `localStorage` puis renvoyées au serveur ; les entrées synchronisées sont marquées `_synced: true` dans le localStorage uniquement (jamais écrites dans `submissions.json`).
