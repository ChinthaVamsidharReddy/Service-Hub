# Serverice Hub

Serverice Hub is a comprehensive platform connecting customers with service providers (workers) for various services like plumbing, electrical work, cleaning, and more. The platform enables seamless booking, management, and payment for services along with a review system.



![Serverice Hub Dashboard](screenshots/dashboard.png)
*Main dashboard of the Serverice Hub application*

## Features

### For Customers
- **Service Search**: Find qualified service providers by service type, location, or rating
- **Booking Management**: Schedule, reschedule, or cancel service appointments
- **Payment Processing**: Secure payment options including card payment and UPI/QR code
- **Review System**: Leave reviews for completed services
- **Dashboard**: Track all bookings with status updates



![Payment Interface](screenshots/payment-interface.png)
*Secure and user-friendly payment interface*

### For Service Providers
- **Profile Management**: Showcase skills, expertise, and availability
- **Booking Notifications**: Get notified of new service requests
- **Service History**: Track completed services and earnings
- **Rating System**: Build reputation through customer reviews

![Review Modal](screenshots/review-modal.png)
*Customer review interface for completed services*

## Tech Stack

### Frontend
- **Next.js**: React framework for the frontend
- **TypeScript**: For type-safe code
- **Tailwind CSS**: For styling and UI components
- **React Hot Toast**: For notifications

### Backend
- **Node.js**: Server-side JavaScript runtime
- **Express**: Web application framework
- **MySQL**: Database for storing user data, bookings, and reviews
- **JWT**: For authentication and secure API access
- **Express Validator**: For request validation

## System Architecture

The application follows a modern client-server architecture:

1. **Frontend SPA**: Single-page application built with Next.js
2. **RESTful API**: Backend serves data through RESTful endpoints
3. **Authentication**: Token-based authentication using JWT
4. **Database**: Relational database (MySQL) for data persistence

![System Architecture](screenshots/architecture.png)
*High-level architecture of Serverice Hub*

## Key Workflows

### Booking Workflow
1. Customer searches for a service provider
2. Customer creates a booking request
3. Service provider accepts/rejects the booking
4. Customer receives notification of acceptance/rejection
5. Service is provided on the scheduled date
6. Customer marks the service as complete
7. Customer makes payment
8. Customer can leave a review

### Payment Workflow
1. Customer selects payment method (Card/UPI)
2. Customer enters payment details
3. System processes the payment
4. Both customer and service provider receive confirmation

![Booking Workflow](screenshots/booking-workflow.png)
*Visual representation of the booking process*

## Installation and Setup

### Prerequisites
- Node.js (v14 or later)
- MySQL (v8 or later)
- npm or yarn

### Backend Setup
```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create .env file (use .env.example as template)
cp .env.example .env

# Configure your database in .env file
# Run database migrations
node setup.js

# Start the server
npm start
```

### Frontend Setup
```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

## Future Enhancements

- **Mobile Application**: Native mobile apps for iOS and Android
- **Real-time Tracking**: Live tracking for service providers on the way
- **Advanced Analytics**: Insights for service providers and business metrics
- **Subscription Plans**: Premium membership options for service providers
- **Multi-language Support**: Support for regional languages

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

---

*Note: Replace the placeholder screenshot references with actual screenshots of your application. The recommended locations for screenshots are indicated above.* 