const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const asyncHandler = require('express-async-handler');
const User = require('../models/usermodel');

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET || 'secret', {
        expiresIn: '30d',
    });
};

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        console.log(`Registration failed: Missing fields for ${email}`);
        res.status(400);
        throw new Error('Please add all fields');
    }

    console.log(`Registration attempt for: ${email}`);

    const userExists = await User.findOne({ email });

    if (userExists) {
        console.log(`Registration failed: User already exists - ${email}`);
        res.status(400);
        throw new Error('User already exists');
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
        name,
        email,
        password: hashedPassword,
    });

    if (user) {
        res.status(201).json({
            user: {
                _id: user.id,
                name: user.name,
                email: user.email,
            },
            token: generateToken(user.id),
        });
    } else {
        res.status(400);
        throw new Error('Invalid user data');
    }
});

// @desc    Authenticate a user
// @route   POST /api/auth/login
// @access  Public
const loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    console.log(`Login attempt for: ${email}`);

    const user = await User.findOne({ email });
    if (!user) {
        console.log(`Login failed: User not found - ${email}`);
    }

    if (user && (await bcrypt.compare(password, user.password))) {
        console.log(`Login successful: ${email}`);
        res.json({
            user: {
                _id: user.id,
                name: user.name,
                email: user.email,
            },
            token: generateToken(user.id),
        });
    } else {
        console.log(`Login failed: Invalid password for ${email}`);
        res.status(401);
        throw new Error('Invalid credentials');
    }
});

// @desc    Get user data
// @route   GET /api/auth/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {
    res.status(200).json(req.user);
});

module.exports = {
    registerUser,
    loginUser,
    getMe,
};
