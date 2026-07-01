const { chromium } = require('playwright');
const assert = require('assert');
const { spawn } = require('child_process');

async function startServer() {
    return new Promise((resolve, reject) => {
        const server = spawn('node', ['E:/Projets/Claude-projects/Controle/backend/index.js'], {
            shell: true
        });
        server.stdout.on('data', (data) => {
            if (data.toString().includes('Controle Backend running')) {
                resolve(server);
            }
        });
        server.stderr.on('data', (data) => console.error(`Server Error: ${data}`));
        setTimeout(() => reject(new Error('Server start timeout')), 10000);
    });
}

async function runCascadeTests() {
    console.log('🚀 Starting Cascade District/Commune Tests...');
    let serverProcess;

    try {
        serverProcess = await startServer();

        const browser = await chromium.launch();
        const page = await browser.newPage();

        await page.goto('http://127.0.0.1:3001/agent.html');
        await page.waitForTimeout(1000);

        // 1. Activer l'appareil
        console.log('Test 1: Activation...');
        await page.fill('#masterPwd', 'admin');
        await page.fill('#maxQuota', '10');
        await page.click('#activateBtn');
        await page.waitForTimeout(500);

        const mainAppVisible = await page.locator('#mainApp').isVisible();
        assert.strictEqual(mainAppVisible, true);
        console.log('✅ App activated!');

        // 2. Vérifier que les districts sont chargés
        console.log('Test 2: Districts loaded...');
        await page.waitForTimeout(1000);
        const districtOptions = await page.locator('#district_id option').count();
        console.log(`Found ${districtOptions} options in district dropdown.`);
        assert.ok(districtOptions >= 3, "Le district dropdown devrait avoir au moins 3 options (placeholder + Tana Ville + Périphérie)");

        const tanaExists = await page.locator('#district_id').locator('text=Tana Ville').count();
        assert.strictEqual(tanaExists, 1);
        console.log('✅ Districts loaded (Tana Ville & Périphérie)');

        // 3. Tester la cascade : sélectionner Tana Ville
        console.log('Test 3: Cascade - Selecting Tana Ville...');
        await page.selectOption('#district_id', 'dist-tana-ville');
        await page.waitForTimeout(300);

        const communeDisabled = await page.locator('#commune_id').isDisabled();
        assert.strictEqual(communeDisabled, false, "Le dropdown des communes doit être activé");
        console.log('✅ Commune dropdown is enabled!');

        const communeOptions = await page.locator('#commune_id option').count();
        console.log(`Found ${communeOptions} commune options.`);
        assert.ok(communeOptions >= 5, "Tana Ville doit avoir au moins 5 communes");

        // 4. Tester la cascade : changer pour Périphérie
        console.log('Test 4: Cascade - Switching to Périphérie...');
        await page.selectOption('#district_id', 'dist-peripherie');
        await page.waitForTimeout(300);

        const newCommunes = await page.locator('#commune_id option').count();
        console.log(`Found ${newCommunes} communes in Périphérie.`);
        assert.ok(newCommunes >= 4, "Périphérie doit avoir au moins 4 communes");

        const amboExists = await page.locator('#commune_id').locator('text=Ambohimanambola').count();
        assert.strictEqual(amboExists, 1);
        console.log('✅ Cascade works perfectly!');

        // 5. Vérifier que le Fokontany est en saisie libre
        console.log('Test 5: Fokontany is a free text input...');
        const fokontanyTagName = await page.locator('#fokontany').evaluate(el => el.tagName.toLowerCase());
        assert.strictEqual(fokontanyTagName, 'input');
        console.log('✅ Fokontany is a free text input.');

        await browser.close();
        console.log('\n🎉 All Cascade Tests Passed Successfully!');
    } catch (error) {
        console.error('\n❌ Cascade Test Failed:');
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

runCascadeTests();