/**
 * /api/submissions
 *  - POST : enregistre une nouvelle soumission (avec validation geofencing)
 *  - GET  : retourne toutes les soumissions
 */
const storage = require('./_storage');
const geography = require('./_geography');

module.exports = (req, res) => {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    // POST : nouvelle soumission
    if (req.method === 'POST') {
        const submission = req.body || {};

        // 1. Validation des champs critiques
        if (!submission.agent_matricule || !submission.commune_id ||
            !submission.latitude || !submission.longitude || !submission.fokontany) {
            return res.status(400).json({ error: 'Données critiques manquantes.' });
        }

        // 2. Vérification de la commune
        const commune = geography.findCommune(submission.commune_id);
        if (!commune) {
            return res.status(404).json({ error: 'Commune non reconnue.' });
        }

        // 3. Validation Geofencing (symétrie de validation côté serveur)
        if (!geography.isWithinBounds(submission.latitude, submission.longitude, commune)) {
            return res.status(422).json({
                error: 'Geofencing violation: Position hors zone',
                fraud_detected: true
            });
        }

        // 4. Sauvegarde
        const record = storage.add(submission);
        return res.status(201).json({ message: 'Sauvegarde réussie', id: record.id });
    }

    // GET : liste des soumissions
    if (req.method === 'GET') {
        return res.status(200).json(storage.readAll());
    }

    return res.status(405).json({ error: 'Méthode non autorisée' });
};
