const LocalStorage = require('./storage/LocalStorage');
const SyncWorker = require('./SyncWorker');
const assert = require('assert');
const { spawn } = require('child_process');

async function startServer() {
    return new Promise((resolve) => {
        const server = spawn('node', ['E:/Projets/Claude-projects/Controle/backend/index.js'], {
            shell: true
        });
        server.stdout.on('data', (data) => {
            if (data.toString().includes('Controle Backend running')) {
                resolve(server);
            }
        });
    });
}

async function runSyncTests() {
    console.log('🚀 Starting Offline-First Sync Tests...');
    let serverProcess;

    try {
        const storage = new LocalStorage();
        storage.clearAll();

        const worker = new SyncWorker('http://localhost:3001');

        // 1. SIMULATE OFFLINE MODE
        console.log('\nScenario 1: Device is Offline');
        // We do NOT start the server yet, simulating a network outage.

        const mockSubmission = {
            id: 'rec-001',
            agent_matricule: 'PNP001',
            commune_id: 'com-cu4',
            latitude: -18.925,
            longitude: 47.505,
            fokontany: 'Tsimbazaza',
            questionnaire_no: 'Q001'
        };

        storage.saveSubmission(mockSubmission);
        console.log('Saved record rec-001 to local storage (PENDING).');

        await worker.sync(); // Should fail as server is not running

        const pendingAfterFail = storage.getPendingSubmissions();
        assert.strictEqual(pendingAfterFail.length, 1);
        console.log('✅ Record remains PENDING during offline state.');

        // 2. SIMULATE ONLINE MODE
        console.log('\nScenario 2: Device goes Online');
        serverProcess = await startServer();
        console.log('✅ Backend server started.');

        await worker.sync();

        const pendingAfterSync = storage.getPendingSubmissions();
        assert.strictEqual(pendingAfterSync.length, 0);
        console.log('✅ All pending records synchronized successfully!');

        // 3. VERIFY DATA ON SERVER
        const axios = require('axios');
        const res = await axios.get('http://localhost:3001/api/submissions');
        const serverData = res.data;
        assert.ok(serverData.find(s => s.id === 'rec-001'));
        console.log('✅ Data verified on server!');

        console.log('\n🎉 All Offline-First Sync Tests Passed Successfully!');
    } catch (error) {
        console.error('\n❌ Sync Test Failed:');
        console.error(error);
        process.exit(1);
    } finally {
        if (serverProcess && serverProcess.pid) {
            try {
                process.kill(serverProcess.pid);
            } catch (e) {
                // Process already terminated
            }
        }
    }
}

runSyncTests();
