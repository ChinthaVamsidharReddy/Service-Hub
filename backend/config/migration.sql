-- Migration script to update bookings table status column

-- Modify the status column to include new statuses
ALTER TABLE bookings 
MODIFY COLUMN status ENUM(
    'pending', 
    'confirmed', 
    'in_progress', 
    'completed', 
    'cancelled', 
    'declined'
) DEFAULT 'pending'; 