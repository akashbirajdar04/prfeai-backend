const protobuf = require('protobufjs');
const path = require('path');

// Load the protobuf schema once at startup
let TracesData = null;
const protoPath = path.join(__dirname, '../proto/opentelemetry-trace.proto');

protobuf.load(protoPath)
    .then(root => {
        TracesData = root.lookupType('opentelemetry.proto.trace.v1.TracesData');
        console.log('[Protobuf Parser] Schema loaded successfully');
    })
    .catch(err => {
        console.error('[Protobuf Parser] Failed to load schema:', err);
    });

/**
 * Middleware to parse incoming Protobuf telemetry data
 * Converts OpenTelemetry Protobuf format to JSON
 */
const protobufParser = (req, res, next) => {
    const contentType = req.headers['content-type'] || '';

    // Only process if content-type indicates protobuf
    if (contentType.includes('application/x-protobuf')) {
        console.log('[Protobuf Parser] Detected Protobuf payload, parsing...');

        if (!TracesData) {
            console.error('[Protobuf Parser] Schema not loaded yet');
            return res.status(500).json({
                success: false,
                error: 'Protobuf schema not initialized'
            });
        }

        const chunks = [];

        req.on('data', (chunk) => {
            chunks.push(chunk);
        });

        req.on('end', () => {
            try {
                const buffer = Buffer.concat(chunks);
                console.log(`[Protobuf Parser] Received ${buffer.length} bytes`);

                // Decode the protobuf message
                const decoded = TracesData.decode(buffer);
                const jsonData = TracesData.toObject(decoded, {
                    longs: String,
                    enums: String,
                    bytes: String,
                    defaults: true,
                    arrays: true,
                    objects: true,
                    oneofs: true
                });

                console.log('[Protobuf Parser] Successfully decoded to JSON');
                console.log('[Protobuf Parser] Resource spans:', jsonData.resourceSpans?.length || 0);

                // Set the parsed JSON as req.body
                req.body = jsonData;
                next();
            } catch (error) {
                console.error('[Protobuf Parser] Error decoding Protobuf:', error);
                return res.status(400).json({
                    success: false,
                    error: 'Invalid Protobuf data',
                    details: error.message
                });
            }
        });

        req.on('error', (error) => {
            console.error('[Protobuf Parser] Stream error:', error);
            return res.status(500).json({
                success: false,
                error: 'Error reading request data'
            });
        });
    } else {
        // Not protobuf, continue to next middleware (express.json())
        next();
    }
};

module.exports = protobufParser;
