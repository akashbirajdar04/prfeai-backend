const http = require('http');
const protobuf = require('protobufjs');
const path = require('path');

async function testProtobufSending() {
    console.log('=== Testing Protobuf Telemetry ===\n');

    // Load the proto schema
    const protoPath = path.join(__dirname, 'src/proto/opentelemetry-trace.proto');
    const root = await protobuf.load(protoPath);
    const TracesData = root.lookupType('opentelemetry.proto.trace.v1.TracesData');

    // Create sample trace data
    const sampleData = {
        resourceSpans: [{
            resource: {
                attributes: [
                    { key: 'service.name', value: { stringValue: 'test-service' } }
                ]
            },
            scopeSpans: [{
                scope: {
                    name: 'test-scope',
                    version: '1.0.0'
                },
                spans: [{
                    traceId: Buffer.from('12345678901234567890123456789012', 'hex'),
                    spanId: Buffer.from('1234567890123456', 'hex'),
                    name: 'test-span',
                    kind: 1,
                    startTimeUnixNano: '1234567890000000000',
                    endTimeUnixNano: '1234567890100000000',
                    attributes: [
                        { key: 'http.method', value: { stringValue: 'GET' } },
                        { key: 'http.route', value: { stringValue: '/api/test' } }
                    ]
                }]
            }]
        }]
    };

    // Encode to Protobuf
    const message = TracesData.create(sampleData);
    const buffer = TracesData.encode(message).finish();

    console.log(`Created Protobuf payload: ${buffer.length} bytes`);

    // Send to backend
    const options = {
        hostname: 'localhost',
        port: 5000,
        path: '/api/telemetry',
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-protobuf',
            'x-session-id': '696cf0885d48b595bf22ce5b',
            'Content-Length': buffer.length
        }
    };

    const req = http.request(options, (res) => {
        console.log(`\nResponse Status: ${res.statusCode}`);
        console.log(`Response Headers:`, res.headers);

        let data = '';
        res.on('data', (chunk) => {
            data += chunk;
        });

        res.on('end', () => {
            console.log('\nResponse Body:', data);
            if (res.statusCode === 200) {
                console.log('\n✅ SUCCESS: Protobuf data was accepted and processed!');
            } else {
                console.log('\n❌ FAILED: Server rejected the data');
            }
        });
    });

    req.on('error', (error) => {
        console.error('\n❌ Request Error:', error.message);
        console.log('\nMake sure the backend server is running on port 5000');
    });

    req.write(buffer);
    req.end();
}

testProtobufSending().catch(console.error);
