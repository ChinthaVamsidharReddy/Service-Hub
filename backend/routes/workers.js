const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { body, validationResult } = require('express-validator');

// Search Workers
router.get('/search', async (req, res) => {
    try {
        const { serviceType, maxHourlyRate, location } = req.query;
        
        console.log('\n=== Worker Search Request ===');
        console.log('Raw Request Query:', req.query);
        console.log('Service Type:', serviceType);
        console.log('Max Hourly Rate:', maxHourlyRate);
        console.log('Location:', location);
        
        // Validate service type and normalize it
        const validServiceTypes = ['home_cleaning', 'plumbing', 'electrical_work', 'painting','carpentry','pest_control','appliance_repair','gardening',''];
        const normalizedServiceType = serviceType ? serviceType.toLowerCase().trim() : '';
        
        console.log('Normalized Service Type:', normalizedServiceType);
        
        if (!validServiceTypes.includes(normalizedServiceType)) {
            console.log('Invalid service type provided:', normalizedServiceType);
            return res.status(400).json({
                status: "error",
                message: "Invalid service type. Valid types are: home cleaning, plumbing, electrical work, painting"
            });
        }
        
        // Service type is required for search
        if (!normalizedServiceType) {
            console.log('No service type provided');
            return res.status(400).json({
                status: "error",
                message: "Service type is required for searching workers"
            });
        }

        // Build base query
        let query = `
            SELECT 
                wp.*,
                u.full_name,
                u.email,
                u.phone
            FROM worker_profiles wp
            JOIN users u ON wp.user_id = u.id
            WHERE wp.service_type = ?
        `;
        
        const params = [normalizedServiceType];
        
        if (maxHourlyRate) {
            query += ' AND wp.hourly_rate <= ?';
            params.push(parseFloat(maxHourlyRate));
        }
        
        if (location) {
            query += ' AND wp.location LIKE ?';
            params.push(`%${location}%`);
        }
        
        // Order by rating
        query += ' ORDER BY wp.rating DESC';

        console.log('\nFinal SQL Query:', query);
        console.log('Query Parameters:', params);
        
        // Execute query and get workers
        const [workers] = await pool.query(query, params);
        
        console.log('\nDatabase Query Results:');
        console.log('Number of workers found:', workers.length);
        if (workers.length > 0) {
            console.log('First worker example:', {
                id: workers[0].user_id,
                service_type: workers[0].service_type,
                location: workers[0].location
            });
        }

        // Transform workers to include only necessary fields
        const formattedWorkers = workers.map(worker => ({
            id: worker.user_id,
            name: worker.full_name,
            serviceType: worker.service_type,
            hourlyRate: worker.hourly_rate,
            location: worker.location,
            experience: worker.experience_years,
            rating: worker.rating || 0,
            contact: {
                email: worker.email,
                phone: worker.phone
            }
        }));

        console.log('\nFormatted Response:');
        console.log('Number of formatted workers:', formattedWorkers.length);
        
        // Prepare response
        const response = {
            status: "success",
            service: normalizedServiceType,
            total_workers_found: formattedWorkers.length,
            message: formattedWorkers.length > 0 
                ? `Found ${formattedWorkers.length} workers for ${normalizedServiceType}`
                : `No workers found for ${normalizedServiceType}`,
            data: formattedWorkers,
            filters_applied: {
                serviceType: normalizedServiceType,
                maxHourlyRate: maxHourlyRate || 'none',
                location: location || 'none'
            }
        };

        console.log('\nSending Response:', JSON.stringify(response, null, 2));
        
        return res.json(response);
        
    } catch (error) {
        console.error('\nError in worker search:', error);
        console.error('Error stack:', error.stack);
        return res.status(500).json({
            status: "error",
            message: "Error searching workers",
            details: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

// Create/Update Worker Profile
router.post('/profile', [
    body('serviceType')
        .trim()
        .notEmpty().withMessage('Service type is required')
        .toLowerCase()
        .isIn(['home_cleaning', 'plumbing', 'electrical_work', 'painting'])
        .withMessage('Invalid service type. Valid types are: home cleaning, plumbing, electrical work, painting'),
    body('experienceYears').isInt({ min: 0 }).withMessage('Experience years must be a positive number'),
    body('hourlyRate').isFloat({ min: 0 }).withMessage('Hourly rate must be a positive number'),
    body('location').notEmpty().withMessage('Location is required'),
    body('description').optional()
], async (req, res) => {
    try {
        // Log incoming request details
        console.log('\n=== Create/Update Worker Profile ===');
        console.log('Authenticated User:', req.user);
        console.log('Request Body:', req.body);

        // Validate input
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            console.log('Validation Errors:', errors.array());
            return res.status(400).json({ 
                status: "error",
                errors: errors.array() 
            });
        }

        // Verify user type
        const userId = req.user.userId;
        const [userCheck] = await pool.query(
            'SELECT user_type FROM users WHERE id = ?', 
            [userId]
        );

        console.log('User Type Check:', userCheck[0]);

        if (!userCheck[0] || userCheck[0].user_type !== 'worker') {
            return res.status(403).json({
                status: "error",
                message: "Only workers can create a worker profile"
            });
        }

        const { serviceType, experienceYears, hourlyRate, location, description } = req.body;

        // Check if profile exists
        const [existingProfile] = await pool.query(
            'SELECT * FROM worker_profiles WHERE user_id = ?',
            [userId]
        );

        console.log('Existing Profile:', existingProfile);

        if (existingProfile.length > 0) {
            // Update existing profile
            await pool.query(
                `UPDATE worker_profiles 
                SET service_type = ?, experience_years = ?, hourly_rate = ?, 
                    location = ?, description = ?
                WHERE user_id = ?`,
                [serviceType, experienceYears, hourlyRate, location, description, userId]
            );
        } else {
            // Create new profile
            await pool.query(
                `INSERT INTO worker_profiles 
                (user_id, service_type, experience_years, hourly_rate, location, description)
                VALUES (?, ?, ?, ?, ?, ?)`,
                [userId, serviceType, experienceYears, hourlyRate, location, description]
            );
        }

        // Fetch updated profile
        const [updatedProfile] = await pool.query(
            `SELECT wp.*, u.full_name, u.email, u.phone 
            FROM worker_profiles wp 
            JOIN users u ON wp.user_id = u.id 
            WHERE wp.user_id = ?`,
            [userId]
        );

        console.log('Updated Profile:', updatedProfile[0]);

        res.json({
            status: "success",
            message: existingProfile.length > 0 ? "Profile updated successfully" : "Profile created successfully",
            data: {
                id: updatedProfile[0].user_id,
                name: updatedProfile[0].full_name,
                serviceType: updatedProfile[0].service_type,
                hourlyRate: updatedProfile[0].hourly_rate,
                location: updatedProfile[0].location,
                experience: updatedProfile[0].experience_years,
                rating: updatedProfile[0].rating
            }
        });
    } catch (error) {
        console.error('Detailed Error in Worker Profile Creation:', error);
        res.status(500).json({
            status: "error",
            message: "Error updating worker profile",
            errorDetails: error.message,
            errorStack: error.stack
        });
    }
});

// Get Worker Profile
router.get('/profile', async (req, res) => {
    try {
        const userId = req.user.userId;
        console.log('Fetching profile for user:', userId);
        
        const [workerProfile] = await pool.query(
            `SELECT wp.*, u.full_name, u.email, u.phone 
            FROM worker_profiles wp 
            JOIN users u ON wp.user_id = u.id 
            WHERE wp.user_id = ?`,
            [userId]
        );

        if (!workerProfile[0]) {
            return res.status(404).json({
                status: "error",
                message: "Worker profile not found"
            });
        }

        res.json({
            status: "success",
            data: workerProfile[0]
        });
    } catch (error) {
        console.error('Error fetching worker profile:', error);
        res.status(500).json({
            status: "error",
            message: "Error fetching worker profile"
        });
    }
});

// Update Availability
router.put('/availability', async (req, res) => {
    try {
        const { availability } = req.body;
        const userId = req.user.id; // Assuming middleware sets user

        await pool.query(
            'UPDATE worker_profiles SET availability = ? WHERE user_id = ?',
            [availability, userId]
        );

        res.json({ message: 'Availability updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router; 