const ValidationEngine = require('./ValidationEngine');
const fs = require('fs');
const path = require('path');
const assert = require('assert');

// Load communes data from the canonical source (geography.json) and flatten it
const GEOGRAPHY = JSON.parse(fs.readFileSync(path.join(__dirname, '../backend/geography.json'), 'utf8'));
const COMMUNES_DATA = GEOGRAPHY.flatMap(d => d.communes);
const engine = new ValidationEngine(COMMUNES_DATA);

async function runTests() {
    console.log('🚀 Starting Mobile Logic Unit Tests...');

    const results = [];
    const testCase = (description, fn) => {
        try {
            fn();
            results.push({ description, status: '✅ PASSED' });
        } catch (e) {
            results.push({ description, status: '❌ FAILED', error: e.message });
        }
    };

    // --- TIME VALIDATION TESTS ---

    const mockNetworkTime = new Date();
    mockNetworkTime.setHours(10, 0, 0); // 10:00 AM (Valid time)

    testCase('Valid time (10 AM)', () => {
        const sysTime = new Date();
        sysTime.setHours(10, 0, 0);
        const res = engine.validateTime(sysTime, mockNetworkTime);
        assert.strictEqual(res.allowed, true);
    });

    testCase('Fraud: System time offset > 5min', () => {
        const sysTime = new Date();
        sysTime.setHours(10, 10, 0); // 10 min difference
        const res = engine.validateTime(sysTime, mockNetworkTime);
        assert.strictEqual(res.allowed, false);
        assert.ok(res.error.includes('non synchronisée'));
    });

    testCase('Forbidden: Before 07:00', () => {
        const sysTime = new Date();
        sysTime.setHours(6, 30, 0);
        const netTime = new Date();
        netTime.setHours(6, 30, 0);
        const res = engine.validateTime(sysTime, netTime);
        assert.strictEqual(res.allowed, false);
        assert.ok(res.error.includes('avant 07h00'));
    });

    testCase('Forbidden: After 19:00', () => {
        const sysTime = new Date();
        sysTime.setHours(20, 0, 0);
        const netTime = new Date();
        netTime.setHours(20, 0, 0);
        const res = engine.validateTime(sysTime, netTime);
        assert.strictEqual(res.allowed, false);
        assert.ok(res.error.includes('après 19h00'));
    });

    testCase('Forbidden: Lunch break (12:15)', () => {
        const sysTime = new Date();
        sysTime.setHours(12, 15, 0);
        const netTime = new Date();
        netTime.setHours(12, 15, 0);
        const res = engine.validateTime(sysTime, netTime);
        assert.strictEqual(res.allowed, false);
        assert.ok(res.error.includes('Pause méridienne'));
    });

    // --- LOCATION VALIDATION TESTS ---

    testCase('Valid Location (In Bounds)', () => {
        const res = engine.validateLocation(-18.925, 47.505, 'com-cu4', 3.0);
        assert.strictEqual(res.allowed, true);
    });

    testCase('Fraud: Out of Bounds', () => {
        const res = engine.validateLocation(-10.0, 10.0, 'com-cu4', 2.0);
        assert.strictEqual(res.allowed, false);
        assert.ok(res.error.includes('pas sur le lieu indiqué'));
    });

    testCase('Fraud: Low Accuracy (>= 4m)', () => {
        const res = engine.validateLocation(-18.925, 47.505, 'com-cu4', 5.0);
        assert.strictEqual(res.allowed, false);
        assert.ok(res.error.includes('Précision GPS insuffisante'));
    });

    // --- EXECUTION DELAY TESTS ---

    testCase('Valid Delay (> 45min)', () => {
        const lastTime = new Date();
        lastTime.setMinutes(lastTime.getMinutes() - 50);
        const res = engine.validateExecutionDelay(lastTime);
        assert.strictEqual(res.allowed, true);
    });

    testCase('Fraud: Short Delay (< 45min)', () => {
        const lastTime = new Date();
        lastTime.setMinutes(lastTime.getMinutes() - 20);
        const res = engine.validateExecutionDelay(lastTime);
        assert.strictEqual(res.allowed, false);
        assert.ok(res.error.includes('Attendez l\'heure exacte'));
    });

    // Print Results
    console.log('\n--- TEST RESULTS ---');
    results.forEach(r => console.log(`${r.status} ${r.description}`));

    const failed = results.filter(r => r.status === '❌ FAILED').length;
    if (failed > 0) {
        console.log(`\n❌ ${failed} tests failed!`);
        process.exit(1);
    } else {
        console.log('\n🎉 All Mobile Logic Tests Passed Successfully!');
        process.exit(0);
    }
}

runTests();
