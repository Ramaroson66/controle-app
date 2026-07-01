/**
 * ValidationEngine.js
 * Implements the strict business rules for the 'Controle' app.
 */

class ValidationEngine {
    constructor(communesData) {
        this.communesData = communesData;
    }

    /**
     * Validates the current time based on PRD rules.
     * @param {Date} systemTime - The time from the device clock.
     * @param {Date} networkTime - The trusted time from NTP.
     * @returns {{ allowed: boolean, error: string | null }}
     */
    validateTime(systemTime, networkTime) {
        // 1. Anti-Fraud: System vs Network Time Delta (5 min tolerance)
        const delta = Math.abs(systemTime.getTime() - networkTime.getTime());
        if (delta > 5 * 60 * 1000) {
            return { allowed: false, error: "Erreur : Heure système non synchronisée avec le réseau." };
        }

        const hour = systemTime.getHours();
        const minute = systemTime.getMinutes();
        const currentTimeInMinutes = hour * 60 + minute;

        // 2. Before 07:00
        if (currentTimeInMinutes < 7 * 60) {
            return { allowed: false, error: "Heure interdite : Collecte avant 07h00 non autorisée." };
        }

        // 3. After 19:00
        if (currentTimeInMinutes > 19 * 60) {
            return { allowed: false, error: "Heure interdite : Collecte après 19h00 non autorisée." };
        }

        // 4. Lunch Break (12:00 - 12:30)
        if (currentTimeInMinutes >= 12 * 60 && currentTimeInMinutes < 12 * 60 + 30) {
            return { allowed: false, error: "Heure interdite : Pause méridienne obligatoire (12h00 - 12h30)." };
        }

        return { allowed: true, error: null };
    }

    /**
     * Validates the GPS position based on Geofencing rules.
     * @param {number} lat - Captured latitude.
     * @param {number} long - Captured longitude.
     * @param {string} communeId - ID of the selected commune.
     * @param {number} accuracy - GPS accuracy in meters.
     * @returns {{ allowed: boolean, error: string | null }}
     */
    validateLocation(lat, long, communeId, accuracy) {
        // 1. Precision Check (Max 4 meters)
        if (accuracy >= 4.0) {
            return { allowed: false, error: "Précision GPS insuffisante. Veuillez vous déplacer ou attendre un meilleur signal." };
        }

        const commune = this.communesData.find(c => c.id === communeId);
        if (!commune) {
            return { allowed: false, error: "Commune non reconnue." };
        }

        // 2. Geofencing check
        const isLatValid = lat >= commune.lat_min && lat <= commune.lat_max;
        const isLongValid = long >= commune.long_min && long <= commune.long_max;

        if (!isLatValid || !isLongValid) {
            return { allowed: false, error: "Vous n'êtes pas sur le lieu indiqué." };
        }

        return { allowed: true, error: null };
    }

    /**
     * Checks the minimum execution delay between two submissions.
     * @param {Date} lastSubmissionTime - Time of the last recorded submission.
     * @returns {{ allowed: boolean, error: string | null }}
     */
    validateExecutionDelay(lastSubmissionTime) {
        if (!lastSubmissionTime) return { allowed: true, error: null };

        const now = new Date();
        const diffMinutes = (now.getTime() - lastSubmissionTime.getTime()) / (1000 * 60);

        if (diffMinutes < 45) {
            const remaining = Math.ceil(45 - diffMinutes);
            return { allowed: false, error: `Attendez l'heure exacte : ${remaining} minutes restantes avant la prochaine validation.` };
        }

        return { allowed: true, error: null };
    }
}

module.exports = ValidationEngine;
