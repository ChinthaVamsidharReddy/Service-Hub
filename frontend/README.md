# Service Booking Platform - Frontend

## Overview
This is the frontend application for the Service Booking Platform, built with Next.js, TypeScript, and Tailwind CSS.

## Features
- User Authentication (Register/Login)
- Worker Profile Management
- Worker Search and Booking
- Responsive Design
- Form Validation
- State Management
- Toast Notifications

## Tech Stack
- Next.js 14
- TypeScript
- Tailwind CSS
- React Hook Form
- Zod (Validation)
- Axios (HTTP Requests)
- React Hot Toast

## Prerequisites
- Node.js (v18+)
- npm or yarn

## Installation

1. Clone the repository
```bash
git clone <repository-url>
cd service-booking-platform/frontend
```

2. Install dependencies
```bash
npm install
# or
yarn install
```

3. Set up environment variables
Create a `.env.local` file with the following:
```
NEXT_PUBLIC_API_URL=http://localhost:3002/api
```

## Running the Application

Development Mode:
```bash
npm run dev
# or
yarn dev
```

Production Build:
```bash
npm run build
npm start
# or
yarn build
yarn start
```

## Project Structure
```
src/
├── app/
│   ├── auth/
│   │   ├── login/
│   │   └── register/
│   ├── customer/
│   │   ├── search/
│   │   └── bookings/
│   └── worker/
│       ├── profile/
│       └── dashboard/
├── components/
│   └── shared/
└── lib/
    └── utils/
```

## Key Components
- Authentication Pages
- Worker Profile Management
- Worker Search
- Booking Management

## Form Validation
Uses Zod for robust form validation with detailed error messages.

## State Management
Utilizes React Hook Form for form state and React Query for data fetching and caching.

## Error Handling
Implements global error handling with toast notifications.

## Deployment
- Vercel (Recommended)
- Netlify
- Cloudflare Pages

## Contributing
1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License
MIT License
