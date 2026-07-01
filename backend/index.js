const express = require('express');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(express.json());

const dashboardPath = path.resolve(__dirname, '../dashboard');
app.use(express.static(dashboardPath));

app.get('/', (req, res) => {
    res.sendFile(path.join(dashboardPath, 'index.html'));
});

const GEOGRAPHY_DATA = JSON.parse(fs.readFileSync(path.join(__dirname, 'geography.json'), 'utf8'));
const submissionsFile = path.join(__dirname, 'submissions.json');

function isWithinBounds(lat, long, bounds) {
    return lat >= bounds.lat_min && lat <= bounds.lat_max &&
           long >= bounds.long_min && long <= bounds.long_max;
}

app.post('/api/submissions', (req, res) => {
    const submission = req.body;
    if (!submission.agent_matricule || !submission.commune_id || !submission.latitude || !submission.longitude || !submission.fokontany) {
        return res.status(400).json({ error: 'Données critiques manquantes.' });
    }

    let commune = null;
    for (const dist of GEOGRAPHY_DATA) {
        const found = dist.communes.find(c => c.id === submission.commune_id);
        if (found) {
            commune = found;
            break;
        }
    }

    if (!commune) return res.status(404).json({ error: 'Commune non reconnue.' });

    if (!isWithinBounds(submission.latitude, submission.longitude, commune)) {
        return res.status(422).json({ error: 'Geofencing violation: Position hors zone', fraud_detected: true });
    }

    let submissions = [];
    if (fs.existsSync(submissionsFile)) {
        submissions = JSON.parse(fs.readFileSync(submissionsFile, 'utf8'));
    }
    const record = { ...submission, id: submission.id || uuidv4(), received_at: new Date().toISOString(), server_verified: true };
    submissions.push(record);
    fs.writeFileSync(submissionsFile, JSON.stringify(submissions, null, 2));
    return res.status(201).json({ message: 'Sauvegarde réussie', id: record.id });
});

app.get('/api/geography', (req, res) => {
    res.json(GEOGRAPHY_DATA);
});

app.get('/api/submissions', (req, res) => {
    if (!fs.existsSync(submissionsFile)) return res.json([]);
    res.json(JSON.parse(fs.readFileSync(submissionsFile, 'utf8')));
});

app.get('/api/export', (req, res) => {
    if (!fs.existsSync(submissionsFile)) return res.status(404).send('Aucune donnée');
    const data = JSON.parse(fs.readFileSync(submissionsFile, 'utf8'));
    const headers = ['ID', 'Agent', 'Questionnaire', 'Commune', 'Fokontany', 'Latitude', 'Longitude', 'Captured At', 'Verified'];
    const rows = data.map(s => [s.id, s.agent_matricule, s.questionnaire_no, s.commune_id, s.fokontany, s.latitude, s.longitude, s.captured_at, s.server_verified].join(','));
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=export.csv');
    res.status(200).send([headers.join(','), ...rows].join('\n'));
});

const PORT = 3001;
app.listen(PORT, () => console.log(`Controle Backend running on http://localhost:${PORT}`));
