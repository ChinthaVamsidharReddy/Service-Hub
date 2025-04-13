const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const { body, validationResult } = require('express-validator');

// Register User
router.post('/register', [
    body('fullName').trim().notEmpty().withMessage('Full name is required'),
    body('email').isEmail().withMessage('Please enter a valid email'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
    body('phone').notEmpty().withMessage('Phone number is required'),
    body('userType').isIn(['worker', 'customer']).withMessage('Invalid user type')
], async (req, res) => {
    try {
        console.log('Register request received:', req.body);

        // Validate input
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { fullName, email, password, phone, userType } = req.body;

        // Check if user already exists
        const [existingUsers] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
        if (existingUsers.length > 0) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Insert user
        const [result] = await db.query(
            'INSERT INTO users (full_name, email, password, phone, user_type) VALUES (?, ?, ?, ?, ?)',
            [fullName, email, hashedPassword, phone, userType]
        );

        // If worker, create worker profile
        if (userType === 'worker' && req.body.salary) {
            await db.query(
                'INSERT INTO worker_profiles (user_id, hourly_rate) VALUES (?, ?)',
                [result.insertId, req.body.salary]
            );
        }

        // Create JWT token
        const token = jwt.sign(
            { userId: result.insertId, userType: userType },
            'Vamsidhar',
            { expiresIn: '24h' }
        );

        // Get the created user
        const [newUser] = await db.query('SELECT id, full_name, email, user_type FROM users WHERE id = ?', [result.insertId]);

        // Send response with token and user data
        return res.status(201).json({
            status: "success",
            data: {
                token: newUser.token,
                user: {
                    id: newUser[0].id,
                    fullName: newUser[0].full_name,
                    email: newUser[0].email,
                    userType: newUser[0].user_type
                }
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        return res.status(500).json({ 
            status: "error",
            message: 'Server error during registration',
            error: error.message 
        });
    }
});

// Login User
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate input
        if (!email || !password) {
            return res.status(400).json({ 
                status: "error",
                message: 'Please provide email and password' 
            });
        }

        // Check if user exists
        const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);

        if (users.length === 0) {
            return res.status(401).json({ 
                status: "error",
                message: 'Invalid credentials' 
            });
        }

        const user = users[0];

        // Compare password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ 
                status: "error",
                message: 'Invalid credentials' 
            });
        }

        // Create JWT token
        const token = jwt.sign(
            { userId: user.id, userType: user.user_type },
            'Vamsidhar',
            { expiresIn: '24h' }
        );

        // Send response
        return res.status(200).json({
            status: "success",
            data: {
                token: token,
                user: {
                    id: user.id,
                    fullName: user.full_name,
                    email: user.email,
                    userType: user.user_type
                }
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ 
            status: "error",
            message: 'Server error during login',
            error: error.message 
        });
    }
});

module.exports = router; 