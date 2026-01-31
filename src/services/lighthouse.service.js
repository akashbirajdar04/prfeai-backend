

const runLighthouse = async (url) => {
    // Dynamic import for ESM-only lighthouse package
    const { default: lighthouse } = await import('lighthouse');
    const puppeteer = require('puppeteer');
    const fs = require('fs');

    console.log(`[Lighthouse] Launching Puppeteer with executable: ${process.env.PUPPETEER_EXECUTABLE_PATH}`);

    const browser = await puppeteer.launch({
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
        headless: "new",
        args: [
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-dev-shm-usage",
            "--remote-debugging-port=9222"
        ]
    });

    try {
        // Connect Lighthouse to the existing browser port
        const port = 9222;
        const options = {
            logLevel: 'info',
            output: 'json',
            onlyCategories: ['performance', 'seo', 'accessibility', 'best-practices'],
            port: port
        };

        console.log(`[Lighthouse] Running analysis for ${url} on port ${port}`);
        const runnerResult = await lighthouse(url, options);

        // Extract key metrics
        const report = JSON.parse(runnerResult.report);
        const audits = report.audits;

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
        if (browser) {
            await browser.close();
            console.log("[Lighthouse] Browser closed.");
        }
    }
};

module.exports = { runLighthouse };
