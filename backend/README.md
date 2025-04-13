# SkillConnect - Skilled Workers Platform

A web application that connects skilled workers (plumbers, electricians, painters, etc.) with customers. The platform helps improve service quality through ratings and reviews while providing a reliable source of work for skilled professionals.

## Features

- User registration and authentication (workers and customers)
- Worker profiles with skills, experience, and hourly rates
- Search functionality based on service type and location
- Booking system with status tracking
- Review and rating system
- Payment processing with platform fee calculation
- Responsive design for all devices

## Tech Stack

- Frontend: HTML, CSS, JavaScript
- Backend: Node.js with Express
- Database: MySQL
- Authentication: JWT (JSON Web Tokens)

## Prerequisites

- Node.js (v14 or higher)
- MySQL (v8 or higher)
- npm (Node Package Manager)

## Setup Instructions

1. Clone the repository:
```bash
git clone <repository-url>
cd skilled-workers-platform
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory with the following variables:
```
DB_HOST=localhost
DB_USER=your_mysql_username
DB_PASSWORD=your_mysql_password
DB_NAME=skilled_workers_db
JWT_SECRET=your_jwt_secret
PORT=3000
```

4. Set up the database:
- Create a MySQL database named `skilled_workers_db`
- Import the schema from `config/database.sql`

5. Start the server:
```bash
npm start
```

The application will be available at `http://localhost:3000`

## API Endpoints

### Authentication
- POST `/api/auth/register` - Register a new user
- POST `/api/auth/login` - Login user

### Workers
- GET `/api/workers/search` - Search for workers
- POST `/api/workers/profile` - Create/update worker profile
- GET `/api/workers/profile/:id` - Get worker profile
- PUT `/api/workers/availability` - Update worker availability

### Bookings
- POST `/api/bookings` - Create a new booking
- GET `/api/bookings/customer` - Get customer's bookings
- GET `/api/bookings/worker` - Get worker's bookings
- PUT `/api/bookings/:id/status` - Update booking status
- POST `/api/bookings/:id/review` - Add review for completed booking

## Contributing

1. Fork the repository
2. Create a new branch
3. Make your changes
4. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support, email support@skillconnect.com or create an issue in the repository. 