const documentHelper = require('./document.helper');
const embeddingService = require('./embedding.service');
const vectorService = require('./vector.service');
const llmService = require('./llm.service');
const crypto = require('crypto');

/**
 * Utility for retrying async operations with exponential backoff
 * @param {Function} fn Async function to retry
 * @param {number} retries Max number of retries
 * @param {number} delay Initial delay in ms
 */
const withRetry = async (fn, retries = 3, delay = 1000) => {
    try {
        return await fn();
    } catch (error) {
        if (retries <= 0) throw error;
        console.warn(`[Retry] Operation failed, retrying in ${delay}ms... (${retries} left)`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return withRetry(fn, retries - 1, delay * 2);
    }
};

/**
 * Main RAG Service Orchestrator
 */
const ragService = {
    /**
     * Ingest API latency data into RAG
     * @param {string} sessionId User session identifier
     * @param {Array<Object>} apiData Array of aggregated API metrics
     */
    ingestAPI: async (sessionId, apiData) => {
        console.log(`[RAG] Ingesting ${apiData.length} API endpoints for session ${sessionId}`);

        for (const item of apiData) {
            try {
                // 1. Prepare Text
                const text = documentHelper.prepareApiDoc(item);

                // 2. Generate Embedding (with Retry)
                const vector = await withRetry(() => embeddingService.generateEmbedding(text));

                // 3. Store in Pinecone (with Retry)
                const docId = crypto.createHash('md5').update(`${sessionId}-${item.method}-${item.endpoint}`).digest('hex');
                const metadata = {
                    type: 'api',
                    endpoint: item.endpoint,
                    method: item.method,
                    text: text
                };

                await withRetry(() => vectorService.upsertVector(sessionId, docId, vector, metadata));
            } catch (error) {
                console.error(`[RAG] Failed to ingest API doc after retries for ${item.endpoint}:`, error.message);
            }
        }
    },

    /**
     * Ingest Lighthouse data into RAG
     * @param {string} sessionId User session identifier
     * @param {Object} lighthouseData Lighthouse metrics object
     */
    ingestLighthouse: async (sessionId, lighthouseData) => {
        console.log(`[RAG] Ingesting Lighthouse report for session ${sessionId}`);

        try {
            // 1. Prepare Text
            const text = documentHelper.prepareLighthouseDoc(lighthouseData);

            // 2. Generate Embedding (with Retry)
            const vector = await withRetry(() => embeddingService.generateEmbedding(text));

            // 3. Store in Pinecone (with Retry)
            const docId = crypto.createHash('md5').update(`${sessionId}-lighthouse`).digest('hex');
            const metadata = {
                type: 'lighthouse',
                text: text
            };

            await withRetry(() => vectorService.upsertVector(sessionId, docId, vector, metadata));
        } catch (error) {
            console.error(`[RAG] Failed to ingest Lighthouse doc after retries:`, error.message);
        }
    },

    /**
     * Answer a user question using the RAG pipeline
     * @param {string} sessionId The session context to retrieve from
     * @param {string} question The user's performance-related question
     * @returns {Promise<string>} Grounded answer
     */
    ask: async (sessionId, question) => {
        console.log(`\n--- [RAG QUERY START] ---`);
        console.log(`Session: ${sessionId}`);
        console.log(`Question: "${question}"`);

        // 1. Embed the question (with Retry)
        const questionVector = await withRetry(() => embeddingService.generateEmbedding(question));

        // 2. Retrieve top matches from Pinecone (with Retry)
        const contextMatches = await withRetry(() => vectorService.queryVectors(sessionId, questionVector, 5));

        if (contextMatches.length === 0) {
            console.warn(`[RAG] ⚠️ No context found for this query in namespace ${sessionId}.`);
        }

        // 3. Generate grounded answer via LLM (with Retry)
        const answer = await withRetry(() => llmService.generateAnswer(question, contextMatches));

        console.log(`--- [RAG QUERY COMPLETE] ---\n`);
        return answer;
    }
};

module.exports = ragService;
