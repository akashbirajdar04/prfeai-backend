const Session = require('../models/sessionmodel');
const { runLighthouse } = require('./lighthouse.service');
const { uploadJSON } = require('./cloudinary.service');

/**
 * Service for managing analysis sessions and orchestrating Lighthouse audits
 */
const analysisService = {
    /**
     * Start a new Lighthouse analysis job
     */
    startLighthouseJob: async (sessionId, url) => {
        try {
            console.log(`[AnalysisService] [${sessionId}] Starting Lighthouse for ${url}...`);
            const { rawReport, metrics } = await runLighthouse(url);

            console.log(`[AnalysisService] [${sessionId}] Uploading report...`);
            const lhUrl = await uploadJSON(rawReport, 'lighthouse_reports');

            await Session.findByIdAndUpdate(sessionId, {
                status: 'waiting_for_telemetry',
                'artifacts.lighthouseReportUrl': lhUrl,
                'metrics.performance': {
                    score: metrics.performanceScore,
                    lcp: metrics.lcp,
                    cls: metrics.cls,
                    inp: metrics.inp,
                    ttfb: metrics.ttfb,
                    fcp: metrics.fcp,
                    si: metrics.si,
                    tbt: metrics.tbt
                },
                'metrics.seo': {
                    score: metrics.seoScore,
                    issues: []
                }
            });

            console.log(`[AnalysisService] [${sessionId}] Lighthouse Job Finished.`);
            return { lhUrl, metrics };
        } catch (error) {
            console.error(`[AnalysisService] [${sessionId}] failure:`, error);
            await Session.findByIdAndUpdate(sessionId, {
                status: 'failed',
                'error.message': error.message,
                'error.stack': error.stack
            });
            throw error;
        }
    }
};

module.exports = analysisService;
