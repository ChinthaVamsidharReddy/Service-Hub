DROP DATABASE IF EXISTS skilled_workers_db;
CREATE DATABASE skilled_workers_db;
USE skilled_workers_db;

-- Disable foreign key checks to allow dropping tables
SET FOREIGN_KEY_CHECKS = 0;

-- Drop existing tables
DROP TABLE IF EXISTS payments;
DROP TABLE IF EXISTS reviews;
DROP TABLE IF EXISTS bookings;
DROP TABLE IF EXISTS worker_profiles;
DROP TABLE IF EXISTS users;

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;

-- Create Users Table with reset auto-increment
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    user_type ENUM('worker', 'customer') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) AUTO_INCREMENT = 1000;  -- Start user IDs from 1000

-- Create Worker Profiles Table with reset auto-increment
CREATE TABLE worker_profiles (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL UNIQUE,
    -- Valid service types: home_cleaning, plumbing, electrical_work, painting
    service_type VARCHAR(50) NOT NULL,
    experience_years INT NOT NULL,
    hourly_rate DECIMAL(10, 2) NOT NULL,
    location VARCHAR(100) NOT NULL,
    description TEXT,
    availability BOOLEAN DEFAULT true,
    rating DECIMAL(3, 2) DEFAULT 0,
    total_reviews INT DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) AUTO_INCREMENT = 1000;  -- Start worker profile IDs from 1000

-- Create Bookings Table with reset auto-increment
CREATE TABLE bookings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    customer_id INT NOT NULL,
    worker_id INT NOT NULL,
    service_type VARCHAR(50) NOT NULL,
    booking_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME,
    status ENUM('pending', 'accepted', 'completed', 'cancelled') DEFAULT 'pending',
    total_amount DECIMAL(10, 2),
    platform_fee DECIMAL(10, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES users(id),
    FOREIGN KEY (worker_id) REFERENCES users(id)
) AUTO_INCREMENT = 1000;  -- Start booking IDs from 1000

-- Create Reviews Table with reset auto-increment
CREATE TABLE reviews (
    id INT PRIMARY KEY AUTO_INCREMENT,
    booking_id INT NOT NULL,
    customer_id INT NOT NULL,
    worker_id INT NOT NULL,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(id),
    FOREIGN KEY (customer_id) REFERENCES users(id),
    FOREIGN KEY (worker_id) REFERENCES users(id)
) AUTO_INCREMENT = 1000;  -- Start review IDs from 1000

-- Create Payments Table with reset auto-increment
CREATE TABLE payments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    booking_id INT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    platform_fee DECIMAL(10, 2) NOT NULL,
    payment_status ENUM('pending', 'completed', 'failed') DEFAULT 'pending',
    payment_method VARCHAR(50),
    transaction_id VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(id)
) AUTO_INCREMENT = 1000;  -- Start payment IDs from 1000

-- Optional: Insert some initial data for testing
INSERT INTO users (full_name, email, password, phone, user_type) VALUES 
('John Doe', 'john@example.com', '$2a$10$abcdefghijklmnopqrstuvwx', '1234567890', 'worker'),
('Jane Smith', 'jane@example.com', '$2a$10$abcdefghijklmnopqrstuvwx', '0987654321', 'customer');

-- Optional: Insert a sample worker profile
INSERT INTO worker_profiles (user_id, service_type, experience_years, hourly_rate, location, description) VALUES 
(1000, 'home_cleaning', 5, 35.00, 'New York', 'Professional home cleaner with experience in residential and commercial cleaning'); 