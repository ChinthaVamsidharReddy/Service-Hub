import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(request: NextRequest) {
  try {
    // Get the authorization token from the request headers
    const authHeader = request.headers.get('authorization');
    
    // Parse the request body
    const bookingData = await request.json();

    // Log incoming booking request details with more context
    console.log('Incoming Booking Request:', {
      workerId: bookingData.workerId,
      workerIdType: typeof bookingData.workerId,
      serviceType: bookingData.serviceType,
      bookingDate: bookingData.bookingDate,
      startTime: bookingData.startTime,
      endTime: bookingData.endTime,
      description: bookingData.description
    });

    // Ensure workerId is a number
    const workerIdAsNumber = Number(bookingData.workerId);

    // Prepare the request body to match backend expectations
    const backendRequestBody = {
      workerId: workerIdAsNumber,
      serviceType: bookingData.serviceType,
      bookingDate: bookingData.bookingDate,
      startTime: bookingData.startTime,
      endTime: bookingData.endTime,
      description: bookingData.description || `Booking for ${bookingData.serviceType} service`
    };

    // Make a request to the backend booking API
    const response = await axios.post('http://localhost:3002/api/bookings', backendRequestBody, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader || ''
      }
    });

    // Log successful backend response
    console.log('Backend Booking Response:', {
      status: response.status,
      data: response.data
    });

    // Return the response from the backend
    return NextResponse.json(response.data, { 
      status: response.status 
    });
  } catch (error: any) {
    // Log detailed error information
    console.error('Booking API Error:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      stack: error.stack
    });

    // Handle Axios error responses
    if (error.response) {
      return NextResponse.json(
        { 
          message: error.response.data.message || 'Failed to create booking', 
          details: error.response.data 
        }, 
        { status: error.response.status }
      );
    }

    // Handle network or other errors
    return NextResponse.json(
      { message: 'An unexpected error occurred', error: error.message }, 
      { status: 500 }
    );
  }
} 