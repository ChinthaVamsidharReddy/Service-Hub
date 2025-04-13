'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { toast } from 'react-hot-toast';

interface Booking {
  id: number;
  customerId: number;
  customerName: string;
  customer_details: {
    name: string;
    email?: string;
    phone?: string;
    location?: string;
  };
  serviceType: string;
  bookingDate: string;
  startTime: string;
  endTime: string;
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'rejected';
  description?: string;
}

interface WorkerProfile {
  id: number;
  fullName: string;
  serviceType: string;
  experienceYears: number;
  hourlyRate: number;
  location: string;
  description?: string;
  availability: boolean;
  rating?: number;
}

export default function WorkerDashboard() {
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [user, setUser] = useState<any>(null);
  const [workerProfile, setWorkerProfile] = useState<WorkerProfile | null>(null);

  useEffect(() => {
    // Check if user is logged in
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');

    if (!storedUser || !token) {
      // Redirect to login if not authenticated
      router.push('/auth/login');
      return;
    }

    // Parse user data
    const parsedUser = JSON.parse(storedUser);
    setUser(parsedUser);

    // Fetch worker profile and bookings
    const fetchData = async () => {
      try {
        // Fetch worker profile
        const profileResponse = await axios.get('http://localhost:3002/api/worker/profile', {
          headers: { Authorization: `Bearer ${token}` }
        });

        console.log('Worker Profile Response:', JSON.stringify(profileResponse.data, null, 2));
        
        // Validate and sanitize the profile response
        const profileData = profileResponse.data?.data;
        if (!profileData) {
          // No profile exists, redirect to profile creation
          router.push('/worker/profile');
          return;
        }

        const sanitizedProfile: WorkerProfile = {
          id: profileData.id || profileData.user_id,
          fullName: profileData.name || profileData.full_name || profileData.fullName || 'Unnamed Worker',
          serviceType: profileData.serviceType || profileData.service_type || '',
          experienceYears: Number(profileData.experienceYears || profileData.experience_years || profileData.years_of_experience || 0),
          hourlyRate: Number(profileData.hourlyRate || profileData.hourly_rate || 0),
          location: profileData.location || '',
          description: profileData.description || '',
          availability: profileData.availability !== undefined 
            ? profileData.availability 
            : (profileData.availability === 'true' || profileData.availability === true),
          rating: profileData.rating ? Number(profileData.rating) : undefined
        };

        setWorkerProfile(sanitizedProfile);

        // Fetch worker bookings
        try {
          const bookingsResponse = await axios.get('http://localhost:3002/api/bookings/worker', {
            headers: { Authorization: `Bearer ${token}` }
          });

          console.log('Raw Bookings Response:', JSON.stringify(bookingsResponse.data, null, 2));
          
          // Validate response structure
          if (!bookingsResponse.data || !bookingsResponse.data.data) {
            console.error('Invalid bookings response structure:', bookingsResponse.data);
            toast.error('Failed to fetch bookings: Invalid response');
            return;
          }

          // Enhanced error checking and logging
          if (!Array.isArray(bookingsResponse.data.data)) {
            console.error('Bookings data is not an array:', bookingsResponse.data.data);
            toast.error('Unexpected bookings data format');
            return;
          }

          // Detailed logging of each booking
          bookingsResponse.data.data.forEach((booking: any, index: number) => {
            console.log(`Raw Booking ${index + 1}:`, {
              id: booking.id,
              customer_id: booking.customer_id,
              customer_name: booking.customer_name,
              customerName: booking.customerName,
              customer_details: booking.customer_details,
              customer: booking.customer,
              full_name: booking.full_name,
              raw_booking: booking
            });
          });

          // Robust sanitization with fallback values
          const sanitizedBookings = bookingsResponse.data.data.map((booking: any) => {
            // Get customer name from all possible sources
            const customerName = 
              booking.customer_details?.name ||
              booking.customer?.full_name || 
              booking.customer?.name ||
              booking.customer_name ||
              booking.customerName ||
              booking.full_name ||
              'Unknown Customer';

            // Log the name resolution process
            console.log('Name Resolution for booking:', {
              booking_id: booking.id,
              customer_details_name: booking.customer_details?.name,
              customer_full_name: booking.customer?.full_name,
              customer_name: booking.customer?.name,
              customer_name_direct: booking.customer_name,
              customerName: booking.customerName,
              full_name: booking.full_name,
              final_name: customerName
            });

            const mappedBooking = {
              id: booking.id || Date.now(),
              customerId: booking.customer_id || 0,
              customerName: customerName,
              customer_details: {
                name: customerName,
                email: booking.customer_details?.email || booking.customer?.email || booking.customer_email,
                phone: booking.customer_details?.phone || booking.customer?.phone || booking.customer_phone || 'Phone Not Provided',
                location: booking.customer_details?.location || booking.customer?.location || booking.customer_location || 'Location Not Provided'
              },
              serviceType: booking.service_type || booking.serviceType || 'Unknown Service',
              bookingDate: booking.booking_date || booking.bookingDate || 'Unknown Date',
              startTime: booking.start_time || booking.startTime || '00:00',
              endTime: booking.end_time || booking.endTime || '00:00',
              status: booking.status === 'declined' ? 'rejected' : (booking.status || 'Unknown Status'),
              description: booking.description || ''
            };

            // Log the final mapped booking
            console.log('Final Mapped Booking:', {
              id: mappedBooking.id,
              customerName: mappedBooking.customerName,
              customer_details: mappedBooking.customer_details
            });

            return mappedBooking;
          });

          console.log('Sanitized Bookings:', JSON.stringify(sanitizedBookings, null, 2));

          // Set bookings only if sanitization was successful
          setBookings(sanitizedBookings);

        } catch (bookingsError) {
          // Comprehensive error handling for bookings fetch
          console.error('Detailed Bookings Fetch Error:', {
            error: bookingsError,
            message: (bookingsError as Error).message,
            name: (bookingsError as Error).name,
            stack: (bookingsError as Error).stack
          });

          // More informative error handling
          if (axios.isAxiosError(bookingsError)) {
            const errorResponse = bookingsError.response;
            
            if (errorResponse?.status === 500) {
              toast.error('Server error occurred while fetching bookings. Please try again later.', {
                duration: 4000,
                style: {
                  background: '#FF6B6B',
                  color: 'white'
                }
              });
            } else if (errorResponse?.status === 401) {
              toast.error('Unauthorized. Please log in again.', {
                duration: 4000,
                style: {
                  background: '#FF6B6B',
                  color: 'white'
                }
              });
              // Clear user data and redirect to login
              localStorage.removeItem('token');
              localStorage.removeItem('user');
              router.push('/auth/login');
            } else {
              toast.error(`Failed to fetch bookings: ${errorResponse?.data?.message || 'Unknown error'}`, {
                duration: 4000,
                style: {
                  background: '#FF6B6B',
                  color: 'white'
                }
              });
            }
          } else {
            toast.error('An unexpected error occurred while fetching bookings', {
              duration: 4000,
              style: {
                background: '#FF6B6B',
                color: 'white'
              }
            });
          }
        }

      } catch (profileError) {
        // Error handling for profile fetch
        console.error('Profile Fetch Error:', profileError);

        if (axios.isAxiosError(profileError)) {
          const errorResponse = profileError.response;
          
          if (errorResponse?.status === 401) {
            toast.error('Session expired. Please log in again.', {
              duration: 4000,
              style: {
                background: '#FF6B6B',
                color: 'white'
              }
            });
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            router.push('/auth/login');
          } else {
            toast.error('Failed to fetch worker profile', {
              duration: 4000,
              style: {
                background: '#FF6B6B',
                color: 'white'
              }
            });
          }
        } else {
          toast.error('An unexpected error occurred', {
            duration: 4000,
            style: {
              background: '#FF6B6B',
              color: 'white'
            }
          });
        }

        // Set profile to null in case of error
        setWorkerProfile(null);
      }
    };

    // Call the combined fetch function
    fetchData();
  }, [router]);

  const handleLogout = () => {
    // Clear user data and token
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    
    // Redirect to login
    router.push('/auth/login');
  };

  const fetchAndUpdateBookings = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:3002/api/bookings/worker', {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Log raw response data
      console.log('Raw Bookings Response:', response.data);

      // Sanitize bookings to ensure all required fields exist
      const sanitizedBookings = response.data.data.map((booking: any) => {
        // Get customer name from all possible sources
        const customerName = 
          booking.customer_details?.name ||
          booking.customer?.full_name || 
          booking.customer?.name ||
          booking.customer_name ||
          booking.customerName ||
          booking.full_name ||
          'Unknown Customer';

        // Log the name resolution process
        console.log('Name Resolution for booking:', {
          booking_id: booking.id,
          customer_details_name: booking.customer_details?.name,
          customer_full_name: booking.customer?.full_name,
          customer_name: booking.customer?.name,
          customer_name_direct: booking.customer_name,
          customerName: booking.customerName,
          full_name: booking.full_name,
          final_name: customerName
        });

        const mappedBooking = {
          id: booking.id || Date.now(),
          customerId: booking.customer_id || 0,
          customerName: customerName,
          customer_details: {
            name: customerName,
            email: booking.customer_details?.email || booking.customer?.email || booking.customer_email,
            phone: booking.customer_details?.phone || booking.customer?.phone || booking.customer_phone || 'Phone Not Provided',
            location: booking.customer_details?.location || booking.customer?.location || booking.customer_location || 'Location Not Provided'
          },
          serviceType: booking.service_type || booking.serviceType || 'Unknown Service',
          bookingDate: booking.booking_date || booking.bookingDate || 'Unknown Date',
          startTime: booking.start_time || booking.startTime || '00:00',
          endTime: booking.end_time || booking.endTime || '00:00',
          status: booking.status === 'declined' ? 'rejected' : (booking.status || 'Unknown Status'),
          description: booking.description || ''
        };

        // Log the final mapped booking
        console.log('Final Mapped Booking:', {
          id: mappedBooking.id,
          customerName: mappedBooking.customerName,
          customer_details: mappedBooking.customer_details
        });

        return mappedBooking;
      });

      setBookings(sanitizedBookings);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast.error('Failed to refresh bookings');
    }
  };

  const updateBookingStatus = async (bookingId: number, status: string) => {
    try {
      // Get current user and token
      const token = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      const user = storedUser ? JSON.parse(storedUser) : null;

      // Find the current booking
      const currentBooking = bookings.find(b => b.id === bookingId);

      // Validate inputs
      if (!currentBooking) {
        throw new Error('Booking not found');
      }

      // Type-safe valid transitions
      const validTransitions: Record<string, Record<string, string[]>> = {
        'pending': {
          'worker': ['confirmed', 'rejected'],
          'customer': ['cancelled']
        },
        'confirmed': {
          'worker': ['in_progress', 'cancelled'],
          'customer': ['cancelled']
        },
        'in_progress': {
          'worker': ['completed', 'cancelled'],
          'customer': ['cancelled']
        },
        'completed': {},
        'cancelled': {},
        'rejected': {}
      };

      // Check if transition is allowed
      const currentStatus = currentBooking.status;
      const userType = user?.userType || '';
      const allowedStatuses = validTransitions[currentStatus]?.[userType] || [];
      
      if (!allowedStatuses.includes(status)) {
        const errorMessage = `Invalid status transition from ${currentStatus} to ${status} for ${userType}`;
        console.error(errorMessage);
        
        toast.error(errorMessage, {
          duration: 4000,
          style: {
            background: '#FF6B6B',
            color: 'white'
          }
        });
        
        throw new Error(errorMessage);
      }

      // Prepare payload
      const payload = { status };

      // Make API call
      const response = await axios.put(
        `http://localhost:3002/api/bookings/${bookingId}/status`, 
        payload,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      // Success handling
      toast.success(`Booking ${status} successfully`);
      
      // Refresh bookings
      await fetchAndUpdateBookings();

    } catch (error) {
      // Comprehensive error handling
      console.error('Booking Status Update Error:', error);

      if (axios.isAxiosError(error) && error.response) {
        const responseData = error.response.data;
        
        const errorMessage = responseData?.message || 
          'Failed to update booking status';

        toast.error(errorMessage, {
          duration: 4000,
          style: {
            background: '#FF6B6B',
            color: 'white'
          }
        });
      } else {
        toast.error('An unexpected error occurred', {
          duration: 4000,
          style: {
            background: '#FF6B6B',
            color: 'white'
          }
        });
      }

      throw error;
    }
  };

  if (!user || !workerProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-32 h-32 bg-blue-200 rounded-full mb-4"></div>
          <div className="h-6 bg-blue-200 rounded w-48 mb-4"></div>
          <div className="h-4 bg-blue-200 rounded w-64"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Header Section */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="md:flex md:items-center md:justify-between">
            <div className="md:flex-1">
              <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
                  Welcome, {user.fullName}
                </h1>
              <p className="mt-3 text-xl text-blue-100">
                <span className="inline-flex items-center bg-blue-800 bg-opacity-30 px-3 py-1 rounded-full text-sm">
                  {workerProfile.serviceType}
                </span>
                <span className="mx-2">•</span>
                <span className="inline-flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                  {workerProfile.location}
                </span>
                </p>
              </div>
            
            <div className="mt-6 md:mt-0 flex flex-wrap gap-3">
              <a 
                href="/worker/edit-profile" 
                className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-blue-600 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                </svg>
                Edit Profile
              </a>
                {/* <a 
                  href="/dashboard/services" 
                className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-blue-600 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V8z" clipRule="evenodd" />
                  </svg>
                  Services
                </a> */}
                <button 
                  onClick={handleLogout}
                className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 1.293a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 01-1.414-1.414L14.586 11H7a1 1 0 110-2h7.586l-1.293-1.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                  Logout
                </button>
            </div>
              </div>
            </div>
          </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 mb-10">
          {/* Hourly Rate Card */}
          <div className="bg-white overflow-hidden shadow-lg rounded-2xl border border-gray-100 transition-all hover:shadow-xl">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-blue-500 rounded-full p-3">
                  <svg className="h-8 w-8 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Hourly Rate</dt>
                    <dd>
                      <div className="text-3xl font-bold text-gray-900">
                        ₹{(workerProfile.hourlyRate || 0).toFixed(0)}
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        Indian Rupees per hour
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          {/* Experience Card */}
          <div className="bg-white overflow-hidden shadow-lg rounded-2xl border border-gray-100 transition-all hover:shadow-xl">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-green-500 rounded-full p-3">
                  <svg className="h-8 w-8 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Experience</dt>
                    <dd>
                      <div className="text-3xl font-bold text-gray-900">
                        {workerProfile.experienceYears}
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        {workerProfile.experienceYears === 1 ? 'Year' : 'Years'} in the field
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          {/* Availability Card */}
          <div className="bg-white overflow-hidden shadow-lg rounded-2xl border border-gray-100 transition-all hover:shadow-xl">
            <div className="p-6">
              <div className="flex items-center">
                <div className={`flex-shrink-0 ${workerProfile.availability ? 'bg-indigo-500' : 'bg-red-500'} rounded-full p-3`}>
                  <svg className="h-8 w-8 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Status</dt>
                    <dd>
                      <div className="text-2xl font-bold text-gray-900">
                  {workerProfile.availability ? 'Available' : 'Not Available'}
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        {workerProfile.availability 
                          ? 'You are visible to customers' 
                          : 'You are not visible to customers'}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
              </div>
            </div>

        {/* Bookings Section */}
        <div className="bg-white shadow-lg rounded-2xl overflow-hidden border border-gray-100 mb-10">
          <div className="border-b border-gray-200 px-6 py-5 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-800">Your Bookings</h2>
            <button 
              onClick={fetchAndUpdateBookings} 
              className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>
            
            {bookings.length === 0 ? (
            <div className="p-12 flex flex-col items-center justify-center">
              <div className="rounded-full bg-blue-100 p-4 mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">No Bookings Yet</h3>
              <p className="text-gray-500 text-center max-w-md">
                You'll see your bookings here once customers start booking your services. Keep your profile updated to attract more customers.
              </p>
              </div>
            ) : (
            <div className="divide-y divide-gray-200">
                {bookings.map((booking) => (
                <div key={booking.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                    <div className="flex-1">
                      <div className="flex items-center mb-3">
                        <div className="w-12 h-12 flex-shrink-0 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                          <span className="text-xl font-bold text-white">
                            {booking.customer_details?.name ? booking.customer_details.name.charAt(0).toUpperCase() : '?'}
                          </span>
                        </div>
                        <div className="ml-4">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {booking.customer_details?.name || booking.customerName || 'Unknown Customer'}
                          </h3>
                          <div className="flex items-center mt-1">
                      <span 
                              className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          booking.status === 'completed' ? 'bg-green-100 text-green-800' :
                          booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          booking.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                          booking.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                          booking.status === 'rejected' ? 'bg-gray-100 text-gray-800' :
                          'bg-gray-100 text-gray-800'
                        }`}
                      >
                              {booking.status.toUpperCase()}
                      </span>
                            <span className="ml-2 text-sm text-gray-500">{booking.serviceType}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                        <div className="flex items-start">
                          <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div className="ml-3">
                            <p className="text-sm font-medium text-gray-900">Date & Time</p>
                            <p className="text-sm text-gray-500">{booking.bookingDate}</p>
                            <p className="text-sm text-gray-500">{booking.startTime} - {booking.endTime}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-start">
                          <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div className="ml-3">
                            <p className="text-sm font-medium text-gray-900">Location</p>
                            <p className="text-sm text-gray-500">{booking.customer_details?.location || 'Location Not Provided'}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-start">
                          <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                            </svg>
                          </div>
                          <div className="ml-3">
                            <p className="text-sm font-medium text-gray-900">Contact</p>
                            <p className="text-sm text-gray-500">{booking.customer_details?.phone || 'Phone Not Provided'}</p>
                            <p className="text-sm text-gray-500">{booking.customer_details?.email || ''}</p>
                          </div>
                        </div>
                      </div>

                      {booking.description && (
                        <div className="mt-4 bg-gray-50 p-3 rounded-lg">
                          <p className="text-sm text-gray-600 italic">
                            "{booking.description}"
                          </p>
                        </div>
                      )}
                    </div>
                    
                    {/* Action Buttons for various booking statuses */}
                      {booking.status === 'pending' && (
                      <div className="mt-4 md:mt-0 flex flex-col space-y-2 md:flex-row md:space-y-0 md:space-x-2">
                          <button 
                            onClick={() => updateBookingStatus(booking.id, 'confirmed')}
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                          >
                            Accept Booking
                          </button>
                          <button 
                            onClick={() => updateBookingStatus(booking.id, 'rejected')}
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                          >
                            Reject Booking
                          </button>
                        </div>
                      )}
                  </div>
                </div>
              ))}
                        </div>
                      )}
        </div>
        
        {/* Rating & Reviews Summary (Placeholder for future feature) */}
        <div className="bg-white shadow-lg rounded-2xl overflow-hidden border border-gray-100">
          <div className="border-b border-gray-200 px-6 py-5">
            <h2 className="text-2xl font-bold text-gray-800">Your Performance</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex flex-col items-center">
                <div className="text-5xl font-bold text-indigo-600 mb-2">
                  {workerProfile?.rating ? workerProfile.rating.toFixed(1) : 'N/A'}
                </div>
                <div className="flex mb-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg 
                      key={star}
                      className={`h-5 w-5 ${star <= Math.round(workerProfile?.rating || 0) ? 'text-yellow-400' : 'text-gray-300'}`}
                      xmlns="http://www.w3.org/2000/svg" 
                      viewBox="0 0 20 20" 
                      fill="currentColor"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-gray-500 text-sm">Overall Rating</p>
                        </div>
              
              <div className="flex flex-col justify-center">
                <div className="mb-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-600">Punctuality</span>
                    <span className="text-sm font-medium text-gray-900">95%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: '95%' }}></div>
                  </div>
                </div>
                <div className="mb-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-600">Service Quality</span>
                    <span className="text-sm font-medium text-gray-900">90%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: '90%' }}></div>
                        </div>
                        </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-600">Response Time</span>
                    <span className="text-sm font-medium text-gray-900">88%</span>
                    </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: '88%' }}></div>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col justify-center items-center">
                <div className="text-5xl font-bold text-indigo-600 mb-2">
                  {bookings.filter(b => b.status === 'completed').length}
                </div>
                <p className="text-gray-500 text-sm">Completed Jobs</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 