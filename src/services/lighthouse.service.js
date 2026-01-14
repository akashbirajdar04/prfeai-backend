const chromeLauncher = require('chrome-launcher');

const runLighthouse = async (url) => {
    // Dynamic import for ESM-only lighthouse package
    const { default: lighthouse } = await import('lighthouse');

    const chrome = await chromeLauncher.launch({ chromeFlags: ['--headless'] });
    const options = {
        logLevel: 'info',
        output: 'json',
        onlyCategories: ['performance', 'seo', 'accessibility', 'best-practices'],
        port: chrome.port
    };

    try {
        console.log(`[Lighthouse] launching Chrome for ${url}`);
        const runnerResult = await lighthouse(url, options);
        await chrome.kill();

        // Extract key metrics
        const report = JSON.parse(runnerResult.report);
        const audits = report.audits;

        const metrics = {
            performanceScore: report.categories.performance.score * 100,
            seoScore: report.categories.seo.score * 100,
            lcp: audits['largest-contentful-paint'].displayValue,
            cls: audits['cumulative-layout-shift'].displayValue,
            inp: audits['interaction-to-next-paint']?.displayValue || 'N/A', // Interaction to Next Paint
            ttfb: audits['server-response-time'].displayValue,
        };

        return { rawReport: report, metrics };
    } catch (error) {
        await chrome.kill();
        console.error("Lighthouse run failed:", error);
        throw error;
    }
};

module.exports = { runLighthouse };
