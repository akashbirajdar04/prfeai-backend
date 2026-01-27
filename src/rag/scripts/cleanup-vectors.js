const { Pinecone } = require('@pinecone-database/pinecone');
const dotenv = require('dotenv');
const path = require('path');

// Load env from both locations to be safe
dotenv.config({ path: path.join(__dirname, '../.env') });

const pc = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY
});

/**
 * Maintenance script to clean up old session vectors
 * Usage: node scripts/cleanup-vectors.js [sessionId]
 */
const cleanup = async () => {
    const sessionId = process.argv[2];

    if (!sessionId) {
        console.error("❌ Please provide a Session ID to clean up.");
        process.exit(1);
    }

    try {
        const index = pc.index(process.env.PINECONE_INDEX);
        console.log(`[Maintenance] Deleting all vectors for namespace: ${sessionId}...`);

        await index.namespace(sessionId).deleteAll();

        console.log(`[Maintenance] ✅ Successfully purged session ${sessionId} from Pinecone.`);
    } catch (error) {
        console.error(`[Maintenance] ❌ Cleanup failed:`, error.message);
    }
};

cleanup();
