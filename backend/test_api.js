const axios = require('axios');
const assert = require('assert');

async function runTests() {
    console.log('🚀 Starting Backend Integration Tests...');
    const API_URL = 'http://localhost:3001/api/submissions';

    try {
        // TEST 1: Valid Submission (Agent Honest) - coords inside com-cu4 bounds
        console.log('Test 1: Valid Submission...');
        const res1 = await axios.post(API_URL, {
            agent_matricule: 'PNP001',
            commune_id: 'com-cu4',
            latitude: -18.925,
            longitude: 47.505,
            questionnaire_no: 'Q001',
            fokontany: 'Tsimbazaza',
            captured_at: new Date().toISOString()
        });
        assert.strictEqual(res1.status, 201);
        console.log('✅ Test 1 passed!');

        // TEST 2: Geofencing Violation (Agent in wrong place)
        console.log('Test 2: Geofencing Violation...');
        try {
            await axios.post(API_URL, {
                agent_matricule: 'PNP002',
                commune_id: 'com-cu4',
                latitude: -10.0, // Way outside
                longitude: 10.0,
                questionnaire_no: 'Q002',
                fokontany: 'Tsimbazaza',
                captured_at: new Date().toISOString()
            });
            throw new Error('Should have failed');
        } catch (err) {
            assert.strictEqual(err.response.status, 422);
            assert.strictEqual(err.response.data.fraud_detected, true);
            console.log('✅ Test 2 passed!');
        }

        // TEST 3: Missing Data
        console.log('Test 3: Missing Data...');
        try {
            await axios.post(API_URL, { agent_matricule: 'PNP003' });
            throw new Error('Should have failed');
        } catch (err) {
            assert.strictEqual(err.response.status, 400);
            console.log('✅ Test 3 passed!');
        }

        // TEST 4: Unknown commune
        console.log('Test 4: Unknown Commune...');
        try {
            await axios.post(API_URL, {
                agent_matricule: 'PNP004',
                commune_id: 'commune-1', // n'existe plus dans geography.json
                latitude: -18.925,
                longitude: 47.505,
                fokontany: 'Tsimbazaza',
                questionnaire_no: 'Q004',
                captured_at: new Date().toISOString()
            });
            throw new Error('Should have failed');
        } catch (err) {
            assert.strictEqual(err.response.status, 404);
            console.log('✅ Test 4 passed!');
        }

        console.log('\n🎉 All Backend Tests Passed Successfully!');
        process.exit(0);
    } catch (error) {
        console.error('\n❌ Test Failed:');
        console.error(error);
        process.exit(1);
    }
}

runTests();
