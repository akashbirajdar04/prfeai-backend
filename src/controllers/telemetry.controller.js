const asyncHandler = require('express-async-handler');
const telemetryService = require('../services/telemetry.service');

// @desc    Receive OpenTelemetry traces
// @route   POST /api/telemetry
// @access  Public (protected by x-session-id header and schema validation)
const receiveTelemetry = asyncHandler(async (req, res) => {
    const sessionId = req.headers['x-session-id'];
    const traces = req.body;

    console.log(`[Telemetry] Incoming batch for session: ${sessionId}`);

    const result = await telemetryService.processTraces(sessionId, traces);

    res.status(200).json({
        success: true,
        url: result.url,
        count: result.count
    });
});

module.exports = { receiveTelemetry };
