const protobuf = require('protobufjs');
const path = require('path');

const protoPath = path.join(__dirname, 'src', 'proto', 'opentelemetry-trace.proto');

async function testDecoding() {
    try {
        const root = await protobuf.load(protoPath);
        const TracesData = root.lookupType('opentelemetry.proto.trace.v1.TracesData');

        // Create a dummy message
        const payload = {
            resource_spans: [{
                resource: {
                    attributes: [{ key: "service.name", value: { string_value: "test-service" } }]
                },
                scope_spans: []
            }]
        };

        // Encode
        const errMsg = TracesData.verify(payload);
        if (errMsg) throw Error(errMsg);
        const buffer = TracesData.encode(TracesData.create(payload)).finish();

        console.log("Encoded buffer length:", buffer.length);

        // Decode
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

        console.log("Decoded JSON keys:", Object.keys(jsonData));
        console.log("Decoded JSON:", JSON.stringify(jsonData, null, 2));

        if (jsonData.resource_spans && !jsonData.resourceSpans) {
            console.log("RESULT: ProtobufJS outputs snake_case by default.");
        } else if (jsonData.resourceSpans) {
            console.log("RESULT: ProtobufJS outputs camelCase.");
        }

    } catch (e) {
        console.error("Test failed:", e);
    }
}

testDecoding();
