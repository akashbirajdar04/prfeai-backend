const express = require('express');
const router = express.Router();
const { startAnalysis, getAnalysis, getHistory, generateAI } = require('../controllers/analysis.controller');
const { protect } = require('../middleware/authMiddleware');

router.post('/start', protect, startAnalysis);
router.post('/:id/ai', protect, generateAI); // New route
router.get('/history', protect, getHistory);
router.get('/:id', protect, getAnalysis);

module.exports = router;
