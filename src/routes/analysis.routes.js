const express = require('express');
const router = express.Router();
const { body, query } = require('express-validator');
const validate = require('../middleware/validate');
const { startAnalysis, getAnalysis, getHistory, generateAI, compareSessions, getDashboardStats } = require('../controllers/analysis.controller');
const { protect } = require('../middleware/authMiddleware');

const startSchema = [
    body('url').trim().notEmpty().withMessage('URL is required'),
    validate
];

const compareSchema = [
    body('idA').isMongoId().withMessage('Valid Session A ID is required'),
    body('idB').isMongoId().withMessage('Valid Session B ID is required'),
    validate
];

const historySchema = [
    query('limit').optional().isInt({ min: 1 }).withMessage('Limit must be a positive integer'),
    validate
];

router.post('/start', protect, startSchema, startAnalysis);
router.post('/compare', protect, compareSchema, compareSessions); // A/B Mode
router.get('/stats', protect, getDashboardStats); // Dashboard summary
router.post('/:id/ai', protect, generateAI);
router.get('/history', protect, historySchema, getHistory);
router.get('/:id', protect, getAnalysis);

module.exports = router;
