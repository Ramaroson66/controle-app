/**
 * SyncWorker.js
 * Manages background synchronization of local data to the server.
 */

const axios = require('axios');
const LocalStorage = require('./storage/LocalStorage');

class SyncWorker {
    constructor(apiBaseUrl) {
        this.apiBaseUrl = apiBaseUrl;
        this.storage = new LocalStorage();
        this.isSyncing = false;
    }

    /**
     * Triggers a synchronization cycle.
     * In a real app, this would be called by Android's WorkManager.
     */
    async sync() {
        if (this.isSyncing) {
            console.log('Sync already in progress...');
            return;
        }

        this.isSyncing = true;
        console.log('📡 SyncWorker: Starting synchronization cycle...');

        const pending = this.storage.getPendingSubmissions();
        if (pending.length === 0) {
            console.log('SyncWorker: No pending data to sync.');
            this.isSyncing = false;
            return;
        }

        console.log(`SyncWorker: Found ${pending.length} pending records.`);

        let successCount = 0;
        let failureCount = 0;

        for (const record of pending) {
            try {
                const response = await axios.post(`${this.apiBaseUrl}/api/submissions`, record);
                if (response.status === 201) {
                    this.storage.updateSyncStatus(record.id, 'SYNCED');
                    successCount++;
                }
            } catch (error) {
                console.error(`SyncWorker: Failed to sync record ${record.id}: ${error.message}`);
                failureCount++;
                // We keep the record as PENDING for the next retry
            }
        }

        console.log(`SyncWorker: Cycle completed. Success: ${successCount}, Failures: ${failureCount}`);
        this.isSyncing = false;
    }
}

module.exports = SyncWorker;
