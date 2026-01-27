const { HfInference } = require('@huggingface/inference');

// Initialize with empty token or from env
const hf = new HfInference(process.env.HF_TOKEN || '');

/**
 * Service for generating text embeddings using Hugging Face
 */
const embeddingService = {
    /**
     * Generate embedding for a single text document or query
     * @param {string} text Plain text input
     * @returns {Promise<Array<number>>} 768-dimension vector (all-mpnet-base-v2)
     */
    generateEmbedding: async (text) => {
        try {
            console.log(`[Embedding] Generating Hugging Face embedding (${text.length} chars)...`);

            const embedding = await hf.featureExtraction({
                model: "sentence-transformers/all-mpnet-base-v2",
                inputs: text,
            });

            console.log(`[Embedding] ✅ Successfully generated ${embedding.length}-dim vector.`);
            return embedding;
        } catch (error) {
            console.error("[Embedding] ❌ Hugging Face Embedding generation failed:", error.message || error);
            throw new Error("Failed to generate embedding");
        }
    }
};

module.exports = embeddingService;
