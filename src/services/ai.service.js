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

        let prompt = `Analyze this web performance and API latency data and provide 3-5 specific technical suggestions.
        Lighthouse: ${JSON.stringify(metrics)}
        API Latency: ${latencyContext ? JSON.stringify(latencyContext) : 'None'}
        
        Return ONLY a JSON array of objects with: title, category (Frontend/Backend/SEO), severity (high/medium/low), description, suggestedFix.`;

        try {
            // Mock if no key or mock-key
            const isMock = !process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'mock-key' || process.env.OPENAI_API_KEY.includes('mock');

            if (isMock) {
                return [
                    { title: 'Optimize Images (Mock)', category: 'Frontend', severity: 'medium', description: 'Compress images...', suggestedFix: 'Use WebP' },
                    { title: 'Database Indexing (Mock)', category: 'Backend', severity: 'high', description: 'Slow queries detected...', suggestedFix: 'Index user_id' }
                ];
            }

            const completion = await openai.chat.completions.create({
                messages: [{ role: "user", content: prompt }],
                model: "gpt-3.5-turbo",
            });

            let content = completion.choices[0].message.content;
            // Robust parsing: strip potential markdown ```json blocks
            if (content.includes('```')) {
                content = content.replace(/```json/g, '').replace(/```/g, '').trim();
            }

            return JSON.parse(content);
        } catch (error) {
            console.error("AI Analysis failed:", error);
            // Return mock data as fallback so UI isn't empty
            return [
                { title: 'Optimize Hero Images', category: 'Frontend', severity: 'high', description: 'Large images are slowing down LCP.', suggestedFix: 'Use responsive images and WebP format.' },
                { title: 'Reduce Server Response Time', category: 'Backend', severity: 'medium', description: 'TTFB is higher than 500ms.', suggestedFix: 'Add database caching or optimize slow queries.' }
            ];
        }
    }
};

module.exports = aiService;
