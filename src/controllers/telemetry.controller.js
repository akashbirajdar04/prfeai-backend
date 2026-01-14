const asyncHandler = require('express-async-handler');
const Session = require('../models/sessionmodel');
const aiService = require('../services/ai.service');
const { uploadJSON } = require('../services/cloudinary.service');

// @desc    Receive OpenTelemetry traces
// @route   POST /api/telemetry
// @access  Public (protected by x-session-id header)
const receiveTelemetry = asyncHandler(async (req, res) => {
    const sessionId = req.headers['x-session-id'];
    const traces = req.body; // Assuming OTEL JSON format

    if (!sessionId) {
        res.status(400);
        throw new Error('Missing x-session-id header');
    }

    // 1. Process Traces (Simple Aggregation)
    // Extract spans relative to HTTP requests
    const endpoints = {};

    // Abstract logic to parse OTEL standard format
    // This is a simplification. Real OTEL traces are nested.
    const spans = Array.isArray(traces.resourceSpans) ? traces.resourceSpans : [];

    spans.forEach(resource => {
        resource.scopeSpans?.forEach(scope => {
            scope.spans?.forEach(span => {
                const attributes = span.attributes || [];
                const httpMethod = attributes.find(a => a.key === 'http.method')?.value?.stringValue;
                const httpRoute = attributes.find(a => a.key === 'http.route')?.value?.stringValue;

                if (httpMethod && httpRoute) {
                    const durationMs = (span.endTimeUnixNano - span.startTimeUnixNano) / 1000000;
                    const key = `${httpMethod} ${httpRoute}`;

                    if (!endpoints[key]) endpoints[key] = { count: 0, total: 0, max: 0, method: httpMethod, route: httpRoute };
                    endpoints[key].count++;
                    endpoints[key].total += durationMs;
                    endpoints[key].max = Math.max(endpoints[key].max, durationMs);
                }
            });
        });
    });

    const aggregated = Object.values(endpoints).map(e => ({
        endpoint: e.route,
        method: e.method,
        avgLatency: Math.round(e.total / e.count),
        p95: Math.round(e.max), // Approximation for now
        isSlow: (e.total / e.count) > 200 // Threshold
    }));

    // 2. Store in RAG for AI context
    aiService.storeLatencyForRAG(sessionId, aggregated);

    // 3. Upload to Cloudinary for Dashboard
    try {
        const url = await uploadJSON(aggregated, 'telemetry_data');

        // 4. Update Session
        await Session.findByIdAndUpdate(sessionId, {
            'artifacts.endpointsUrl': url
        });

        res.status(200).json({ success: true, url });
    } catch (error) {
        console.error("Telemetry processing failed:", error);
        res.status(500).send("Processing failed");
    }
});

module.exports = { receiveTelemetry };
