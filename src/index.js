const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./config/db");
const protobufParser = require("./middleware/protobuf-parser");

dotenv.config();
connectDB();

const app = express();

app.use(cors({
    origin: ["https://prfeanalyzee-frontend.vercel.app", "http://localhost:5173", "http://localhost:3000"],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-session-id"],
    credentials: true,
    optionsSuccessStatus: 200
}));

app.options('/(.*)', cors()); // Enable pre-flight for all routes (Express 5 syntax)

// Parse Protobuf data before JSON parser
app.use(protobufParser);
app.use(express.json());

// Request logger with timing
app.use((req, res, next) => {
    console.log(`[INCOMING] ${req.method} ${req.url}`); // Log immediately on receipt
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(`${new Date().toISOString()} - ${req.method} ${req.url} - ${res.statusCode} (${duration}ms)`);
    });
    next();
});

const { errorHandler, notFound } = require("./middleware/errorMiddleware");

// Routes
app.use("/api/auth", require("./routes/auth.routes"));
app.use("/api/analysis", require("./routes/analysis.routes"));
app.use("/api/telemetry", require("./routes/telemetry.routes"));

app.get("/", (req, res) => {
    res.send("API is running...");
});

app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Professional Error Handling Mix
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});