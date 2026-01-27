const express = require('express');
const router = express.Router();
const { header } = require('express-validator');
const validate = require('../middleware/validate');
const { receiveTelemetry } = require('../controllers/telemetry.controller');

router.use((req, res, next) => {
    console.log(`[TELEMETRY ROUTE] HIT: ${req.method} ${req.url}`);
    next();
});

const telemetrySchema = [
    header('x-session-id').notEmpty().withMessage('x-session-id header is required'),
    validate
];

router.post('/', telemetrySchema, receiveTelemetry);
router.post('/v1/traces', telemetrySchema, receiveTelemetry);

module.exports = router;
