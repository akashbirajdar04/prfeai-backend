const express = require('express');
const router = express.Router();
const { receiveTelemetry } = require('../controllers/telemetry.controller');

router.post('/', receiveTelemetry);

module.exports = router;
