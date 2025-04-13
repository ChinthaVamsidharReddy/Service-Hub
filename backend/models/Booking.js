const pool = require('../config/db');

class Booking {
    static async create(bookingData) {
        const { clientId, workerId, date, startTime, endTime, status, description } = bookingData;
        try {
            const [result] = await pool.query(
                `INSERT INTO bookings 
                (client_id, worker_id, date, start_time, end_time, status, description) 
                VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [clientId, workerId, date, startTime, endTime, status || 'pending', description]
            );
            return result.insertId;
        } catch (error) {
            throw error;
        }
    }

    static async findById(id) {
        try {
            const [rows] = await pool.query(
                `SELECT b.*, 
                    c.full_name as client_name, c.email as client_email,
                    w.full_name as worker_name, w.email as worker_email
                FROM bookings b
                JOIN users c ON b.client_id = c.id
                JOIN users w ON b.worker_id = w.id
                WHERE b.id = ?`,
                [id]
            );
            return rows[0];
        } catch (error) {
            throw error;
        }
    }

    static async findByClientId(clientId) {
        try {
            const [rows] = await pool.query(
                `SELECT b.*, 
                    w.full_name as worker_name, w.email as worker_email
                FROM bookings b
                JOIN users w ON b.worker_id = w.id
                WHERE b.client_id = ?
                ORDER BY b.date DESC, b.start_time DESC`,
                [clientId]
            );
            return rows;
        } catch (error) {
            throw error;
        }
    }

    static async findByWorkerId(workerId) {
        try {
            const [rows] = await pool.query(
                `SELECT b.*, 
                    c.full_name as client_name, c.email as client_email
                FROM bookings b
                JOIN users c ON b.client_id = c.id
                WHERE b.worker_id = ?
                ORDER BY b.date DESC, b.start_time DESC`,
                [workerId]
            );
            return rows;
        } catch (error) {
            throw error;
        }
    }

    static async updateStatus(id, status, userId) {
        try {
            const [booking] = await pool.query('SELECT * FROM bookings WHERE id = ?', [id]);
            if (!booking[0]) {
                throw new Error('Booking not found');
            }

            // Verify that the user is either the worker or the client
            if (booking[0].worker_id !== userId && booking[0].client_id !== userId) {
                throw new Error('Unauthorized to update this booking');
            }

            const [result] = await pool.query(
                'UPDATE bookings SET status = ? WHERE id = ?',
                [status, id]
            );
            return result.affectedRows > 0;
        } catch (error) {
            throw error;
        }
    }
}

module.exports = Booking; 