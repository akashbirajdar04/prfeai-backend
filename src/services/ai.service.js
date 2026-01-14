const fs = require('fs');
const path = require('path');
const OpenAI = require('openai');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const RAG_DOCS_PATH = path.join(__dirname, '../../../rag/docs');

// Ensure RAG directory exists
if (!fs.existsSync(RAG_DOCS_PATH)) {
    fs.mkdirSync(RAG_DOCS_PATH, { recursive: true });
}

const aiService = {
    /**
     * Save latency data to RAG document store
     */
    storeLatencyForRAG: (sessionId, latencyData) => {
        const filePath = path.join(RAG_DOCS_PATH, `latency_${sessionId}.json`);
        fs.writeFileSync(filePath, JSON.stringify(latencyData, null, 2));
        console.log(`[RAG] Stored latency context for session ${sessionId}`);
    },

    /**
     * Read latency data from RAG store
     */
    getLatencyFromRAG: (sessionId) => {
        const filePath = path.join(RAG_DOCS_PATH, `latency_${sessionId}.json`);
        if (fs.existsSync(filePath)) {
            return JSON.parse(fs.readFileSync(filePath, 'utf8'));
        }
        return null;
    },

    /**
     * Generate optimization analysis
     */
    analyze: async (metrics, sessionId) => {
        const latencyContext = aiService.getLatencyFromRAG(sessionId);

        let prompt = `Analyze this web performance data:\n`;
        prompt += `Lighthouse Metrics: ${JSON.stringify(metrics)}\n`;

        if (latencyContext) {
            prompt += `Backend API Latency Context (from RAG): ${JSON.stringify(latencyContext)}\n`;
        } else {
            prompt += `No backend telemetry available.\n`;
        }

        prompt += `Provide 3 specific suggestions for Frontend, Backend, and SEO optimization. Return as JSON array.`;

        try {
            // Mock if no key
            if (!process.env.OPENAI_API_KEY) {
                return [
                    { title: 'Optimize Images (Mock)', category: 'Frontend', severity: 'medium', description: 'Compress images...', suggestedFix: 'Use WebP' },
                    { title: 'Database Indexing (Mock)', category: 'Backend', severity: 'high', description: 'Slow queries detected...', suggestedFix: 'Index user_id' }
                ];
            }

            const completion = await openai.chat.completions.create({
                messages: [{ role: "user", content: prompt }],
                model: "gpt-3.5-turbo",
            });

            return JSON.parse(completion.choices[0].message.content);
        } catch (error) {
            console.error("AI Analysis failed:", error);
            return []; // Fallback
        }
    }
};

module.exports = aiService;
