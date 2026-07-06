/**
 * GET /api/export
 * Exporte toutes les soumissions au format CSV.
 */
const storage = require('./_storage');

module.exports = (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'GET') return res.status(405).json({ error: 'Méthode non autorisée' });

    const data = storage.readAll();
    if (data.length === 0) return res.status(404).send('Aucune donnée');

    const headers = ['ID', 'Agent', 'Questionnaire', 'Commune', 'Fokontany', 'Latitude', 'Longitude', 'Captured At', 'Verified'];
    const rows = data.map(s => [
        s.id, s.agent_matricule, s.questionnaire_no,
        s.commune_id, s.fokontany,
        s.latitude, s.longitude, s.captured_at, s.server_verified
    ].join(','));

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=export.csv');
    return res.status(200).send([headers.join(','), ...rows].join('\n'));
};
