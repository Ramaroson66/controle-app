/**
 * Module de stockage des soumissions.
 *
 * Compatible :
 * - En local : utilise un fichier JSON persistant (backend/submissions.json)
 * - Sur Vercel : utilise /tmp (éphémère, juste pour la démo)
 *
 * Pour une vraie persistance en production, remplacer par Vercel KV, Postgres, ou MongoDB.
 */

const fs = require('fs');
const path = require('path');

const IS_VERCEL = !!process.env.VERCEL;
const SUBMISSIONS_FILE = IS_VERCEL
    ? '/tmp/submissions.json'
    : path.join(__dirname, '..', 'backend', 'submissions.json');

/**
 * Lit toutes les soumissions depuis le stockage.
 * @returns {Array} Liste des soumissions
 */
function readAll() {
    try {
        if (!fs.existsSync(SUBMISSIONS_FILE)) return [];
        const content = fs.readFileSync(SUBMISSIONS_FILE, 'utf8');
        return JSON.parse(content);
    } catch (err) {
        console.error('[storage] Erreur de lecture:', err.message);
        return [];
    }
}

/**
 * Ajoute une nouvelle soumission.
 * @param {Object} submission - La soumission à ajouter
 * @returns {Object} La soumission enregistrée (avec id, received_at, server_verified)
 */
function add(submission) {
    const submissions = readAll();
    const record = {
        ...submission,
        id: submission.id || require('uuid').v4(),
        received_at: new Date().toISOString(),
        server_verified: true
    };
    submissions.push(record);
    writeAll(submissions);
    return record;
}

/**
 * Écrit la liste complète des soumissions.
 * @param {Array} submissions
 */
function writeAll(submissions) {
    try {
        const dir = path.dirname(SUBMISSIONS_FILE);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(SUBMISSIONS_FILE, JSON.stringify(submissions, null, 2));
    } catch (err) {
        console.error('[storage] Erreur d\'écriture:', err.message);
    }
}

/**
 * Indique si on est en environnement Vercel (pour adapter les logs).
 */
function isVercel() {
    return IS_VERCEL;
}

module.exports = {
    readAll,
    add,
    writeAll,
    isVercel,
    SUBMISSIONS_FILE
};
