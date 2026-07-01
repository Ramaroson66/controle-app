/**
 * LocalStorage.js
 * Simulates a SQLite database for the mobile app.
 */

const fs = require('fs');
const path = require('path');

class LocalStorage {
    constructor() {
        this.dbPath = path.join(__dirname, 'local_db.json');
        this.initDb();
    }

    initDb() {
        if (!fs.existsSync(this.dbPath)) {
            fs.writeFileSync(this.dbPath, JSON.stringify({
                submissions: [],
                app_config: {
                    is_activated: false,
                    max_quota: 0,
                    current_count: 0,
                    master_password: 'admin' // Default master password for simulation
                }
            }, null, 2));
        }
    }

    getDb() {
        return JSON.parse(fs.readFileSync(this.dbPath, 'utf8'));
    }

    saveDb(db) {
        fs.writeFileSync(this.dbPath, JSON.stringify(db, null, 2));
    }

    getConfig() {
        return this.getDb().app_config;
    }

    saveConfig(config) {
        const db = this.getDb();
        db.app_config = config;
        this.saveDb(db);
    }

    incrementCount() {
        const db = this.getDb();
        db.app_config.current_count++;
        this.saveDb(db);
        return db.app_config.current_count;
    }

    saveSubmission(submission) {
        const db = this.getDb();
        const record = {
            ...submission,
            sync_status: 'PENDING',
            created_at: new Date().toISOString()
        };
        db.submissions.push(record);
        this.saveDb(db);
        return record;
    }

    getPendingSubmissions() {
        const db = this.getDb();
        return db.submissions.filter(s => s.sync_status === 'PENDING');
    }

    updateSyncStatus(id, status) {
        const db = this.getDb();
        const index = db.submissions.findIndex(s => s.id === id);
        if (index !== -1) {
            db.submissions[index].sync_status = status;
            this.saveDb(db);
        }
    }

    clearAll() {
        // Reset the DB to a known clean state
        this.saveDb({
            submissions: [],
            app_config: {
                is_activated: false,
                max_quota: 0,
                current_count: 0,
                master_password: 'admin'
            }
        });
    }
}

module.exports = LocalStorage;
