const fs = require('fs');
const path = require('path');
const OpenAI = require('openai');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const RAG_DOCS_PATH = path.join(__dirname, '../../../rag/docs');

// Ensure RAG directory exists
if (!fs.existsSync(RAG_DOCS_PATH)) {
    fs.mkdirSync(RAG_DOCS_PATH, { recursive: true });
}

const ragService = require('../../../rag/services/rag.service');

const aiService = {

    /**
     * Save latency data to RAG document store
     */
    storeLatencyForRAG: (sessionId, latencyData) => {
        const filePath = path.join(RAG_DOCS_PATH, `latency_${sessionId}.json`);
        fs.writeFileSync(filePath, JSON.stringify(latencyData, null, 2));
        console.log(`[RAG] Stored latency context for session ${sessionId}`);
        return filePath;
    },

    /**
     * Generate optimization analysis using RAG system
     * @param {Object} metrics Current session metrics
     * @param {string} sessionId Current session ID
     * @param {Object} previousMetrics Optional metrics from a previous run for comparison
     */
    analyze: async (metrics, sessionId, previousMetrics = null) => {
        try {
            console.log(`[AI-PERF] Generating Strict One-Liner RAG analysis for session ${sessionId}`);

            let prompt = "Perform a full system performance analysis. Output sections exactly: Backend:, Frontend:, and Technical:. Reference API metrics and frontend vitals.";

            if (previousMetrics) {
                prompt += `\n\nCRITICAL: Compare these current metrics with the previous run:
                Current LCP: ${metrics.lcp}, Previous: ${previousMetrics.lcp}
                Current Score: ${metrics.performanceScore}, Previous: ${previousMetrics.performanceScore}
                Mention if performance is improving or degrading in one of the bullets.`;
            }

            const fullReport = await ragService.ask(sessionId, prompt);

            // Parsing sections from the LLM output
            const parseSection = (sectionName) => {
                const regex = new RegExp(`${sectionName}:([\\s\\S]*?)(?=(Backend:|Frontend:|Technical:|$))`, 'i');
                const match = fullReport.match(regex);
                return match ? match[1].trim() : "No specific insights found.";
            };

            const backendInsights = parseSection("Backend");
            const frontendInsights = parseSection("Frontend");
            const technicalInsights = parseSection("Technical");

            return [
                {
                    title: 'Backend Performance Insights',
                    category: 'Backend',
                    severity: 'high',
                    description: backendInsights,
                    suggestedFix: 'Implement the identified backend optimizations.'
                },
                {
                    title: 'Frontend Vitals Analysis',
                    category: 'Frontend',
                    severity: 'medium',
                    description: frontendInsights,
                    suggestedFix: 'Optimize client-side assets and components.'
                },
                {
                    title: 'Technical Infrastructure Steps',
                    category: 'Technical',
                    severity: 'high',
                    description: technicalInsights,
                    suggestedFix: 'Apply the listed infrastructure and observability fixes.'
                }
            ];
        } catch (error) {
            console.error("AI RAG Analysis failed:", error);
            return [
                { title: 'Performance Analysis Unavailable', category: 'General', severity: 'low', description: 'Could not generate grounded insights at this time.', suggestedFix: 'Retry analysis after more data is collected.' }
            ];
        }
    },

    /**
     * Compare two sessions side-by-side
     */
    compare: async (sessionA, sessionB) => {
        try {
            console.log(`[AI-PERF] Comparing sessions ${sessionA._id} and ${sessionB._id}`);

            const prompt = `Perform a side-by-side A/B comparison between two performance runs.
            Run A (Target: ${sessionA.targetUrl}): Score ${sessionA.metrics.performance.score}, LCP ${sessionA.metrics.performance.lcp}
            Run B (Target: ${sessionB.targetUrl}): Score ${sessionB.metrics.performance.score}, LCP ${sessionB.metrics.performance.lcp}
            
            Identify 3 key differences and crown a winner. 
            Format: One-liner bullets ONLY. Use arrow notation.`;

            // We use Session A's namespace for context but the prompt includes data for both
            const comparisonReport = await ragService.ask(sessionA._id.toString(), prompt);

            return {
                comparison: comparisonReport,
                winner: sessionA.metrics.performance.score > sessionB.metrics.performance.score ? 'Run A' : 'Run B'
            };
        } catch (error) {
            console.error("Comparison failed:", error);
            throw error;
        }
    }
};


module.exports = aiService;
