/**
 * Module géographique : Districts, Communes, bornes GPS.
 *
 * Source de vérité unique : backend/geography.json
 * Utilisé à la fois par le backend (validation geofencing) et l'API.
 */

const fs = require('fs');
const path = require('path');

const GEOGRAPHY_FILE = path.join(__dirname, '..', 'backend', 'geography.json');

let _cache = null;

function load() {
    if (_cache) return _cache;
    try {
        const content = fs.readFileSync(GEOGRAPHY_FILE, 'utf8');
        _cache = JSON.parse(content);
    } catch (err) {
        console.error('[geography] Erreur de chargement:', err.message);
        _cache = [];
    }
    return _cache;
}

/**
 * Vérifie si une position est dans les bornes d'une commune.
 * @param {number} lat
 * @param {number} lng
 * @param {Object} commune - { lat_min, lat_max, long_min, long_max }
 * @returns {boolean}
 */
function isWithinBounds(lat, lng, commune) {
    return lat >= commune.lat_min && lat <= commune.lat_max &&
           lng >= commune.long_min && lng <= commune.long_max;
}

/**
 * Trouve une commune par son ID.
 * @param {string} communeId
 * @returns {Object|null}
 */
function findCommune(communeId) {
    const data = load();
    for (const dist of data) {
        const found = dist.communes.find(c => c.id === communeId);
        if (found) return found;
    }
    return null;
}

module.exports = {
    load,
    isWithinBounds,
    findCommune
};
