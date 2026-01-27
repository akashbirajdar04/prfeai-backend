const { Pinecone } = require('@pinecone-database/pinecone');

const pc = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY
});

module.exports = { Pinecone: pc };
