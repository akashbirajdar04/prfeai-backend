const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { registerUser, loginUser, getMe } = require('../controllers/auth.controller');
const { protect } = require('../middleware/authMiddleware');

const registerSchema = [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    validate
];

const loginSchema = [
    body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required'),
    validate
];

router.post('/register', registerSchema, registerUser);
router.post('/login', loginSchema, loginUser);
router.get('/me', protect, getMe);

module.exports = router;
