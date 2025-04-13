        //change -2
        const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const QRCode = require('qrcode'); // QR Code generation library
const { body, validationResult } = require('express-validator');

// Payment Gateway Service (Hypothetical)
const paymentGateway = {
    processPayment: async ({ amount, paymentMethod, transactionId, customerId, bookingId }) => {
        // Here you would integrate with a real payment gateway API
        try {
            // Simulate payment processing
            if (paymentMethod === 'credit_card' || paymentMethod === 'debit_card') {
                // Call to payment gateway API for card processing
                return { success: true }; // Simulate successful payment
            } else if (paymentMethod === 'upi') {
                // Call to UPI payment processing
                return { success: true }; // Simulate successful payment
            } else if (paymentMethod === 'paypal') {
                // Call to PayPal API
                return { success: true }; // Simulate successful payment
            } else if (paymentMethod === 'stripe') {
                // Call to Stripe API
                return { success: true }; // Simulate successful payment
            }
            return { success: false, error: 'Payment method not supported' };
        } catch (error) {
            console.error('Payment Gateway Error:', error);
            return { success: false, error: error.message };
        }
    }
};

const YOUR_UPI_ID = 'vamsidharreddy831@oksbi'; // Replace with your actual UPI ID

// Generate QR Code for UPI Payment
router.get('/qr-code/:bookingId', async (req, res) => {
    const bookingId = req.params.bookingId;

    try {
        // Fetch the total amount for the booking from the database
        const [booking] = await pool.query('SELECT total_amount FROM bookings WHERE id = ?', [bookingId]);
        
        if (booking.length === 0) {
            return res.status(404).json({ status: 'error', message: 'Booking not found' });
        }

        const { total_amount } = booking[0]; // Use total_amount from the booking

        // Create UPI Payment Link with total_amount and your UPI ID
        const upiLink = `upi://pay?pa=${YOUR_UPI_ID}&pn=Merchant&mc=&tid=&tr=&tn=Payment for booking ID: ${bookingId}&am=${total_amount}&cu=INR`;

        // Generate QR Code
        const qrCodeData = await QRCode.toDataURL(upiLink);
        
        res.json({
            status: 'success',
            data: {
                qrCode: qrCodeData
            }
        });
    } catch (error) {
        console.error('Error generating QR code:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to generate QR code'
        });
    }
});

router.post('/payment', async (req, res) => {
    // Detailed request logging
    console.log('\n=== Payment Request Received ===');
    console.log('Headers:', {
        auth: req.headers.authorization ? 'Present' : 'Missing',
        contentType: req.headers['content-type']
    });
    console.log('Request body:', req.body);
    console.log('User from auth:', req.user);
    
    // Extract necessary fields from the request body
    const { bookingId, paymentMethod, transactionId } = req.body;
    
    // Validate required fields
    if (!bookingId) {
        console.log('Error: Missing bookingId');
        return res.status(400).json({ 
            status: 'error', 
            message: 'Booking ID is required' 
        });
    }
    
    if (!paymentMethod) {
        console.log('Error: Missing paymentMethod');
        return res.status(400).json({ 
            status: 'error', 
            message: 'Payment method is required' 
        });
    }
    
    if (!transactionId) {
        console.log('Error: Missing transactionId');
        return res.status(400).json({ 
            status: 'error', 
            message: 'Transaction ID is required for payment verification' 
        });
    }

    // Get customerId from the authenticated user
    const customerId = req.user.userId; // Assuming req.user is set by your authentication middleware
    console.log('Customer ID from token:', customerId);

    try {
        // Fetch the booking details to get the worker_id, amount and platform_fee directly from the database
        console.log(`Fetching booking details for ID: ${bookingId}, Customer: ${customerId}`);
        const [bookings] = await pool.query(
            'SELECT worker_id, total_amount, platform_fee FROM bookings WHERE id = ? AND customer_id = ?', 
            [bookingId, customerId]
        );

        if (bookings.length === 0) {
            console.log(`No booking found with ID ${bookingId} for customer ${customerId}`);
            return res.status(404).json({ 
                status: 'error', 
                message: 'Booking not found or unauthorized' 
            });
        }

        const booking = bookings[0];
        const workerId = booking.worker_id;
        const amount = booking.total_amount;
        const platformFee = booking.platform_fee;
        
        console.log("Booking details from database:", {
            bookingId,
            workerId,
            amount,
            platformFee
        });

        // Check if payment already exists for this booking
        console.log(`Checking for existing payments for booking ${bookingId}`);
        const [existingPayments] = await pool.query(
            'SELECT * FROM payments WHERE booking_id = ?',
            [bookingId]
        );

        if (existingPayments.length > 0) {
            console.log(`Payment already exists for booking ${bookingId}`);
            return res.status(400).json({
                status: "error",
                message: "Payment already exists for this booking"
            });
        }

        // Validate payment method
        const validMethods = ['credit_card', 'debit_card', 'upi', 'card', 'qr'];
        if (!validMethods.includes(paymentMethod)) {
            console.log(`Invalid payment method: ${paymentMethod}`);
            return res.status(400).json({
                status: "error",
                message: `Invalid payment method: ${paymentMethod}. Allowed methods: ${validMethods.join(', ')}`
            });
        }

        // Insert payment record into the database
        console.log(`Creating payment record with method: ${paymentMethod}`);
        const [result] = await pool.query(
            `INSERT INTO payments 
            (booking_id, customer_id, worker_id, amount, platform_fee, payment_method, transaction_id, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, 'completed')`,
            [bookingId, customerId, workerId, amount, platformFee, paymentMethod, transactionId]
        );

        // Update booking status to completed after successful payment
        console.log(`Updating booking ${bookingId} status to completed`);
        await pool.query(
            'UPDATE bookings SET status = "completed" WHERE id = ?',
            [bookingId]
        );

        console.log(`Payment successful. Payment ID: ${result.insertId}`);
        res.json({
            status: 'success',
            message: 'Payment recorded successfully',
            data: {
                paymentId: result.insertId,
                amount,
                platformFee,
                transactionId
            }
        });
    } catch (error) {
        console.error('Error processing payment:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to process payment',
            error: error.message
        });
    }
});
// Create Payment
router.post('/', [
    body('bookingId').isInt().withMessage('Booking ID must be an integer'),
    body('amount').isFloat({ min: 0 }).withMessage('Amount must be a positive number'),
    body('platformFee').isFloat({ min: 0 }).withMessage('Platform fee must be a positive number'),
    body('paymentMethod').isIn(['credit_card', 'debit_card', 'upi', 'paypal', 'stripe']).withMessage('Invalid payment method'),
    body('transactionId').notEmpty().withMessage('Transaction ID is required')
], async (req, res) => {
    try {
        console.log('\n=== Create Payment Request ===');
        console.log('User   :', req.user);
        console.log('Payment data:', req.body);

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            console.log('Validation errors:', errors.array());
            return res.status(400 ).json({
                status: "error",
                errors: errors.array()
            });
        }

        const { bookingId, amount, platformFee, paymentMethod, transactionId  } = req.body;
        const customerId = req.user.userId;
        

        // Verify booking exists and belongs to the customer
        const [bookings,] = await pool.query(
            'SELECT * FROM bookings WHERE id = ? AND customer_id = ?',
            [bookingId, customerId]
        );

        if (bookings.length === 0) {
            return res.status(404).json({
                status: "error",
                message: "Booking not found or unauthorized"
            });
        }

        const booking = bookings[0];

        // Check if payment already exists for this booking
        const [existingPayments] = await pool.query(
            'SELECT * FROM payments WHERE booking_id = ?',
            [bookingId]
        );

        if (existingPayments.length > 0) {
            return res.status(400).json({
                status: "error",
                message: "Payment already exists for this booking"
            });
        }

        // Process payment through the payment gateway
        const paymentResult = await paymentGateway.processPayment({
            amount,
            paymentMethod: paymentMethod.toLowerCase(), // Convert to lowercase
            transactionId,
            customerId,
            bookingId
        });

        if (!paymentResult.success) {
            return res.status(500).json({
                status: "error",
                message: "Payment processing failed",
                details: paymentResult.error
            });
        }

        // Create payment record
        const [result] = await pool.query(
            `INSERT INTO payments 
            (booking_id, customer_id, worker_id, amount, platform_fee, payment_method, transaction_id, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, 'completed')`,
            [bookingId, customerId, booking.worker_id, amount, platformFee, paymentMethod, transactionId]
        );

        // Update booking status to confirmed after successful payment
        await pool.query(
            'UPDATE bookings SET status = "confirmed" WHERE id = ?',
            [bookingId]
        );

        // Fetch the created payment with related information
        const [payment] = await pool.query(
            `SELECT p.*, 
                    b.service_type,
                    c.full_name as customer_name,
                    w.full_name as worker_name
             FROM payments p
             JOIN bookings b ON p.booking_id = b.id
             JOIN users c ON p.customer_id = c.id
             JOIN users w ON p.worker_id = w.id
             WHERE p.id = ?`,
            [result.insertId]
        );

        res.status(201).json({
            status: "success",
            message: "Payment processed successfully",
            data: payment[0]
        });

    } catch (error) {
        console.error('Error processing payment:', error);
        res.status(500).json({
            status: "error",
            message: "Error processing payment",
            error: error.message
        });
    }
});

// Get Customer's Payment History
router.get('/customer', async (req, res) => {
    try {
        const customerId = req.user.userId;
        const [payments] = await pool.query(
            `SELECT p.*, 
                    b.service_type,
                    w.full_name as worker_name
             FROM payments p
             JOIN bookings b ON p.booking_id = b.id
             JOIN users w ON p.worker_id = w.id
             WHERE p.customer_id = ?
             ORDER BY p.created_at DESC`,
            [customerId]
        );

        res.json({
            status: "success",
            data: payments
        });
    } catch (error) {
        console.error('Error fetching payments:', error);
        res.status(500).json({
            status: "error",
            message: "Error fetching payment history"
        });
    }
});

// Get Worker's Payment History
router.get('/worker', async (req, res) => {
    try {
        const workerId = req.user.userId;
        const [payments] = await pool.query(
            `SELECT p.*, 
                    b.service_type,
                    c.full_name as customer_name
             FROM payments p
             JOIN bookings b ON p.booking_id = b.id
             JOIN users c ON p.customer_id = c.id
             WHERE p.worker_id = ?
             ORDER BY p.created_at DESC`,
            [workerId]
        );

        res.json({
            status: "success",
            data: payments
        });
    } catch (error) {
        console.error('Error fetching payments:', error);
        res.status(500).json({
            status: "error",
            message: "Error fetching payment history"
        });
    }
});

// Check if payment exists for a booking
router.get('/check/:bookingId', async (req, res) => {
    try {
        const bookingId = req.params.bookingId;
        const customerId = req.user.userId;
        
        console.log(`Checking payment status for booking ${bookingId}`);
        
        // First verify the booking belongs to this customer
        const [bookings] = await pool.query(
            'SELECT id FROM bookings WHERE id = ? AND customer_id = ?',
            [bookingId, customerId]
        );
        
        if (bookings.length === 0) {
            return res.status(404).json({
                status: 'error',
                message: 'Booking not found or unauthorized'
            });
        }
        
        // Check if payment exists
        const [payments] = await pool.query(
            'SELECT id, status, created_at FROM payments WHERE booking_id = ?',
            [bookingId]
        );
        
        if (payments.length === 0) {
            return res.json({
                status: 'success',
                data: {
                    hasPayment: false
                }
            });
        }
        
        return res.json({
            status: 'success',
            data: {
                hasPayment: true,
                paymentId: payments[0].id,
                paymentStatus: payments[0].status,
                paymentDate: payments[0].created_at
            }
        });
    } catch (error) {
        console.error('Error checking payment:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to check payment status',
            error: error.message
        });
    }
});

module.exports = router;