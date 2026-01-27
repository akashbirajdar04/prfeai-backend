const chromeLauncher = require('chrome-launcher');
const path = require('path');

async function testLighthouse() {
    console.log("--- DEBUG LIGHTHOUSE START ---");
    const url = 'https://www.google.com';

    console.log(`[Test] 1. Importing lighthouse...`);
    let lighthouse;
    try {
        const lighthouseModule = await import('lighthouse');
        lighthouse = lighthouseModule.default;
        console.log(`[Test] Lighthouse module imported.`);
    } catch (err) {
        console.error(`[Test] Failed to import lighthouse:`, err.message);
        return;
    }

    console.log(`[Test] 2. Launching Chrome...`);
    let chrome;
    try {
        chrome = await chromeLauncher.launch({
            chromeFlags: ['--headless', '--no-sandbox', '--disable-setuid-sandbox']
        });
        console.log(`[Test] Chrome launched on port: ${chrome.port}`);
    } catch (err) {
        console.error(`[Test] Failed to launch Chrome:`, err.message);
        console.log(`[Test] Suggestion: Check if Chrome is installed and in path.`);
        return;
    }

    const options = {
        logLevel: 'info',
        output: 'json',
        onlyCategories: ['performance'],
        port: chrome.port
    };

    try {
        console.log(`[Test] 3. Running Lighthouse on ${url}...`);
        const runnerResult = await lighthouse(url, options);
        console.log(`[Test] Lighthouse run completed.`);

        await chrome.kill();
        console.log(`[Test] Chrome killed.`);

        const report = JSON.parse(runnerResult.report);
        console.log(`[Test] Performance Score: ${report.categories.performance.score * 100}`);
        console.log(`--- DEBUG LIGHTHOUSE SUCCESS ---`);
    } catch (error) {
        console.error("[Test] Lighthouse run failed:", error);
        await chrome.kill();
        console.log(`--- DEBUG LIGHTHOUSE FAILED ---`);
    }
}

testLighthouse();
