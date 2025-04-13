const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { body, validationResult } = require('express-validator');

console.log('Review routes loaded');

// Create a new review
router.post('/', [
    body('bookingId').isInt().withMessage('Booking ID must be an integer'),
    body('workerId').isInt().withMessage('Worker ID must be an integer'),
    body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
    body('comment').optional().trim()
], async (req, res) => {
    try {
        console.log('\n=== Create Review Request ===');
        console.log('User:', req.user);
        console.log('Review data:', req.body);

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            console.log('Validation errors:', errors.array());
            return res.status(400).json({
                status: "error",
                errors: errors.array()
            });
        }

        const { bookingId, workerId, rating, comment } = req.body;
        const customerId = req.user.userId;

        // First check if booking exists
        const [bookings] = await pool.query(
            'SELECT b.*, w.full_name as worker_name, b.status as booking_status FROM bookings b JOIN users w ON b.worker_id = w.id WHERE b.id = ?',
            [bookingId]
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
            [bookingId]
        );

        if (existingReviews.length > 0) {
            return res.status(400).json({
                status: "error",
                message: "You have already reviewed this booking"
            });
        }

        console.log('Creating review for worker:', workerId);
        // Add review
        await pool.query(
            `INSERT INTO reviews (booking_id, customer_id, worker_id, rating, comment)
            VALUES (?, ?, ?, ?, ?)`,
            [bookingId, customerId, workerId, rating, comment]
        );

        // Update worker's rating
        const [workerStats] = await pool.query(
            `SELECT AVG(rating) as avg_rating, COUNT(*) as total_reviews 
            FROM reviews 
            WHERE worker_id = ?`,
            [workerId]
        );
        console.log('Updated worker stats:', workerStats[0]);

        await pool.query(
            `UPDATE worker_profiles 
            SET rating = ?,
                total_reviews = ?
            WHERE user_id = ?`,
            [workerStats[0].avg_rating, workerStats[0].total_reviews, workerId]
        );

        res.status(201).json({
            status: "success",
            message: "Review added successfully",
            data: {
                bookingId,
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

// Get reviews for a worker
router.get('/worker/:workerId', async (req, res) => {
    try {
        const { workerId } = req.params;
        
        const [reviews] = await pool.query(`
            SELECT r.*, u.full_name as customer_name 
            FROM reviews r
            JOIN users u ON r.customer_id = u.id
            WHERE r.worker_id = ?
            ORDER BY r.created_at DESC
        `, [workerId]);
        
        res.json({
            status: "success",
            data: reviews
        });
    } catch (error) {
        console.error('Error fetching worker reviews:', error);
        res.status(500).json({
            status: "error",
            message: "Error fetching worker reviews",
            error: error.message
        });
    }
});

// Get review stats for a worker
router.get('/worker/:workerId/stats', async (req, res) => {
    try {
        const { workerId } = req.params;
        
        const [stats] = await pool.query(`
            SELECT 
                COUNT(*) as total_reviews,
                AVG(rating) as average_rating,
                COUNT(CASE WHEN rating = 5 THEN 1 END) as five_star,
                COUNT(CASE WHEN rating = 4 THEN 1 END) as four_star,
                COUNT(CASE WHEN rating = 3 THEN 1 END) as three_star,
                COUNT(CASE WHEN rating = 2 THEN 1 END) as two_star,
                COUNT(CASE WHEN rating = 1 THEN 1 END) as one_star
            FROM reviews
            WHERE worker_id = ?
        `, [workerId]);
        
        res.json({
            status: "success",
            data: stats[0]
        });
    } catch (error) {
        console.error('Error fetching worker review stats:', error);
        res.status(500).json({
            status: "error",
            message: "Error fetching worker review stats",
            error: error.message
        });
    }
});

module.exports = router; 