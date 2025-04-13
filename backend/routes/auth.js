const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const { body, validationResult } = require('express-validator');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

// Store OTPs temporarily (in production, this should be in Redis or a database)
const otpStore = {};

// Email configuration
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'gmail',
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,     // Use only the environment variable
    pass: process.env.EMAIL_PASSWORD  // Use only the environment variable
  },
  connectionTimeout: 60000, // 60 seconds
  greetingTimeout: 30000,   // 30 seconds
  socketTimeout: 60000      // 60 seconds
});

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
            process.env.JWT_SECRET || 'Vamsidhar',
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
            process.env.JWT_SECRET || 'Vamsidhar',
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

// Generate and send OTP for password reset
router.post('/forgot-password', [
    body('email').isEmail().withMessage('Please provide a valid email address')
], async (req, res) => {
    try {
        // Validate input
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                status: "error",
                errors: errors.array() 
            });
        }

        const { email } = req.body;

        // Check if user exists
        const [users] = await db.query('SELECT id, full_name FROM users WHERE email = ?', [email]);
        if (users.length === 0) {
            return res.status(404).json({ 
                status: "error",
                message: 'No account found with that email address' 
            });
        }

        const user = users[0];

        // Generate a 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        
        // Store OTP with expiry time (15 minutes)
        otpStore[email] = {
            otp,
            expiresAt: Date.now() + 15 * 60 * 1000, // 15 minutes
            attempts: 0
        };

        // Send OTP via email
        const mailOptions = {
            from: process.env.EMAIL_USER || 'your-email@gmail.com',
            to: email,
            subject: 'Password Reset Verification Code',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background-color: #3b82f6; padding: 20px; text-align: center; color: white;">
                        <h1 style="margin: 0;">Password Reset</h1>
                    </div>
                    <div style="padding: 20px; border: 1px solid #e5e7eb; border-top: none;">
                        <p>Hello ${user.full_name || 'there'},</p>
                        <p>We received a request to reset your password for your Serverice Hub account. Please use the verification code below to complete the process:</p>
                        <div style="background-color: #f3f4f6; padding: 15px; text-align: center; margin: 20px 0; font-size: 24px; letter-spacing: 5px; font-weight: bold;">
                            ${otp}
                        </div>
                        <p>This code will expire in 15 minutes.</p>
                        <p>If you didn't request this password reset, you can safely ignore this email.</p>
                        <p>Best regards,<br>The Serverice Hub Team</p>
                    </div>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);

        return res.status(200).json({
            status: "success",
            success: true,
            message: 'Verification code sent to your email'
        });
    } catch (error) {
        console.error('Forgot password error:', error);
        return res.status(500).json({ 
            status: "error",
            message: 'Failed to send verification code',
            error: error.message 
        });
    }
});

// Verify OTP
router.post('/verify-otp', [
    body('email').isEmail().withMessage('Please provide a valid email address'),
    body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits')
], async (req, res) => {
    try {
        // Validate input
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                status: "error",
                errors: errors.array() 
            });
        }

        const { email, otp } = req.body;

        // Check if OTP exists and is valid
        if (!otpStore[email]) {
            return res.status(400).json({ 
                status: "error",
                message: 'No OTP found for this email or OTP has expired' 
            });
        }

        const otpData = otpStore[email];

        // Check if OTP is expired
        if (Date.now() > otpData.expiresAt) {
            delete otpStore[email];
            return res.status(400).json({ 
                status: "error",
                message: 'OTP has expired. Please request a new one' 
            });
        }

        // Check if max attempts reached
        if (otpData.attempts >= 3) {
            delete otpStore[email];
            return res.status(400).json({ 
                status: "error",
                message: 'Too many failed attempts. Please request a new OTP' 
            });
        }

        // Verify OTP
        if (otpData.otp !== otp) {
            otpData.attempts += 1;
            return res.status(400).json({ 
                status: "error",
                message: 'Invalid OTP. Please try again' 
            });
        }

        // Generate a reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        
        // Store reset token with expiry (30 minutes)
        otpStore[email].resetToken = resetToken;
        otpStore[email].resetTokenExpiresAt = Date.now() + 30 * 60 * 1000; // 30 minutes
        
        return res.status(200).json({
            status: "success",
            success: true,
            message: 'OTP verified successfully',
            resetToken
        });
    } catch (error) {
        console.error('Verify OTP error:', error);
        return res.status(500).json({ 
            status: "error",
            message: 'Failed to verify OTP',
            error: error.message 
        });
    }
});

// Resend OTP
router.post('/resend-otp', [
    body('email').isEmail().withMessage('Please provide a valid email address')
], async (req, res) => {
    try {
        // Validate input
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                status: "error",
                errors: errors.array() 
            });
        }

        const { email } = req.body;

        // Check if user exists
        const [users] = await db.query('SELECT id, full_name FROM users WHERE email = ?', [email]);
        if (users.length === 0) {
            return res.status(404).json({ 
                status: "error",
                message: 'No account found with that email address' 
            });
        }

        const user = users[0];

        // Generate a new 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        
        // Store OTP with expiry time (15 minutes)
        otpStore[email] = {
            otp,
            expiresAt: Date.now() + 15 * 60 * 1000, // 15 minutes
            attempts: 0
        };

        // Send OTP via email
        const mailOptions = {
            from: process.env.EMAIL_USER || 'your-email@gmail.com',
            to: email,
            subject: 'New Password Reset Verification Code',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background-color: #3b82f6; padding: 20px; text-align: center; color: white;">
                        <h1 style="margin: 0;">New Password Reset Code</h1>
                    </div>
                    <div style="padding: 20px; border: 1px solid #e5e7eb; border-top: none;">
                        <p>Hello ${user.full_name || 'there'},</p>
                        <p>You requested a new verification code. Please use the code below to complete your password reset:</p>
                        <div style="background-color: #f3f4f6; padding: 15px; text-align: center; margin: 20px 0; font-size: 24px; letter-spacing: 5px; font-weight: bold;">
                            ${otp}
                        </div>
                        <p>This code will expire in 15 minutes.</p>
                        <p>If you didn't request this password reset, please secure your account.</p>
                        <p>Best regards,<br>The Serverice Hub Team</p>
                    </div>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);

        return res.status(200).json({
            status: "success",
            success: true,
            message: 'New verification code sent to your email'
        });
    } catch (error) {
        console.error('Resend OTP error:', error);
        return res.status(500).json({ 
            status: "error",
            message: 'Failed to send new verification code',
            error: error.message 
        });
    }
});

// Reset Password
router.post('/reset-password', [
    body('email').isEmail().withMessage('Please provide a valid email address'),
    body('token').notEmpty().withMessage('Reset token is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long')
], async (req, res) => {
    try {
        // Validate input
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                status: "error",
                errors: errors.array() 
            });
        }

        const { email, token, password } = req.body;

        // Check if reset token exists and is valid
        if (!otpStore[email] || !otpStore[email].resetToken || otpStore[email].resetToken !== token) {
            return res.status(400).json({ 
                status: "error",
                message: 'Invalid or expired reset token' 
            });
        }

        // Check if token is expired
        if (Date.now() > otpStore[email].resetTokenExpiresAt) {
            delete otpStore[email];
            return res.status(400).json({ 
                status: "error",
                message: 'Reset token has expired. Please start the reset process again' 
            });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Update password in database
        await db.query('UPDATE users SET password = ? WHERE email = ?', [hashedPassword, email]);

        // Clean up OTP store
        delete otpStore[email];

        return res.status(200).json({
            status: "success",
            success: true,
            message: 'Password has been reset successfully'
        });
    } catch (error) {
        console.error('Reset password error:', error);
        return res.status(500).json({ 
            status: "error",
            message: 'Failed to reset password',
            error: error.message 
        });
    }
});

module.exports = router; 