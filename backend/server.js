const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const path = require('path');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('./config/jwt');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth');
const workerRoutes = require('./routes/workers');
const bookingRoutes = require('./routes/bookings');
const paymentRoutes = require('./routes/payments');
const reviewRoutes = require('./routes/reviews');
const auth = require('./middleware/auth');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// API Routes - Define these before the static file middleware
app.use('/api/auth', authRoutes);
app.use('/api/worker', auth, workerRoutes);
app.use('/api/bookings', auth, bookingRoutes);
app.use('/api/payments', auth, paymentRoutes);
app.use('/api/reviews', auth, reviewRoutes);

// Test route
app.get('/api/test', (req, res) => {
    res.json({ message: 'API is working' });
});

// Login endpoint
app.post('/api/auth/login', async (req, res) => {
    try {
        console.log('\n=== Login Request ===');
        console.log('Request body:', req.body);

        const { email, password } = req.body;

        // Basic validation
        if (!email || !password) {
            return res.status(400).json({ message: 'Please provide email and password' });
        }

        // Query to check user
        const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
        
        if (users.length === 0) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const user = users[0];

        // Compare password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Create JWT token
        const token = jwt.sign(
            { userId: user.id, userType: user.user_type },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        console.log('\n=== Login Successful ===');
        console.log('User:', {
            id: user.id,
            email: user.email,
            userType: user.user_type
        });
        console.log('Generated Token:', token);
        console.log('================\n');

        res.json({
            status: "success",
            data: {
                token,
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
        res.status(500).json({ message: 'Server error during login' });
    }
});

// Register endpoint
app.post('/api/auth/register', async (req, res) => {
    try {
        console.log('\n=== Registration Request ===');
        console.log('Request body:', req.body);

        const { userType, fullName, email, password, phone } = req.body;

        // Basic validation
        if (!userType || !fullName || !email || !password || !phone) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        // Check if user exists
        const [existingUsers] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
        if (existingUsers.length > 0) {
            return res.status(400).json({ message: 'Email already registered' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Insert new user
        const [result] = await pool.query(
            'INSERT INTO users (full_name, email, password, phone, user_type) VALUES (?, ?, ?, ?, ?)',
            [fullName, email, hashedPassword, phone, userType]
        );

        // Create JWT token
        const token = jwt.sign(
            { userId: result.insertId, userType },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        console.log('\n=== Registration Successful ===');
        console.log('New User:', {
            id: result.insertId,
            email,
            userType
        });
        console.log('Generated Token:', token);
        console.log('=========================\n');

        res.status(201).json({
            status: "success",
            data: {
                token,
                user: {
                    id: result.insertId,
                    fullName,
                    email,
                    userType
                }
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Server error during registration' });
    }
});

// Database connection
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'Sudharshan@1748',
    database: process.env.DB_NAME || 'skilled_workers_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Test database connection
pool.getConnection()
    .then(connection => {
        console.log('Database connected successfully');
        connection.release();
    })
    .catch(err => {
        console.error('Error connecting to database:', err);
    });

// For API routes, return 404 if no match is found
app.use('/api/*', (req, res) => {
    res.status(404).json({ message: 'API endpoint not found' });
});

// Start server
const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

// Error handling
process.on('unhandledRejection', (error) => {
    console.error('Unhandled promise rejection:', error);
}); 