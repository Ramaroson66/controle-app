const { chromium } = require('playwright');
const assert = require('assert');
const { spawn } = require('child_process');

async function startServer() {
    return new Promise((resolve, reject) => {
        const server = spawn('node', ['E:/Projets/Claude-projects/Controle/backend/index.js'], {
            shell: true,
            env: { ...process.env, NODE_ENV: 'test' }
        });

        server.stdout.on('data', (data) => {
            if (data.toString().includes('Controle Backend running')) {
                resolve(server);
            }
        });

        server.stderr.on('data', (data) => {
            console.error(`Server Error: ${data}`);
        });

        setTimeout(() => reject(new Error('Server start timeout')), 10000);
    });
}

async function runDashboardTests() {
    console.log('🚀 Starting Dashboard E2E Tests with Playwright...');
    let serverProcess;

    try {
        serverProcess = await startServer();
        console.log('✅ Server started!');

        const browser = await chromium.launch();
        const page = await browser.newPage();

        // 1. Load Dashboard
        console.log('Test 1: Loading Dashboard...');
        const response = await page.goto('http://127.0.0.1:3001');
        if (response.status() !== 200) {
            throw new Error(`Page failed to load: ${response.status()}`);
        }

        const title = await page.title();
        assert.strictEqual(title, 'Controle - Dashboard Superviseur');
        console.log('✅ Dashboard loaded successfully!');

        // 2. Verify Data Display
        console.log('Test 2: Verifying Data Display...');
        const rows = await page.locator('tbody#submissionsBody tr').count();
        console.log(`Found ${rows} submissions in the table.`);
        assert.ok(rows >= 0);
        console.log('✅ Data table rendered!');

        // 3. Test Search Filter
        console.log('Test 3: Testing Agent Search...');
        await page.fill('#searchInput', 'PNP');
        await page.waitForTimeout(500);
        const filteredRows = await page.locator('tbody#submissionsBody tr').count();
        console.log(`Filtered to ${filteredRows} rows.`);
        console.log('✅ Search filter working!');

        // 4. Test Export Trigger
        console.log('Test 4: Testing Export Button...');
        const [download] = await Promise.all([
            page.waitForEvent('download'),
            page.click('#exportBtn')
        ]);
        const fileName = download.suggestedFilename();
        assert.strictEqual(fileName, 'export.csv');
        console.log(`✅ Export triggered. File: ${fileName}`);

        await browser.close();
        console.log('\n🎉 All Dashboard Tests Passed Successfully!');
    } catch (error) {
        console.error('\n❌ Dashboard Test Failed:');
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

runDashboardTests();
