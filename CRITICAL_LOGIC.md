# Fonctions Critiques : Validation Temps et Geofencing

Ce document décrit l'implémentation technique des règles de contrôle strictes demandées dans le PRD. Ces fonctions sont conçues pour être implémentées via des **Modules Natifs** (Kotlin/Swift) et orchestrées par React Native.

---

## 1. Contrôle du Temps (Module B)

### Logique de Validation
L'application capture l'heure du système et la compare à l'heure réseau (NTP) pour éviter toute modification manuelle de l'horloge.

#### Algorithme de Vérification :
```typescript
/**
 * Vérifie si l'heure actuelle est autorisée pour la collecte.
 * Retourne { allowed: boolean, error: string | null }
 */
function validateCurrentTime(systemTime: Date, networkTime: Date): ValidationResult {
    // 1. Anti-Fraude : Vérification de l'écart Temps Système vs Temps Réseau
    const timeDelta = Math.abs(systemTime.getTime() - networkTime.getTime());
    if (timeDelta > 5 * 60 * 1000) { // Plus de 5 minutes d'écart
        return { allowed: false, error: "Erreur : Heure système non synchronisée avec le réseau." };
    }

    const hour = systemTime.getHours();
    const minute = systemTime.getMinutes();
    const currentTimeInMinutes = hour * 60 + minute;

    // 2. Interdiction : Avant 07h00
    if (currentTimeInMinutes < 7 * 60) {
        return { allowed: false, error: "Heure interdite : Collecte avant 07h00 non autorisée." };
    }

    // 3. Interdiction : Après 19h00
    if (currentTimeInMinutes > 19 * 60) {
        return { allowed: false, error: "Heure interdite : Collecte après 19h00 non autorisée." };
    }

    // 4. Pause Méridienne : Entre 12h00 et 12h30
    if (currentTimeInMinutes >= 12 * 60 && currentTimeInMinutes < 12 * 60 + 30) {
        return { allowed: false, error: "Heure interdite : Pause méridienne obligatoire (12h00 - 12h30)." };
    }

    return { allowed: true, error: null };
}
```

### Contrôle du Délai Minimum (45 min)
Le système calcule l'intervalle entre la validation du questionnaire actuel et le dernier enregistré localement.

```typescript
function validateMinimumDelay(lastSubmissionTime: Date): ValidationResult {
    const now = new Date();
    const diffMinutes = (now.getTime() - lastSubmissionTime.getTime()) / (1000 * 60);

    if (diffMinutes < 45) {
        const remaining = Math.ceil(45 - diffMinutes);
        return { allowed: false, error: `Attendez l'heure exacte : ${remaining} minutes restantes avant la prochaine validation.` };
    }
    return { allowed: true, error: null };
}
```

---

## 2. Contrôle GPS et Geofencing (Module C)

### Logique de Geofencing
L'application compare la position captée avec les bornes min/max de la commune sélectionnée dans le formulaire.

#### Algorithme de Vérification :
```typescript
interface GeoBounds {
    latMin: number;
    latMax: number;
    longMin: number;
    longMax: number;
}

/**
 * Vérifie si la position captée se trouve dans les limites de la commune.
 * Retourne { isValid: boolean, error: string | null }
 */
function verifyGeofencing(currentPos: { lat: number, long: number }, bounds: GeoBounds): ValidationResult {
    const isLatValid = currentPos.lat >= bounds.latMin && currentPos.lat <= bounds.latMax;
    const isLongValid = currentPos.long >= bounds.longMin && currentPos.long <= bounds.longMax;

    if (!isLatValid || !isLongValid) {
        return { isValid: false, error: "Vous n'êtes pas sur le lieu indiqué." };
    }

    return { isValid: true, error: null };
}
```

---

## 3. Mesures Anti-Fraude (Module D)

Ces fonctions DOIVENT être implémentées au niveau natif pour être infaillibles.

### A. Détection de Fake GPS (Mock Locations)
**Android (Kotlin) :**
```kotlin
fun isMockLocation(location: Location): Boolean {
    return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
        location.isMock // Directement disponible depuis Android 12
    } else {
        location.isFromMockProvider // Pour les versions antérieures
    }
}
```

### B. Vérification de l'Heure Automatique
**Android (Kotlin) :**
```kotlin
fun isAutomaticTimeEnabled(context: Context): Boolean {
    return Settings.Global.getInt(context.contentResolver, Settings.Global.AUTO_TIME, 0) == 1
}
```

### C. Précision GPS
L'application doit refuser la capture si la précision est $\ge 4$ mètres.
```typescript
function validateGpsAccuracy(accuracy: number): boolean {
    return accuracy < 4.0; // Doit être inférieure à 4 mètres
}
```

---

## 4. Workflow de Validation Final (Séquence)

Lors du clic sur "Clôturer et Sauvegarder", la séquence suivante est exécutée :
1. **Check Natif** $\rightarrow$ `isAutomaticTimeEnabled()` $\rightarrow$ si False $\rightarrow$ Blocage.
2. **Check Natif** $\rightarrow$ `isMockLocation()` $\rightarrow$ si True $\rightarrow$ Blocage.
3. **Check GPS** $\rightarrow$ `validateGpsAccuracy()` $\rightarrow$ si False $\rightarrow$ Demande de recapture.
4. **Geofencing** $\rightarrow$ `verifyGeofencing()` $\rightarrow$ si False $\rightarrow$ Blocage + Vidage des champs GPS.
5. **Time Check** $\rightarrow$ `validateCurrentTime()` $\rightarrow$ si False $\rightarrow$ Blocage.
6. **Interval Check** $\rightarrow$ `validateMinimumDelay()` $\rightarrow$ si False $\rightarrow$ Blocage.
7. **Succès** $\rightarrow$ Verrouillage du formulaire $\rightarrow$ Sauvegarde SQLite $\rightarrow$ Marquage `PENDING` pour sync.

---

## 5. Gestion du Quota et Activation

L'application suit un cycle de vie "Activation $\rightarrow$ Utilisation $\rightarrow$ Expiration".

### Logique de Vérification du Quota
Avant d'autoriser l'ouverture du formulaire de saisie, l'application vérifie le droit d'accès.

```typescript
/**
 * Vérifie si l'application est activée et s'il reste du quota.
 * Retourne { canAccess: boolean, error: string | null }
 */
function checkAppAccess(config: AppConfig): ValidationResult {
    // 1. Vérification de l'activation
    if (!config.isActivated) {
        return { canAccess: false, error: "Application non activée. Veuillez contacter le superviseur." };
    }

    // 2. Vérification du quota
    if (config.currentCount >= config.maxQuota) {
        return { canAccess: false, error: "Quota de saisies atteint. Réactivation requise par le superviseur." };
    }

    return { canAccess: true, error: null };
}
```

### Logique d'Activation (Superviseur)
Le superviseur déverrouille l'application en saisissant le mot de passe maître et en définissant le quota.

```typescript
function activateApp(inputPassword: string, newQuota: number, masterPassword: string): ValidationResult {
    if (inputPassword !== masterPassword) {
        return { canAccess: false, error: "Mot de passe incorrect." };
    }

    // Mise à jour de la config locale
    config.isActivated = true;
    config.maxQuota = newQuota;
    config.currentCount = 0; // Reset du compteur lors d'une nouvelle activation

    return { canAccess: true, error: null };
}
```

---

## 6. Normalisation des Saisies Libres (Nom Propre)

Pour uniformiser les données collectées et éliminer les erreurs de saisie (`BOISSONS`, `raKoto`, `RAKOTO jean`), les champs texte libres subissent un reformatage automatique **au blur** (perte de focus) et **au moment de la soumission**.

```typescript
const ACRONYMS = ['PNP', 'PDV', 'CUA', 'CU', 'RN', 'RNI', 'EST', 'OUEST', 'NORD', 'SUD'];

function toProperName(str: string): string {
    if (!str) return str;
    return str.toLowerCase()
              .split(/(\s+|-|')/)
              .map((part, i) => {
                  if (i % 2 === 1) return part; // séparateurs
                  if (!part) return part;
                  const upper = part.toUpperCase();
                  if (ACRONYMS.includes(upper)) return upper;
                  return part.charAt(0).toUpperCase() + part.slice(1);
              })
              .join('');
}
```

**Champs concernés :** `agent_name`, `study_name`, `respondent_name`, `fokontany`.

**Exemples :**
- `"RAKOTO jean"` → `"Rakoto Jean"`
- `"EPICERIE ralaivao"` → `"Epicerie Ralaivao"`
- `"boissons ET pnp"` → `"Boissons Et PNP"`
- `"jean-pierre"` → `"Jean-Pierre"`
- `"d'arc"` → `"D'Arc"`

---

## 7. Stratégie de Résilience Réseau (Fallback Local)

Pour éviter la perte de données quand le serveur n'est pas joignable (serveur éteint, ouverture en `file://`, coupure réseau), une stratégie de **file d'attente locale** est implémentée côté client.

```typescript
async function submitWithFallback(payload) {
    try {
        // 1. Tenter de rejouer les soumissions en attente
        const pending = JSON.parse(localStorage.getItem('controle_local_submissions') || '[]');
        for (const sub of pending.filter(s => !s._synced)) {
            try {
                await fetch('/api/submissions', { method: 'POST', body: JSON.stringify(sub), headers: { 'Content-Type': 'application/json' } });
                sub._synced = true;
            } catch (e) { /* serveur toujours down */ }
        }
        localStorage.setItem('controle_local_submissions', JSON.stringify(pending));

        // 2. Soumettre la nouvelle donnée
        return await fetch('/api/submissions', { method: 'POST', body: JSON.stringify(payload), headers: { 'Content-Type': 'application/json' } });
    } catch (networkErr) {
        // 3. Fallback : stocker en local
        const localSubs = JSON.parse(localStorage.getItem('controle_local_submissions') || '[]');
        localSubs.push({ ...payload, id: 'local-' + Date.now(), server_verified: false });
        localStorage.setItem('controle_local_submissions', JSON.stringify(localSubs));
        return { ok: true, _local: true };
    }
}
```

**Bénéfice :** aucune perte de données même en cas d'utilisation accidentelle en `file://`. Synchronisation automatique à la reprise.
