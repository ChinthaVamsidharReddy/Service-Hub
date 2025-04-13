const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');

console.log('Booking routes loaded'); // Debug log

// Add this debugging function at the start of your route
async function debugDatabaseStructure() {
    try {
        // Check users table
        const [userColumns] = await pool.query('SHOW COLUMNS FROM users');
        console.log('Users Table Structure:', userColumns.map(c => c.Field));

        // Check worker_profiles table
        const [wpColumns] = await pool.query('SHOW COLUMNS FROM worker_profiles');
        console.log('Worker Profiles Table Structure:', wpColumns.map(c => c.Field));

        // Check bookings table
        const [bookingColumns] = await pool.query('SHOW COLUMNS FROM bookings');
        console.log('Bookings Table Structure:', bookingColumns.map(c => c.Field));

        return {
            users: userColumns,
            worker_profiles: wpColumns,
            bookings: bookingColumns
        };
    } catch (error) {
        console.error('Database Structure Check Error:', error);
        return null;
    }
}

// Create Booking
// Create Booking
router.post('/', [
    body('workerId').isInt().withMessage('Worker ID must be an integer'),
    body('serviceType').notEmpty().withMessage('Service type is required'),
    body('bookingDate').isDate().withMessage('Valid booking date is required'),
    body('startTime').matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/).withMessage('Valid start time is required (HH:MM:SS)'),
    body('endTime').matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/).withMessage('Valid end time is required (HH:MM:SS)'),
    body('description').optional()
], async (req, res) => {
    console.log('\n=== Create Booking Request ===');
    console.log('User :', req.user);
    console.log('Request body:', req.body);
    
    try {
        // Validate request
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            console.log('Validation errors:', errors.array());
            return res.status(400).json({ 
                status: "error",
                errors: errors.array() 
            });
        }

        const customerId = req.user.userId;
        const { workerId, serviceType, bookingDate, startTime, endTime, description } = req.body;

        console.log('Checking worker profile for workerId:', workerId);
        // Check if worker exists and is available
        const [worker] = await pool.query(
            'SELECT * FROM worker_profiles WHERE user_id = ?',
            [workerId]
        );
        console.log('Worker profile found:', worker[0]);

        if (!worker[0]) {
            return res.status(404).json({
                status: "error",
                message: "Worker not found"
            });
        }

        if (!worker[0].availability) {
            return res.status(400).json({
                status: "error",
                message: "Worker is not available"
            });
        }

        // Calculate total amount based on hourly rate and duration
        const startDateTime = new Date(`${bookingDate} ${startTime}`);
        const endDateTime = new Date(`${bookingDate} ${endTime}`);
        const durationHours = (endDateTime - startDateTime) / (1000 * 60 * 60);
        const totalAmount = worker[0].hourly_rate * durationHours;
        const platformFee = totalAmount * 0.4; // 40% platform fee

        // Check if platformFee is a number
        if (typeof platformFee !== 'number') {
            console.log('Platform fee is not a number:', platformFee);
            return res.status(400).json({
                status: 'error',
                message: 'Platform fee must be a number'
            });
        }

        // Log the platform fee
        console.log('Calculated platform fee:', platformFee);

        console.log('Creating booking with:', {
            customerId,
            workerId,
            serviceType,
            bookingDate,
            startTime,
            endTime,
            totalAmount,
            platformFee
        });

        // Create booking
        const [result] = await pool.query(
            `INSERT INTO bookings 
            (customer_id, worker_id, service_type, booking_date, start_time, end_time, total_amount, platform_fee, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
            [customerId, workerId, serviceType, bookingDate, startTime, endTime, totalAmount, platformFee]
        );

        console.log('Booking created with ID:', result.insertId);

        // Fetch the created booking
        const [booking] = await pool.query(
            `SELECT b.*, 
                    b.platform_fee,
                    c.full_name as customer_name, 
                    w.full_name as worker_name
             FROM bookings b
             JOIN users c ON b.customer_id = c.id
             JOIN users w ON b.worker_id = w.id
             WHERE b.id = ?`,
            [result.insertId]
        );

        console.log('Fetched booking details:', booking[0]);
        console.log('Fetched platform fee from booking:', booking[0].platform_fee);

        res.status(201).json({
            status: "success",
            message: "Booking created successfully",
            data: booking[0],
            platformfee: booking[0].platform_fee // Send platform fee to frontend
        });
        

    } catch (error) {
        console.error('Error creating booking:', error);
        res.status(500).json({
            status: "error",
            message: "Error creating booking",
            error: error.message
        });
    }
});

// Get Customer's Bookings
router.get('/customer', async (req, res) => {
    try {
        const customerId = req.user.userId;
        console.log('Fetching bookings for customer:', customerId);

        // Basic query without worker_profiles columns first
        const query = `
            SELECT 
                b.*, 
                b.total_amount,
                b.platform_fee,
                u.full_name as worker_name, 
                u.email as worker_email,
                u.phone as worker_phone,
                wp.hourly_rate,
                wp.rating as worker_rating,
                wp.total_reviews,
                wp.location as worker_location
            FROM bookings b
            JOIN users u ON b.worker_id = u.id
            LEFT JOIN worker_profiles wp ON b.worker_id = wp.user_id
            WHERE b.customer_id = ?
            ORDER BY b.booking_date DESC
        `;

        console.log('Executing Customer Bookings Query:', query);
        

        const [bookings] = await pool.query(query, [customerId]);

        // Process bookings to add more context
        const processedBookings = bookings.map(booking => ({
            id: booking.id,
            customer_id: booking.customer_id,
            platformFee: booking.platform_fee,
            worker_id: booking.worker_id,
            service_type: booking.service_type,
            booking_date: booking.booking_date,
            start_time: booking.start_time,
            end_time: booking.end_time,
            status: booking.status,
            total_amount: booking.total_amount,
            worker_details: {
                name: booking.worker_name || 'Unknown',
                email: booking.worker_email || 'N/A',
                phone: booking.worker_phone || 'N/A',
                location: booking.worker_location || 'Not specified',
                hourly_rate: booking.hourly_rate || 0,
                rating: booking.worker_rating || 0,
                total_reviews: booking.total_reviews || 0
            }
        }));

        res.json({
            status: "success",
            data: processedBookings,
            total_bookings: processedBookings.length,
            booking_statuses: {
                total: processedBookings.length,
                by_status: processedBookings.reduce((acc, booking) => {
                    acc[booking.status] = (acc[booking.status] || 0) + 1;
                    return acc;
                }, {})
            }
        });

    } catch (error) {
        console.error('Error fetching customer bookings:', {
            message: error.message,
            name: error.name,
            stack: error.stack,
            sqlMessage: error.sqlMessage,
            sqlQuery: error.sql
        });

        res.status(500).json({
            status: "error",
            message: "Error fetching bookings",
            errorDetails: {
                message: error.message,
                sqlError: error.sqlMessage
            }
        });
    }
});

// Get Worker's Bookings
router.get('/worker', async (req, res, next) => {
    try {
        console.log('\n=== Fetch Worker Bookings ===');
        console.log('Full Request Details:', {
            user: req.user,
            headers: req.headers
        });

        // Validate authentication
        if (!req.user || !req.user.userId) {
            console.error('Authentication Failure: No valid user');
            return res.status(401).json({
                status: "error",
                message: "Unauthorized: Invalid authentication"
            });
        }

        const workerId = req.user.userId;
        console.log('Fetching bookings for workerId:', workerId);

        // Comprehensive database checks
        const [userCheck] = await pool.query(
            'SELECT id, user_type FROM users WHERE id = ?',
            [workerId]
        );

        if (userCheck.length === 0) {
            console.error('User Not Found:', workerId);
            return res.status(404).json({
                status: "error",
                message: "User profile not found"
            });
        }

        if (userCheck[0].user_type !== 'worker') {
            console.error('User is not a worker:', userCheck[0].user_type);
            return res.status(403).json({
                status: "error",
                message: "Access denied. Not a worker account"
            });
        }

        // Dynamically check available columns
        const [columns] = await pool.query('SHOW COLUMNS FROM users');
        const userColumns = columns.map(col => col.Field);
        
        console.log('Available User Table Columns:', userColumns);

        // Dynamically select location column
        const locationColumn = userColumns.includes('location') 
            ? 'u.location' 
            : "'Not specified' as customer_location";

        // Detailed booking query with dynamic column selection
        const query = `
            SELECT 
                b.id, 
                b.customer_id, 
                b.worker_id,
                b.service_type, 
                b.booking_date, 
                b.start_time, 
                b.end_time, 
                b.status, 
                b.total_amount,
                u.full_name as customer_name, 
                u.email as customer_email,
                u.phone as customer_phone,
                ${locationColumn}
            FROM bookings b
            JOIN users u ON b.customer_id = u.id
            WHERE b.worker_id = ?
            ORDER BY b.booking_date DESC
        `;

        console.log('Executing Booking Query:', {
            workerId,
            query: query
        });

        const [bookings] = await pool.query(query, [workerId]);

        console.log('Booking Fetch Details:', {
            workerId,
            bookingsCount: bookings.length,
            firstBooking: bookings[0] || 'No bookings found'
        });

        // Process bookings with comprehensive error handling
        const processedBookings = bookings.map(booking => {
            try {
                return {
                    id: booking.id,
                    customer_id: booking.customer_id,
                    worker_id: booking.worker_id,
                    service_type: booking.service_type,
                    booking_date: booking.booking_date,
                    start_time: booking.start_time,
                    end_time: booking.end_time,
                    status: booking.status,
                    total_amount: booking.total_amount,
                    customer_details: {
                        name: booking.customer_name || 'Unknown',
                        email: booking.customer_email || 'N/A',
                        phone: booking.customer_phone || 'N/A',
                        location: booking.customer_location || 'Not specified'
                    }
                };
            } catch (processingError) {
                console.error('Booking Processing Error:', {
                    bookingId: booking.id,
                    error: processingError.message
                });
                return null;
            }
        }).filter(booking => booking !== null);

        // Return response with detailed booking information
        res.json({
            status: "success",
            data: processedBookings,
            total_bookings: processedBookings.length,
            booking_statuses: processedBookings.reduce((acc, booking) => {
                acc[booking.status] = (acc[booking.status] || 0) + 1;
                return acc;
            }, {})
        });

    } catch (error) {
        // Comprehensive error logging
        console.error('Comprehensive Worker Bookings Fetch Error:', {
            message: error.message,
            name: error.name,
            stack: error.stack,
            sqlMessage: error.sqlMessage,
            sqlQuery: error.sql
        });

        // Pass to error handling middleware
        next(error);
    }
});

// Update Booking Status
router.put('/:id/status', [
    body('status')
        .trim()  // Remove whitespace
        .notEmpty().withMessage('Status is required')
        .isString().withMessage('Status must be a string')
        .toLowerCase()  // Convert to lowercase
        .custom((value, { req }) => {
            const validStatuses = [
                'pending',     // Initial booking state
                'confirmed',   // Booking accepted by worker
                'in_progress', // Booking is currently being worked on
                'completed',   // Booking successfully finished
                'cancelled',   // Booking cancelled by either party
                'rejected'     // Booking rejected by worker
            ];
            
            // Validation logging
            console.log('\n=== Status Validation ===');
            console.log('Received Status:', value);
            console.log('Valid Statuses:', validStatuses);

            // Strict validation
            if (!validStatuses.includes(value)) {
                console.error(`Invalid status attempted: "${value}"`);
                throw new Error(`Invalid booking status. Must be one of: ${validStatuses.join(', ')}`);
            }
            
            return true;
        })
], async (req, res) => {
    try {
        console.log('\n=== Update Booking Status ===');
        console.log('User:', JSON.stringify(req.user, null, 2));
        console.log('Booking ID:', req.params.id);
        console.log('New Status:', req.body.status);

        const { status } = req.body;
        const { id } = req.params;
        const userId = req.user.userId;
        const userType = req.user.userType;

        console.log('Checking booking permissions for user:', userId);
        
        // Verify booking exists and user has permission
        const [bookings] = await pool.query(
            'SELECT * FROM bookings WHERE id = ? AND (worker_id = ? OR customer_id = ?)',
            [id, userId, userId]
        );
        console.log('Found bookings:', JSON.stringify(bookings, null, 2));

        if (bookings.length === 0) {
            return res.status(404).json({
                status: "error",
                message: "Booking not found or unauthorized"
            });
        }

        const booking = bookings[0];

        // Comprehensive status transition logic with role-based restrictions
        const allowedTransitions = {
            'pending': {
                worker: ['confirmed', 'rejected'],
                customer: ['cancelled']
            },
            'confirmed': {
                worker: ['in_progress', 'cancelled'],
                customer: ['cancelled']
            },
            'in_progress': {
                worker: ['completed', 'cancelled'],
                customer: ['cancelled']
            },
            'completed': {},
            'cancelled': {},
            'rejected': {}
        };

        // Check if the status transition is allowed based on user role
        const roleTransitions = allowedTransitions[booking.status] || {};
        const allowedStatuses = roleTransitions[userType] || [];

        console.log('Status Transition Check:', {
            currentStatus: booking.status,
            requestedStatus: status,
            userType,
            allowedStatuses
        });

        if (!allowedStatuses.includes(status)) {
            console.error('Invalid status transition attempted', {
                currentStatus: booking.status,
                requestedStatus: status,
                userType,
                allowedStatuses
            });

            return res.status(400).json({
                status: "error",
                message: `Invalid status transition`,
                currentStatus: booking.status,
                requestedStatus: status,
                userRole: userType,
                allowedTransitions: allowedStatuses
            });
        }

        console.log('Updating booking status to:', status);
        // Update status
        await pool.query(
            'UPDATE bookings SET status = ? WHERE id = ?',
            [status, id]
        );

        // Fetch updated booking with additional details
        const [updatedBooking] = await pool.query(
            `SELECT b.*, 
                    c.full_name as customer_name,
                    w.full_name as worker_name
             FROM bookings b
             JOIN users c ON b.customer_id = c.id
             JOIN users w ON b.worker_id = w.id
             WHERE b.id = ?`,
            [id]
        );

        console.log('Updated booking:', JSON.stringify(updatedBooking[0], null, 2));

        res.json({
            status: "success",
            message: "Booking status updated successfully",
            data: {
                booking: updatedBooking[0],
                previousStatus: booking.status,
                newStatus: status
            }
        });
    } catch (error) {
        console.error('Error updating booking status:', error);
        res.status(500).json({
            status: "error",
            message: "Server error updating booking status",
            errorDetails: error.message
        });
    }
});

// Add Review
router.post('/:id/review', [
    body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
    body('comment').optional().trim()
], async (req, res) => {
    try {
        console.log('\n=== Create Review Request ===');
        console.log('User:', req.user);
        console.log('Booking ID:', req.params.id);
        console.log('Review data:', req.body);

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            console.log('Validation errors:', errors.array());
            return res.status(400).json({
                status: "error",
                errors: errors.array()
            });
        }

        const { rating, comment } = req.body;
        const { id } = req.params;
        const customerId = req.user.userId;

        // First check if booking exists
        const [bookings] = await pool.query(
            'SELECT b.*, w.full_name as worker_name, b.status as booking_status FROM bookings b JOIN users w ON b.worker_id = w.id WHERE b.id = ?',
            [id]
        );
        console.log('Found booking:', bookings[0]);

        if (bookings.length === 0) {
            return res.status(404).json({
                status: "error",
                message: "Booking not found"
            });
        }

        const booking = bookings[0];

        // Check if user is the customer
        if (booking.customer_id !== customerId) {
            return res.status(403).json({
                status: "error",
                message: "You are not authorized to review this booking"
            });
        }

        // Check if booking is completed
        if (booking.status !== 'completed') {
            return res.status(400).json({
                status: "error",
                message: "Booking must be completed before reviewing",
                currentStatus: booking.status
            });
        }

        // Check if review already exists
        const [existingReviews] = await pool.query(
            'SELECT * FROM reviews WHERE booking_id = ?',
            [id]
        );

        if (existingReviews.length > 0) {
            return res.status(400).json({
                status: "error",
                message: "You have already reviewed this booking"
            });
        }

        console.log('Creating review for worker:', booking.worker_id);
        // Add review
        await pool.query(
            `INSERT INTO reviews (booking_id, customer_id, worker_id, rating, comment)
            VALUES (?, ?, ?, ?, ?)`,
            [id, customerId, booking.worker_id, rating, comment]
        );

        // Update worker's rating
        const [workerStats] = await pool.query(
            `SELECT AVG(rating) as avg_rating, COUNT(*) as total_reviews 
            FROM reviews 
            WHERE worker_id = ?`,
            [booking.worker_id]
        );
        console.log('Updated worker stats:', workerStats[0]);

        await pool.query(
            `UPDATE worker_profiles 
            SET rating = ?,
                total_reviews = ?
            WHERE user_id = ?`,
            [workerStats[0].avg_rating, workerStats[0].total_reviews, booking.worker_id]
        );

        res.status(201).json({
            status: "success",
            message: "Review added successfully",
            data: {
                bookingId: id,
                workerName: booking.worker_name,
                rating,
                comment,
                workerNewRating: workerStats[0].avg_rating,
                workerTotalReviews: workerStats[0].total_reviews
            }
        });
    } catch (error) {
        console.error('Error creating review:', error);
        res.status(500).json({
            status: "error",
            message: "Error creating review",
            error: error.message
        });
    }
});

async function checkWorkerProfileColumns() {
    try {
        const [columns] = await pool.query('SHOW COLUMNS FROM worker_profiles');
        console.log('Worker Profiles Table Columns:');
        columns.forEach(column => {
            console.log(`- ${column.Field} (Type: ${column.Type})`);
        });
        return columns;
    } catch (error) {
        console.error('Error inspecting worker_profiles table columns:', error);
    }
}

// Call this function to inspect your table structure
checkWorkerProfileColumns();

async function testDatabaseConnection() {
    try {
        const connection = await pool.getConnection();
        console.log('Database Connection Test:');
        console.log('Connection Successful');
        
        // Comprehensive connection verification
        const [testResult] = await connection.query('SELECT 1 AS test');
        console.log('Test Query Result:', testResult);
        
        // Check table existence
        const [tables] = await connection.query(
            "SHOW TABLES LIKE 'bookings'"
        );
        console.log('Bookings Table Exists:', tables.length > 0);
        
        connection.release();
        return true;
    } catch (error) {
        console.error('Comprehensive Database Connection Error:', {
            message: error.message,
            name: error.name,
            stack: error.stack
        });
        return false;
    }
}

// Call during server startup
testDatabaseConnection();

function authenticateToken(req, res, next) {
    try {
        console.log('\n=== Authentication Middleware ===');
        console.log('Full Request Details:', {
            method: req.method,
            path: req.path,
            headers: req.headers
        });

        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            console.error('No Token Provided');
            return res.status(401).json({
                status: "error",
                message: "Authentication token missing"
            });
        }

        jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
            if (err) {
                console.error('Token Verification Failed:', {
                    error: err.message,
                    name: err.name,
                    token: token
                });

                return res.status(403).json({
                    status: "error",
                    message: "Invalid or expired token",
                    errorDetails: {
                        message: err.message,
                        name: err.name
                    }
                });
            }

            // Comprehensive token payload validation
            if (!decoded.userId || !decoded.userType) {
                console.error('Invalid Token Payload:', decoded);
                return res.status(403).json({
                    status: "error",
                    message: "Invalid authentication credentials"
                });
            }

            req.user = decoded;
            next();
        });
    } catch (error) {
        console.error('Authentication Middleware Error:', {
            message: error.message,
            name: error.name,
            stack: error.stack
        });
        next(error);
    }
}

const errorHandler = (err, req, res, next) => {
    console.error('\n=== Unhandled Error ===');
    console.error('Error Details:', {
        message: err.message,
        name: err.name,
        stack: err.stack,
        method: req.method,
        path: req.path,
        body: req.body,
        headers: req.headers
    });

    res.status(500).json({
        status: "error",
        message: "An unexpected error occurred",
        errorDetails: {
            message: err.message,
            name: err.name
        }
    });
};

async function initializeDatabase() {
    try {
        // Create worker_profiles table if it doesn't exist
        await pool.query(`
            CREATE TABLE IF NOT EXISTS worker_profiles (
                id INT PRIMARY KEY AUTO_INCREMENT,
                user_id INT NOT NULL,
                hourly_rate DECIMAL(10,2) DEFAULT 0,
                rating DECIMAL(3,2) DEFAULT 0,
                total_reviews INT DEFAULT 0,
                location VARCHAR(255),
                FOREIGN KEY (user_id) REFERENCES users(id)
            )
        `);

        console.log('Database initialization complete');
        return true;
    } catch (error) {
        console.error('Database initialization error:', error);
        return false;
    }
}

// Call this during server startup
initializeDatabase();

// Get Booking Details by ID
router.get('/:id', async (req, res) => {
    try {
        const bookingId = req.params.id;
        const userId = req.user.userId;
        const userType = req.user.userType;

        console.log(`Fetching booking ${bookingId} for user ${userId} (${userType})`);

        // Build query based on user type
        let query;
        let queryParams;

        if (userType === 'customer') {
            query = `
                SELECT b.*, 
                    b.total_amount,
                    b.platform_fee,
                    u.full_name as worker_name, 
                    u.email as worker_email,
                    u.phone as worker_phone,
                    wp.hourly_rate,
                    wp.rating as worker_rating,
                    wp.total_reviews,
                    wp.location as worker_location
                FROM bookings b
                JOIN users u ON b.worker_id = u.id
                LEFT JOIN worker_profiles wp ON b.worker_id = wp.user_id
                WHERE b.id = ? AND b.customer_id = ?
            `;
            queryParams = [bookingId, userId];
        } else if (userType === 'worker') {
            query = `
                SELECT b.*, 
                    b.total_amount,
                    b.platform_fee,
                    u.full_name as customer_name, 
                    u.email as customer_email,
                    u.phone as customer_phone
                FROM bookings b
                JOIN users u ON b.customer_id = u.id
                WHERE b.id = ? AND b.worker_id = ?
            `;
            queryParams = [bookingId, userId];
        } else {
            return res.status(403).json({
                status: "error",
                message: "Unauthorized user type"
            });
        }

        const [bookings] = await pool.query(query, queryParams);

        if (bookings.length === 0) {
            return res.status(404).json({
                status: "error",
                message: "Booking not found or unauthorized"
            });
        }

        // Process booking to add context
        const booking = bookings[0];
        let processedBooking;

        if (userType === 'customer') {
            processedBooking = {
                id: booking.id,
                customer_id: booking.customer_id,
                worker_id: booking.worker_id,
                service_type: booking.service_type,
                booking_date: booking.booking_date,
                start_time: booking.start_time,
                end_time: booking.end_time,
                status: booking.status,
                total_amount: parseFloat(booking.total_amount) || 0,
                platform_fee: parseFloat(booking.platform_fee) || 0,
                created_at: booking.created_at,
                worker_details: {
                    name: booking.worker_name || 'Unknown',
                    email: booking.worker_email || 'N/A',
                    phone: booking.worker_phone || 'N/A',
                    location: booking.worker_location || 'Not specified',
                    hourly_rate: booking.hourly_rate || 0,
                    rating: booking.worker_rating || 0,
                    total_reviews: booking.total_reviews || 0
                }
            };
        } else {
            processedBooking = {
                id: booking.id,
                customer_id: booking.customer_id,
                worker_id: booking.worker_id,
                service_type: booking.service_type,
                booking_date: booking.booking_date,
                start_time: booking.start_time,
                end_time: booking.end_time,
                status: booking.status,
                total_amount: parseFloat(booking.total_amount) || 0,
                platform_fee: parseFloat(booking.platform_fee) || 0,
                created_at: booking.created_at,
                customer_details: {
                    name: booking.customer_name || 'Unknown',
                    email: booking.customer_email || 'N/A',
                    phone: booking.customer_phone || 'N/A'
                }
            };
        }

        console.log('Fetched booking details:', processedBooking);

        res.json({
            status: "success",
            data: processedBooking
        });

    } catch (error) {
        console.error('Error fetching booking details:', error);
        res.status(500).json({
            status: "error",
            message: "Error fetching booking details",
            error: error.message
        });
    }
});

module.exports = router; 