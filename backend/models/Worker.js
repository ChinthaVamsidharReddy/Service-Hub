const pool = require('../config/db');

class Worker {
    static async create(workerData) {
        const { userId, skills, experience, hourlyRate, availability } = workerData;
        try {
            const [result] = await pool.query(
                'INSERT INTO workers (user_id, skills, experience, hourly_rate, availability) VALUES (?, ?, ?, ?, ?)',
                [userId, JSON.stringify(skills), experience, hourlyRate, availability]
            );
            return result.insertId;
        } catch (error) {
            throw error;
        }
    }

    static async findByUserId(userId) {
        try {
            const [rows] = await pool.query(
                `SELECT w.*, u.full_name, u.email, u.phone 
                FROM workers w 
                JOIN users u ON w.user_id = u.id 
                WHERE w.user_id = ?`,
                [userId]
            );
            return rows[0];
        } catch (error) {
            throw error;
        }
    }

    static async updateProfile(userId, workerData) {
        const { skills, experience, hourlyRate, availability } = workerData;
        try {
            const [result] = await pool.query(
                'UPDATE workers SET skills = ?, experience = ?, hourly_rate = ?, availability = ? WHERE user_id = ?',
                [JSON.stringify(skills), experience, hourlyRate, availability, userId]
            );
            return result.affectedRows > 0;
        } catch (error) {
            throw error;
        }
    }

    static async search(filters) {
        const { skills, maxHourlyRate, availability } = filters;
        let query = `
            SELECT w.*, u.full_name, u.email, u.phone 
            FROM workers w 
            JOIN users u ON w.user_id = u.id 
            WHERE 1=1
        `;
        const params = [];

        if (skills && skills.length > 0) {
            query += ` AND JSON_CONTAINS(w.skills, ?)`;
            params.push(JSON.stringify(skills));
        }

        if (maxHourlyRate) {
            query += ` AND w.hourly_rate <= ?`;
            params.push(maxHourlyRate);
        }

        if (availability) {
            query += ` AND w.availability = ?`;
            params.push(availability);
        }

        try {
            const [rows] = await pool.query(query, params);
            return rows;
        } catch (error) {
            throw error;
        }
    }
}

module.exports = Worker; 