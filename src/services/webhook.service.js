const axios = require('axios');

/**
 * Service for sending performance alerts via Webhooks (Slack/Discord)
 */
const webhookService = {
    /**
     * Send a notification to a Slack/Discord webhook
     * @param {string} url Webhook URL
     * @param {Object} payload Alert data
     */
    sendAlert: async (url, payload) => {
        if (!url) return;

        try {
            const { sessionId, targetUrl, severity, insight } = payload;

            // Simple Slack/Discord compatible block
            const message = {
                text: `🚀 *AI Performance Alert - ${severity.toUpperCase()}*`,
                attachments: [
                    {
                        color: severity === 'high' ? '#ff0000' : '#ffa500',
                        fields: [
                            { title: 'Project', value: targetUrl, short: true },
                            { title: 'Session ID', value: sessionId, short: true },
                            { title: 'Top Insight', value: insight, short: false }
                        ],
                        footer: 'AI Web Performance Analyzer',
                        ts: Math.floor(Date.now() / 1000)
                    }
                ]
            };

            await axios.post(url, message);
            console.log(`[Webhook] Alert sent successfully for session ${sessionId}`);
        } catch (error) {
            console.error(`[Webhook] Failed to send alert:`, error.message);
        }
    }
};

module.exports = webhookService;
