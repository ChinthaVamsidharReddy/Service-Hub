'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import PaymentForm from '@/components/PaymentForm';
import ReviewModal from '@/components/ReviewModal';

interface Worker {
  id: number;
  name: string;
  bookingId: number;
  amount: number;
}

interface Booking {
  platform_fee: number;
  total_amount: number;
  id: number;
  workerId: number;
  worker_id?: number;
  customer_id: number;
  workerName?: string;
  worker_name?: string;
  serviceType: string;
  service_type?: string;
  bookingDate: string;
  booking_date?: string;
  startTime: string;
  start_time?: string;
  endTime: string;
  end_time?: string;
  status: string;
  description?: string;
  worker_details?: {
    name?: string;
    email?: string;
    phone?: string;
    location?: string;
    hourly_rate?: number;
    service_description?: string;
    skills?: string[];
    rating?: number;
    total_reviews?: number;
  };
}

export default function CustomerDashboard() {
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [isPaymentVisible, setPaymentVisible] = useState(false);
  const [currentBooking, setCurrentBooking] = useState<Booking | null>(null);
  
  // Add state for review modal
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [bookingToReview, setBookingToReview] = useState<Booking | null>(null);

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
    setUser(JSON.parse(storedUser));

    // Fetch customer bookings
    const fetchBookings = async () => {
      try {
        const response = await axios.get('http://localhost:3002/api/bookings/customer', {
          headers: { Authorization: `Bearer ${token}` }
        });

        // Log raw response data
        console.log('Raw API Response:', response.data);

        // Check for error response from server
        if (response.data.status === 'error') {
          console.error('Server Error:', response.data.error || response.data.message);
          
          // Check for specific SQL error
          if (response.data.error && response.data.error.includes("Unknown column 'wp.service_description'")) {
            toast.error('System is temporarily unavailable. Our team has been notified.');
            console.error('SQL Error: service_description column missing in worker_profiles table');
            return;
          }
          
          
          toast.error(response.data.message || 'Failed to fetch bookings');
          return;
        }

        if (!response.data || !response.data.data) {
          console.error('Invalid response structure:', response.data);
          toast.error('Failed to fetch bookings: Invalid response structure');
          return;
        }

        // Log each booking's raw data before mapping
        response.data.data.forEach((booking: any, index: number) => {
          console.log(`Raw Booking ${index + 1} Data:`, {
            id: booking.id,
            worker_id: booking.worker_id,
            worker_name: booking.worker_name,
            workerName: booking.workerName,
            worker_details: booking.worker_details,
            worker: booking.worker,
            full_name: booking.full_name,
            raw_booking: booking
          });
        });
        response.data.data.forEach((booking: any, index: number) => {
          console.log(`Raw Booking ${index + 1} Data:`, booking);
        });

        // Manually map the bookings to ensure all fields are correctly populated
        const mappedBookings = response.data.data.map((booking: any) => {
          // Get worker name from all possible sources, prioritizing worker_details.name
          const workerName =
            booking.worker_details?.name ||
            booking.worker?.full_name ||
            booking.worker?.name ||
            booking.worker_name ||
            booking.workerName ||
            booking.full_name ||
            'Unknown Worker';
        
          // Convert rating to number or undefined
          const rating = booking.worker_rating || booking.worker_details?.rating;
  const parsedRating = rating !== undefined && rating !== null ? Number(rating) : undefined;
  const platformFee = Number(booking.platform_fee) || 0;
  console.log('Name Resolution for booking:', {
    booking_id: booking.id,
    worker_details_name: booking.worker_details?.name,
    worker_full_name: booking.worker?.full_name,
    worker_name: booking.worker?.name,
    worker_name_direct: booking.worker_name,
    workerName: booking.workerName,
    full_name: booking.full_name,
    final_name: workerName,
    platform_fee: platformFee,
  });


  const mappedBooking = {
    ...booking,
    workerName: workerName,
    customer_id: booking.customer_id,
    platform_fee: platformFee, // Ensure platform_fee is included
    worker_details: {
      name: workerName,
      email: booking.worker_details?.email || booking.worker?.email || booking.worker_email,
      phone: booking.worker_details?.phone || booking.worker?.phone || booking.worker_phone,
      location: booking.worker_details?.location || booking.worker?.location || booking.worker_location,
      hourly_rate: booking.worker_details?.hourly_rate || booking.worker?.hourly_rate || booking.hourly_rate,
      skills: Array.isArray(booking.skills)
        ? booking.skills
        : typeof booking.skills === 'string'
        ? JSON.parse(booking.skills)
        : [],
      rating: parsedRating,
      total_reviews: booking.total_reviews || booking.worker_details?.total_reviews || 0,
      total_amount: booking.total_amount, // Ensure this is included
    },
  };

          // Log the final mapped booking
          console.log('Final Mapped Booking:', {
            id: mappedBooking.id,
            workerName: mappedBooking.workerName,
            worker_details: mappedBooking.worker_details,
            platform_fee: mappedBooking.platform_fee,
          });
        
          return mappedBooking;
        });

        // Log each booking after mapping
        mappedBookings.forEach((booking: Booking, index: number) => {
          console.log(`Mapped Booking ${index + 1} Final Details:`, {
            id: booking.id,
            workerName: booking.workerName,
            worker_details_name: booking.worker_details?.name,
            status: booking.status,
            workerDetails: booking.worker_details
          });
        });

        setBookings(mappedBookings);
      } catch (error) {
        if (axios.isAxiosError(error) && error.response?.data) {
          console.error('Server Error Details:', error.response.data);
          
          // Check for specific SQL error in the catch block as well
          if (error.response.data.error && error.response.data.error.includes("Unknown column 'wp.service_description'")) {
            toast.error('System is temporarily unavailable. Our team has been notified.');
            console.error('SQL Error: service_description column missing in worker_profiles table');
            return;
          }
          
          toast.error(error.response.data.message || 'Failed to fetch bookings');
        } else {
          console.error('Bookings Fetch Error:', error);
          toast.error('Failed to fetch bookings');
        }
      }
    };

    fetchBookings();
  }, [router]);

  const handleLogout = () => {
    // Clear user data and token
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    
    // Redirect to login
    router.push('/auth/login');
  };

  if (!user) {
    return null; // or a loading spinner
  }

  // Filter bookings based on active tab
  const filteredBookings = bookings.filter(booking => {
    if (activeTab === 'all') return true;
    if (activeTab === 'pending') return booking.status === 'pending';
    if (activeTab === 'confirmed') return booking.status === 'confirmed' || booking.status === 'accepted';
    if (activeTab === 'completed') return booking.status === 'completed';
    if (activeTab === 'rejected') return booking.status === 'rejected' || booking.status === 'cancelled';
    return true;
  });

  // Calculate statistics for the dashboard
  const stats = {
    total: bookings.length,
    pending: bookings.filter(booking => booking.status === 'pending').length,
    confirmed: bookings.filter(booking => booking.status === 'confirmed' || booking.status === 'accepted').length,
    completed: bookings.filter(booking => booking.status === 'completed').length,
    rejected: bookings.filter(booking => booking.status === 'rejected' || booking.status === 'cancelled').length
  };

  function handleMarkAsCompleted(booking: Booking) {
    alert("Marked as complete");
    // Add logic to display the payment form
    setShowPaymentForm(true);
    throw new Error('Function not implemented.');
  }
  
  function handlePayment(booking: Booking) {
    // Check if the booking is in the right status to process a payment
    if (booking.status !== 'confirmed') {
      toast.error(`Cannot process payment for booking in '${booking.status}' status. Only confirmed bookings can be paid.`);
      return;
    }

    const bookingId = booking.id;
    console.log(`Processing payment for booking ${bookingId}`);
    
    // Check if this booking is already paid (just in case)
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('You need to be logged in to make payments');
      return;
    }

    // We'll proceed with showing the payment form
    setCurrentBooking(booking);
    setPaymentVisible(true);
  }

  function handleLeaveReview(booking: Booking) {
    // Check if the booking is in the right status to leave a review
    if (booking.status !== 'completed') {
      toast.error(`Cannot leave a review for booking in '${booking.status}' status. Only completed bookings can be reviewed.`);
      return;
    }

    const bookingId = booking.id;
    const workerId = booking.workerId || booking.worker_id;
    
    if (!workerId) {
      toast.error('Worker information not available');
      return;
    }
    
    console.log(`Opening review for booking ${bookingId}, worker ${workerId}`);
    
    // Open the review modal
    setBookingToReview(booking);
    setIsReviewModalOpen(true);
  }
  
  function handleReviewComplete() {
    setIsReviewModalOpen(false);
    setBookingToReview(null);
    
    // Refresh bookings to update reviews count
    const refreshBookings = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        
        const response = await axios.get('http://localhost:3002/api/bookings/customer', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.data.status === 'success') {
          // Same mapping logic as before - map the bookings
          const mappedBookings = response.data.data.map((booking: any) => {
            const workerName =
              booking.worker_details?.name ||
              booking.worker?.full_name ||
              booking.worker?.name ||
              booking.worker_name ||
              booking.workerName ||
              booking.full_name ||
              'Unknown Worker';
            
            const rating = booking.worker_rating || booking.worker_details?.rating;
            const parsedRating = rating !== undefined && rating !== null ? Number(rating) : undefined;
            const platformFee = Number(booking.platform_fee) || 0;
            
            return {
              ...booking,
              workerName: workerName,
              customer_id: booking.customer_id,
              platform_fee: platformFee,
              worker_details: {
                name: workerName,
                email: booking.worker_details?.email || booking.worker?.email || booking.worker_email,
                phone: booking.worker_details?.phone || booking.worker?.phone || booking.worker_phone,
                location: booking.worker_details?.location || booking.worker?.location || booking.worker_location,
                hourly_rate: booking.worker_details?.hourly_rate || booking.worker?.hourly_rate || booking.hourly_rate,
                skills: Array.isArray(booking.skills)
                  ? booking.skills
                  : typeof booking.skills === 'string'
                  ? JSON.parse(booking.skills)
                  : [],
                rating: parsedRating,
                total_reviews: booking.total_reviews || booking.worker_details?.total_reviews || 0,
                total_amount: booking.total_amount,
              },
            };
          });
          
          setBookings(mappedBookings);
        }
      } catch (error) {
        console.error('Error refreshing bookings:', error);
        toast.error('Could not refresh bookings');
      }
    };
    
    refreshBookings();
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 py-6 sm:py-12 px-3 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white/80 backdrop-blur-lg shadow-2xl rounded-2xl border border-gray-100 overflow-hidden">
          {/* Header Section */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-4 sm:p-8">
            <div className="flex flex-col space-y-4">
              <div>
                <h1 className="text-2xl sm:text-4xl font-bold tracking-tight">
                  Welcome, {user.fullName}
                </h1>
                <p className="text-indigo-100 mt-2 text-base sm:text-lg">
                  Your Personal Service Booking Dashboard
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <a 
                  href="/dashboard/services" 
                  className="bg-white/10 backdrop-blur-sm text-white px-4 sm:px-6 py-2 sm:py-3 rounded-xl hover:bg-white/20 transition-all duration-300 flex items-center justify-center space-x-2 border border-white/20"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V8z" clipRule="evenodd" />
                  </svg>
                  <span>Services</span>
                </a>
                <a 
                  href="/customer/search" 
                  className="bg-white/10 backdrop-blur-sm text-white px-4 sm:px-6 py-2 sm:py-3 rounded-xl hover:bg-white/20 transition-all duration-300 flex items-center justify-center space-x-2 border border-white/20"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M9 9a2 2 0 114 0 2 2 0 01-4 0z" />
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a4 4 0 00-3.446 6.032l-2.261 2.26a1 1 0 101.414 1.415l2.261-2.261A4 4 0 1011 5z" clipRule="evenodd" />
                  </svg>
                  <span>Find Workers</span>
                </a>
                <button 
                  onClick={handleLogout}
                  className="bg-red-500/90 hover:bg-red-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-xl transition-all duration-300 flex items-center justify-center space-x-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 1.293a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 01-1.414-1.414L14.586 11H7a1 1 0 110-2h7.586l-1.293-1.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </div>

          {/* Stats Section */}
          <div className="p-4 sm:p-8 bg-white/50 backdrop-blur-sm border-b border-gray-100">
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-6">
              <div 
                className={`bg-white p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow-sm border-l-4 border-indigo-500 cursor-pointer transition-all duration-300 hover:shadow-md ${activeTab === 'all' ? 'ring-2 ring-indigo-400' : ''}`}
                onClick={() => setActiveTab('all')}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm text-gray-500 font-medium">All Bookings</p>
                    <p className="text-xl sm:text-3xl font-bold text-gray-900 mt-1">{stats.total}</p>
                  </div>
                  <div className="bg-indigo-50 p-2 sm:p-3 rounded-lg sm:rounded-xl">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 sm:h-8 sm:w-8 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                </div>
              </div>
              
              <div 
                className={`bg-white p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow-sm border-l-4 border-yellow-500 cursor-pointer transition-all duration-300 hover:shadow-md ${activeTab === 'pending' ? 'ring-2 ring-yellow-400' : ''}`}
                onClick={() => setActiveTab('pending')}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm text-gray-500 font-medium">Pending</p>
                    <p className="text-xl sm:text-3xl font-bold text-gray-900 mt-1">{stats.pending}</p>
                  </div>
                  <div className="bg-yellow-50 p-2 sm:p-3 rounded-lg sm:rounded-xl">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>
              
              <div 
                className={`bg-white p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow-sm border-l-4 border-blue-500 cursor-pointer transition-all duration-300 hover:shadow-md ${activeTab === 'confirmed' ? 'ring-2 ring-blue-400' : ''}`}
                onClick={() => setActiveTab('confirmed')}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm text-gray-500 font-medium">Confirmed</p>
                    <p className="text-xl sm:text-3xl font-bold text-gray-900 mt-1">{stats.confirmed}</p>
                  </div>
                  <div className="bg-blue-50 p-2 sm:p-3 rounded-lg sm:rounded-xl">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>
              
              <div 
                className={`bg-white p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow-sm border-l-4 border-green-500 cursor-pointer transition-all duration-300 hover:shadow-md ${activeTab === 'completed' ? 'ring-2 ring-green-400' : ''}`}
                onClick={() => setActiveTab('completed')}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm text-gray-500 font-medium">Completed</p>
                    <p className="text-xl sm:text-3xl font-bold text-gray-900 mt-1">{stats.completed}</p>
                  </div>
                  <div className="bg-green-50 p-2 sm:p-3 rounded-lg sm:rounded-xl">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 sm:h-8 sm:w-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
              </div>
              
              <div 
                className={`bg-white p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow-sm border-l-4 border-red-500 cursor-pointer transition-all duration-300 hover:shadow-md ${activeTab === 'rejected' ? 'ring-2 ring-red-400' : ''}`}
                onClick={() => setActiveTab('rejected')}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm text-gray-500 font-medium">Rejected/Cancelled</p>
                    <p className="text-xl sm:text-3xl font-bold text-gray-900 mt-1">{stats.rejected}</p>
                  </div>
                  <div className="bg-red-50 p-2 sm:p-3 rounded-lg sm:rounded-xl">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 sm:h-8 sm:w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bookings List Section */}
          <div className="p-4 sm:p-8">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">
              {activeTab === 'all' && 'All Bookings'}
              {activeTab === 'pending' && 'Pending Bookings'}
              {activeTab === 'confirmed' && 'Confirmed Bookings'}
              {activeTab === 'completed' && 'Completed Bookings'}
              {activeTab === 'rejected' && 'Rejected/Cancelled Bookings'}
            </h2>
            
            {filteredBookings.length === 0 ? (
              <div className="text-center bg-white/50 backdrop-blur-sm rounded-xl sm:rounded-2xl p-6 sm:p-12 border border-gray-100">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-16 w-16 sm:h-20 sm:w-20 mx-auto mb-4 text-gray-400" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" 
                  />
                </svg>
                <h2 className="text-lg sm:text-xl font-semibold text-gray-700 mb-2">No {activeTab !== 'all' ? activeTab : ''} Bookings Found</h2>
                <p className="text-sm sm:text-base text-gray-500 mb-4 sm:mb-6">
                  {activeTab === 'all' && 'Start exploring and booking services to see them here.'}
                  {activeTab === 'pending' && 'You don\'t have any pending bookings at the moment.'}
                  {activeTab === 'confirmed' && 'No confirmed bookings available yet.'}
                  {activeTab === 'completed' && 'You haven\'t completed any bookings yet.'}
                  {activeTab === 'rejected' && 'No rejected or cancelled bookings.'}
                </p>
                <a 
                  href="/customer/search" 
                  className="inline-block bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl text-sm sm:text-base"
                >
                  Find Workers
                </a>
              </div>
            ) : (
              <div className="space-y-4 sm:space-y-6">
                {filteredBookings.map((booking) => (
                  <div 
                    key={booking.id} 
                    className="bg-white/80 backdrop-blur-sm shadow-lg rounded-xl sm:rounded-2xl p-4 sm:p-8 border border-gray-100 hover:shadow-xl transition-all duration-300"
                  >
                    <div className="flex flex-col gap-4 sm:gap-6">
                      <div className="flex-1">
                        <div className="flex items-center mb-4">
                          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-indigo-100 rounded-xl sm:rounded-2xl flex items-center justify-center mr-4">
                            <svg 
                              xmlns="http://www.w3.org/2000/svg" 
                              className="h-6 w-6 sm:h-7 sm:w-7 text-indigo-600" 
                              viewBox="0 0 20 20" 
                              fill="currentColor"
                            >
                              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div>
                            <h3 className="text-lg sm:text-xl font-bold text-gray-900">
                              {booking.worker_details?.name || booking.workerName || booking.worker_name || 'Unknown Worker'}
                            </h3>
                            <p className="text-sm sm:text-base text-gray-500 flex items-center flex-wrap gap-2">
                              {booking.serviceType || booking.service_type} Service
                              {booking.worker_details?.rating !== undefined && booking.worker_details?.rating !== null && (
                                <span className="inline-flex items-center bg-yellow-50 px-2 sm:px-3 py-1 rounded-full">
                                  <svg 
                                    xmlns="http://www.w3.org/2000/svg" 
                                    className="h-4 w-4 text-yellow-500 mr-1" 
                                    viewBox="0 0 20 20" 
                                    fill="currentColor"
                                  >
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                  </svg>
                                  {Number(booking.worker_details.rating).toFixed(1)}
                                  <span className="text-xs text-gray-500 ml-1">
                                    ({booking.worker_details.total_reviews || 0} reviews)
                                  </span>
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mt-4">
                          <div className="bg-gray-50 p-3 sm:p-4 rounded-xl">
                            <p className="text-xs sm:text-sm text-gray-500">Date & Time</p>
                            <p className="text-sm sm:text-base text-gray-900 font-medium">
                              {booking.bookingDate || booking.booking_date} | {booking.startTime || booking.start_time} - {booking.endTime || booking.end_time}
                            </p>
                          </div>
                          
                          {(booking.worker_details?.location || 'Location not available') && (
                            <div className="bg-gray-50 p-3 sm:p-4 rounded-xl">
                              <p className="text-xs sm:text-sm text-gray-500">Location</p>
                              <p className="text-sm sm:text-base text-gray-900 font-medium">
                                {booking.worker_details?.location || 'Not specified'}
                              </p>
                            </div>
                          )}
                          
                          {(booking.worker_details?.phone || 'Phone not available') && (
                            <div className="bg-gray-50 p-3 sm:p-4 rounded-xl">
                              <p className="text-xs sm:text-sm text-gray-500">Contact</p>
                              <p className="text-sm sm:text-base text-gray-900 font-medium">
                                {booking.worker_details?.phone || 'Not provided'}
                              </p>
                            </div>
                          )}
                          
                          {booking.worker_details?.skills && booking.worker_details.skills.length > 0 && (
                            <div className="bg-gray-50 p-3 sm:p-4 rounded-xl">
                              <p className="text-xs sm:text-sm text-gray-500">Skills</p>
                              <p className="text-sm sm:text-base text-gray-900 font-medium">
                                {booking.worker_details.skills.join(', ')}
                              </p>
                            </div>
                          )}
                        </div>
                        
                        {(booking.description || booking.worker_details?.service_description) && (
                          <div className="mt-4 bg-indigo-50 p-4 sm:p-6 rounded-xl">
                            <p className="text-sm sm:text-base text-indigo-600 font-medium">Service Description</p>
                            <p className="text-gray-700 mt-1">
                              {booking.description || booking.worker_details?.service_description}
                            </p>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-4">
                        <span 
                          className={`px-3 sm:px-4 py-1 sm:py-2 rounded-full text-xs sm:text-sm font-semibold ${
                            booking.status === 'completed' ? 'bg-green-100 text-green-800' :
                            booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            booking.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                            booking.status === 'accepted' ? 'bg-blue-100 text-blue-800' :
                            'bg-red-100 text-red-800'
                          }`}
                        >
                          {booking.status}
                        </span>
                        
                        {booking.status === 'completed' && (
                          <button 
                            className="bg-indigo-600 text-white px-4 sm:px-6 py-2 rounded-xl hover:bg-indigo-700 transition-all duration-300 flex items-center justify-center space-x-2 text-sm sm:text-base"
                            onClick={() => handleLeaveReview(booking)}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                            <span>Leave Review</span>
                          </button>
                        )}
                        
                        {booking.status === 'confirmed' && (
                          <button 
                            className="bg-green-600 text-white px-4 sm:px-6 py-2 rounded-xl hover:bg-green-700 transition-all duration-300 flex items-center justify-center space-x-2 text-sm sm:text-base"
                            onClick={() => handlePayment(booking)}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            <span>Mark as Complete</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Booking History Section */}
          {activeTab === 'all' && bookings.length > 0 && (
            <div className="p-4 sm:p-8">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 sm:mb-6 border-t pt-6 sm:pt-8">Recent Booking History</h2>
              
              <div className="bg-white/80 backdrop-blur-sm shadow-lg rounded-xl sm:rounded-2xl overflow-hidden border border-gray-100">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Worker
                        </th>
                        <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Service
                        </th>
                        <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {bookings.slice(0, 5).map((booking) => (
                        <tr key={`history-${booking.id}`} className="hover:bg-gray-50 transition-colors duration-200">
                          <td className="px-4 sm:px-6 py-3 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {booking.worker_details?.name || booking.workerName || booking.worker_name || 'Unknown Worker'}
                            </div>
                          </td>
                          <td className="px-4 sm:px-6 py-3 whitespace-nowrap">
                            <div className="text-sm text-gray-500">{booking.serviceType || booking.service_type}</div>
                          </td>
                          <td className="px-4 sm:px-6 py-3 whitespace-nowrap">
                            <div className="text-sm text-gray-500">{booking.bookingDate || booking.booking_date}</div>
                          </td>
                          <td className="px-4 sm:px-6 py-3 whitespace-nowrap">
                            <span className={`px-2 sm:px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              booking.status === 'completed' ? 'bg-green-100 text-green-800' :
                              booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              booking.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                              booking.status === 'accepted' ? 'bg-blue-100 text-blue-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {booking.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function setShowPaymentForm(arg0: boolean) {
  throw new Error('Function not implemented.');
}
