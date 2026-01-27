const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Session = require('./src/models/sessionmodel');

dotenv.config();

async function checkSessions() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB");

        const sessions = await Session.find().sort({ createdAt: -1 }).limit(5);
        console.log(`\nFound ${sessions.length} recent sessions:\n`);

        sessions.forEach(s => {
            console.log(`ID: ${s._id}`);
            console.log(`URL: ${s.targetUrl}`);
            console.log(`Status: ${s.status}`);
            console.log(`Created: ${s.createdAt}`);
            if (s.status === 'failed') {
                console.log(`Error detail: Check backend logs for [Job] failure`);
            }
            console.log('-------------------');
        });

        await mongoose.disconnect();
    } catch (err) {
        console.error("Error:", err.message);
    }
}

checkSessions();
