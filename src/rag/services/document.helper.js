/**
 * Helper to convert raw performance data into human-readable RAG documents
 */
const documentHelper = {
    /**
     * Convert API latency data to human-readable text
     * @param {Object} item Aggregated API metric
     * @returns {string} Human-readable text
     */
    prepareApiDoc: (item) => {
        const { endpoint, method, avgLatency, bestLatency, p95, successRate, hitCount, isSlow } = item;

        return `
Service: Web API
Endpoint: ${method} ${endpoint}
Status: ${isSlow ? 'Slow' : 'Optimal'} performance detected.

Metrics:
- Average latency: ${avgLatency} ms
- Best latency (fastest): ${bestLatency} ms
- P95 latency (worst 5%): ${p95} ms
- Success rate: ${successRate}%
- Total requests captured: ${hitCount}

Observations:
The ${method} ${endpoint} endpoint has an average response time of ${avgLatency} ms. 
${isSlow ? 'This endpoint is currently exceeding the performance threshold.' : 'Performance is within acceptable limits.'}
${successRate < 95 ? `Warning: High error rate detected (${100 - successRate}%).` : 'Stability is high with a low error rate.'}
`.trim();
    },

    /**
     * Convert Lighthouse metrics to human-readable text
     * @param {Object} metrics Lighthouse metrics object
     * @returns {string} Human-readable text
     */
    prepareLighthouseDoc: (metrics) => {
        const { lcp, cls, inp, ttfb, fcp, si, tbt } = metrics;

        return `
Service: Frontend Performance Scan (Lighthouse)
Type: Core Web Vitals & Lab Data

Metrics:
- Largest Contentful Paint (LCP): ${lcp?.value || 'N/A'} ${lcp?.unit || 'ms'} (${lcp?.score >= 0.9 ? 'Good' : 'Needs Improvement'})
- Cumulative Layout Shift (CLS): ${cls?.value || 'N/A'} (${cls?.score >= 0.9 ? 'Stable' : 'Unstable'})
- Interaction to Next Paint (INP): ${inp?.value || 'N/A'} ${inp?.unit || 'ms'}
- Time to First Byte (TTFB): ${ttfb?.value || 'N/A'} ${ttfb?.unit || 'ms'}
- First Contentful Paint (FCP): ${fcp?.value || 'N/A'} ${fcp?.unit || 'ms'}
- Speed Index: ${si?.value || 'N/A'} ${si?.unit || 'ms'}
- Total Blocking Time (TBT): ${tbt?.value || 'N/A'} ${tbt?.unit || 'ms'}

Observations:
Frontend performance analysis reveals an LCP of ${lcp?.value || 'N/A'}${lcp?.unit || 'ms'}. 
${ttfb?.value > 500 ? 'High TTFB suggests server-side delays or network latency.' : 'Server response time (TTFB) is healthy.'}
${cls?.value > 0.1 ? 'Significant layout shifts (CLS) detected, which may frustrate users.' : 'The page layout is visually stable.'}
`.trim();
    }
};

module.exports = documentHelper;
