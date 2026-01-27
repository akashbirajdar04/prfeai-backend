const { Pinecone } = require('../embedding/pinecone');

const INDEX_NAME = process.env.PINECONE_INDEX || 'performance-telemetry';

/**
 * Service for Vector Storage and Retrieval using Pinecone
 */
const vectorService = {
    /**
     * Upsert a vector into Pinecone
     * @param {string} sessionId Session ID used for namespace/filtering
     * @param {string} id Unique document ID
     * @param {Array<number>} vector 1536-dimension embedding
     * @param {Object} metadata Metadata including the original text
     */
    upsertVector: async (sessionId, id, vector, metadata) => {
        try {
            console.log(`[Pinecone] Upserting document ${id} to namespace "${sessionId}"...`);
            const index = Pinecone.index(INDEX_NAME);

            await index.namespace(sessionId).upsert([{
                id,
                values: vector,
                metadata: {
                    ...metadata,
                    sessionId // Ensure sessionId is in metadata for broad filtering if needed
                }
            }]);

            console.log(`[Pinecone] ✅ Successfully indexed.`);
        } catch (error) {
            console.error("[Pinecone] ❌ Upsert failed:", error.message || error);
            throw new Error("Failed to store vector");
        }
    },

    /**
     * Query Pinecone for similar vectors
     * @param {string} sessionId Namespace to search in
     * @param {Array<number>} queryVector 1536-dimension embedding of the question
     * @param {number} topK Number of results to retrieve (default 3)
     * @returns {Promise<Array<Object>>} Top similar documents
     */
    queryVectors: async (sessionId, queryVector, topK = 5) => {
        try {
            console.log(`[Pinecone] Querying namespace "${sessionId}" for top ${topK} matches...`);
            const index = Pinecone.index(INDEX_NAME);

            const results = await index.namespace(sessionId).query({
                vector: queryVector,
                topK,
                includeMetadata: true
            });

            console.log(`[Pinecone] ✅ Retrieved ${results.matches?.length || 0} relative documents.`);
            return results.matches || [];
        } catch (error) {
            console.error("[Pinecone] ❌ Query failed:", error.message || error);
            throw new Error("Failed to retrieve vectors");
        }
    }
};

module.exports = vectorService;
