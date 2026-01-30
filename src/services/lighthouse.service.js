const chromeLauncher = require('chrome-launcher');

const runLighthouse = async (url) => {
    // Dynamic import for ESM-only lighthouse package
    const { default: lighthouse } = await import('lighthouse');

    if (!process.env.CHROME_PATH) {
        throw new Error("CHROME_PATH environment variable is not set. Cannot launch Chrome.");
    }

    let chrome;
    try {
        console.log(`[Lighthouse] Attempting to launch Chrome from: ${process.env.CHROME_PATH}`);
        chrome = await chromeLauncher.launch({
            chromeFlags: ['--headless', '--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--disable-dev-shm-usage'],
            chromePath: process.env.CHROME_PATH
        });

        const options = {
            logLevel: 'info',
            output: 'json',
            onlyCategories: ['performance', 'seo', 'accessibility', 'best-practices'],
            port: chrome.port
        };

        console.log(`[Lighthouse] launching Chrome for ${url} on port ${chrome.port}`);
        const runnerResult = await lighthouse(url, options);

        // Extract key metrics
        const report = JSON.parse(runnerResult.report);
        const audits = report.audits;

        console.log(`[Lighthouse] Raw Audits Keys:`, Object.keys(audits).filter(k => k.includes('paint') || k.includes('shift') || k.includes('response')));

        const metrics = {
            performanceScore: (report.categories?.performance?.score || 0) * 100,
            seoScore: (report.categories?.seo?.score || 0) * 100,
            lcp: audits['largest-contentful-paint']?.displayValue || 'N/A',
            cls: audits['cumulative-layout-shift']?.displayValue || 'N/A',
            inp: audits['interaction-to-next-paint']?.displayValue || 'N/A',
            ttfb: audits['server-response-time']?.displayValue || 'N/A',
            fcp: audits['first-contentful-paint']?.displayValue || 'N/A',
            si: audits['speed-index']?.displayValue || 'N/A',
            tbt: audits['total-blocking-time']?.displayValue || 'N/A',
        };

        console.log(`[Lighthouse] Extracted Metrics:`, metrics);

        return { rawReport: report, metrics };

    } catch (error) {
        console.error("Lighthouse run failed:", error);
        throw error;
    } finally {
        if (chrome) {
            try {
                await chrome.kill();
                console.log("[Lighthouse] Chrome process killed.");
            } catch (err) {
                console.error("[Lighthouse] Failed to kill Chrome process:", err);
            }
        }
    }
};

module.exports = { runLighthouse };
