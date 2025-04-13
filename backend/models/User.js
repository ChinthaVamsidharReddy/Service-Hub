const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const pool = require('../config/db');

class User {
    static async findByEmail(email) {
        try {
            const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
            return rows[0];
        } catch (error) {
            throw error;
        }
    }

    static async create(userData) {
        const { fullName, email, password, phone, userType } = userData;
        const hashedPassword = await bcrypt.hash(password, 10);

        try {
            const [result] = await pool.query(
                'INSERT INTO users (full_name, email, password, phone, user_type) VALUES (?, ?, ?, ?, ?)',
                [fullName, email, hashedPassword, phone, userType]
            );
            return result.insertId;
        } catch (error) {
            throw error;
        }
    }

    static async findById(id) {
        try {
            const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [id]);
            return rows[0];
        } catch (error) {
            throw error;
        }
    }

    static async updateProfile(id, userData) {
        const { fullName, phone } = userData;
        try {
            const [result] = await pool.query(
                'UPDATE users SET full_name = ?, phone = ? WHERE id = ?',
                [fullName, phone, id]
            );
            return result.affectedRows > 0;
        } catch (error) {
            throw error;
        }
    }
}

module.exports = User; 