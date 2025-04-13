'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import axios, { AxiosError } from 'axios';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { SERVICE_TYPES, SERVICE_TYPES_DISPLAY, SERVICE_TYPES_ARRAY, ServiceType } from '@/app/constants/services';
import ServiceDetailsModal from '@/app/components/ServiceDetailsModal';
import BookingModal from '@/app/components/BookingModal';

interface Worker {
  id: string;
  user_id: number;
  service_type: ServiceType;
  experience_years: number;
  hourly_rate: string;
  location: string;
  description: string;
  availability: number | boolean;
  rating: string;
  total_reviews: number;
  full_name: string;
  email: string;
  phone: string;
}

// No need for format functions anymore since we're using the correct format already
const formatServiceTypeForApi = (serviceType: string): string => serviceType;
const convertApiServiceTypeToDisplay = (apiServiceType: string): string => 
  SERVICE_TYPES_DISPLAY[apiServiceType as keyof typeof SERVICE_TYPES_DISPLAY] || apiServiceType;

export default function WorkerSearchPage() {
  const router = useRouter();
  const [workers, setWorkers] = useState<Worker[]>([]);
  const { register, handleSubmit, watch, formState: { errors }, setValue } = useForm({
    defaultValues: {
      serviceType: '',
      location: '',
      maxHourlyRate: ''
    }
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchPerformed, setSearchPerformed] = useState(false);
  const [token, setToken] = useState('');
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);

  const handleServiceSearch = (selectedServiceType: string) => {
    setValue('serviceType', selectedServiceType);
    const element = document.getElementById('location');
    if (element) {
      element.focus();
    }
  };

  const getValidationMessage = (): string => {
    if (!token) return 'Please log in to search for workers';
    return '';
  };

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      setToken(storedToken);
    }
  }, []);

  const searchWorkers = async (searchData: { serviceType: string; location: string }) => {
    try {
      setSearchPerformed(true);
      setError(null);
      setIsLoading(true);

      // Ensure we're using the correct service type format
      const serviceType = searchData.serviceType.toLowerCase();
      const location = searchData.location.trim();

      console.log('Searching with params:', { serviceType, location });

      const response = await axios.get(`http://localhost:3002/api/worker/search`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        params: {
          serviceType: serviceType,
          location: location
        }
      });

      console.log('Search response:', response.data);

      if (!response.data || !response.data.data) {
        throw new Error('Invalid response format from server');
      }

      const workersData = Array.isArray(response.data.data) ? response.data.data : [response.data.data];
      console.log('Raw workers data from API:', workersData);

      if (workersData.length === 0) {
        setWorkers([]);
        toast.success(`No workers available for ${serviceType} in ${location}`);
        return;
      }

      const sanitizedWorkers = workersData.map((worker: any) => {
        console.log('Raw worker data:', worker); // Add detailed logging
        
        // Log specific fields to debug
        console.log('Experience data:', {
          experienceYears: worker.experienceYears,
          experience_years: worker.experience_years,
          experience: worker.experience
        });
        
        return {
          id: worker.id || worker.user_id || '',
          user_id: worker.user_id || worker.id,
          full_name: worker.full_name || worker.name || 'Unnamed Worker',
          service_type: worker.service_type || serviceType,
          hourly_rate: worker.hourlyRate || worker.hourly_rate || '0',
          experience_years: worker.experience !== undefined ? Number(worker.experience) :
                           Number(worker.experienceYears || worker.experience_years || 0),
          location: worker.location || location,
          description: worker.description || '',
          availability: worker.availability === undefined ? true : Boolean(worker.availability),
          rating: worker.rating ? String(worker.rating) : '0',
          total_reviews: Number(worker.total_reviews || 0),
          email: worker.email || '',
          phone: worker.phone || ''
        };
      });

      console.log('Processed workers:', sanitizedWorkers);
      setWorkers(sanitizedWorkers);
      toast.success(`Found ${sanitizedWorkers.length} worker(s) in ${location}`);

    } catch (error: any) {
      console.error('Search Error:', error);
      setWorkers([]);
      
      let errorMessage = 'Failed to fetch workers. Please try again.';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
      toast.error(errorMessage);

      // Log detailed error information
      if (error.response) {
        console.log('Error Response:', {
          status: error.response.status,
          data: error.response.data,
          headers: error.response.headers
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const onSearchSubmit = async (data: any) => {
    if (!token) {
      toast.error('Please log in to search for workers');
      router.push('/auth/login');
      return;
    }

    const trimmedData = {
      serviceType: data.serviceType.trim(),
      location: data.location.trim()
    };

    console.log('Form submission data:', trimmedData);

    if (!trimmedData.serviceType) {
      toast.error('Please select a service type');
      return;
    }

    if (!trimmedData.location) {
      toast.error('Please enter a location');
      return;
    }

    await searchWorkers(trimmedData);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-center">Find Workers</h1>
      
      {/* Service Type Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {SERVICE_TYPES_ARRAY.map((service) => (
          <button
            key={service}
            onClick={() => setSelectedService(service)}
            className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow text-center group"
          >
            <div className="text-4xl mb-3 transform group-hover:scale-110 transition-transform">
              {service === 'home_cleaning' && '🧹'}
              {service === 'plumbing' && '🔧'}
              {service === 'electrical_work' && '⚡'}
              {service === 'painting' && '🎨'}
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              {SERVICE_TYPES_DISPLAY[service as keyof typeof SERVICE_TYPES_DISPLAY]}
            </h3>
            <p className="text-sm text-gray-600">
              Click to learn more about our {SERVICE_TYPES_DISPLAY[service as keyof typeof SERVICE_TYPES_DISPLAY].toLowerCase()} services
            </p>
          </button>
        ))}
      </div>

      {/* Service Details Modal */}
      {selectedService && (
        <ServiceDetailsModal
          serviceType={selectedService}
          onClose={() => setSelectedService(null)}
          onSearch={handleServiceSearch}
        />
      )}
      
      <form onSubmit={handleSubmit(onSearchSubmit)} className="max-w-xl mx-auto mb-8 bg-white shadow-md rounded-lg p-6">
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label htmlFor="serviceType" className="block text-sm font-medium text-gray-700">
              Service Type <span className="text-red-500">*</span>
            </label>
            <select 
              {...register('serviceType', { 
                required: 'Please select a service type'
              })} 
              id="serviceType" 
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200"
            >
              <option value="">Select a Service</option>
              {SERVICE_TYPES_ARRAY.map((service) => (
                <option key={service} value={service}>
                  {SERVICE_TYPES_DISPLAY[service as keyof typeof SERVICE_TYPES_DISPLAY]}
                </option>
              ))}
            </select>
            {errors.serviceType && (
              <p className="mt-1 text-sm text-red-600">{errors.serviceType.message}</p>
            )}
          </div>
          
          <div>
            <label htmlFor="location" className="block text-sm font-medium text-gray-700">
              Location <span className="text-red-500">*</span>
              <span className="text-xs text-gray-500 ml-1">(Available: Chennai, Bengaluru, Madurai)</span>
            </label>
            <input 
              {...register('location', { 
                required: 'Please enter a location',
                setValueAs: value => value.trim()
              })} 
              id="location" 
              type="text" 
              placeholder="Enter location" 
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200"
              list="availableLocations"
            />
            <datalist id="availableLocations">
              {['Chennai', 'Bengaluru', 'Madurai'].map(loc => (
                <option key={loc} value={loc} />
              ))}
            </datalist>
            {errors.location && (
              <p className="mt-1 text-sm text-red-600">{errors.location.message}</p>
            )}
          </div>
          
          <div>
            <label htmlFor="maxHourlyRate" className="block text-sm font-medium text-gray-700">
              Max Hourly Rate (Optional)
              <span className="text-xs text-gray-500 ml-1">(Leave empty to see all rates)</span>
            </label>
            <input 
              {...register('maxHourlyRate')} 
              id="maxHourlyRate" 
              type="number" 
              placeholder="Enter maximum hourly rate (optional)" 
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200"
            />
          </div>
        </div>
        
        <div className="mt-6 text-center">
          <button 
            type="submit" 
            disabled={isLoading || !!getValidationMessage()}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition duration-300 disabled:opacity-50"
          >
            {isLoading ? 'Searching...' : 'Search Workers'}
          </button>
          {getValidationMessage() && (
            <p className="mt-2 text-sm text-red-600">{getValidationMessage()}</p>
          )}
        </div>
      </form>

      {/* Search Tips */}
      <div className="max-w-xl mx-auto mb-8 bg-blue-50 p-4 rounded-lg">
        <h3 className="font-semibold text-blue-800 mb-2">Search Tips:</h3>
        <ul className="text-sm text-blue-700 list-disc list-inside">
          <li>Select a service type to find relevant workers</li>
          <li>Enter your location to find workers in your area</li>
          <li>Hourly rate is optional - leave it empty to see all available workers</li>
          <li>Workers are shown based on their availability and rating</li>
        </ul>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center items-center mt-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="max-w-xl mx-auto bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      {/* No Results State */}
      {searchPerformed && !isLoading && !error && workers.length === 0 && (
        <div className="text-center text-gray-500 mt-12">
          <div className="flex justify-center mb-4">
            <span className="text-4xl">🔍</span>
          </div>
          <p className="text-xl font-semibold mb-3">No Workers Available</p>
          <p className="text-base mb-4">We couldn't find any workers matching your search criteria.</p>
          <div className="bg-blue-50 p-4 rounded-lg inline-block">
            <p className="text-sm font-medium text-blue-800 mb-2">Suggestions:</p>
            <ul className="text-sm text-blue-700 list-disc list-inside">
              <li>Try a different location (Available: Chennai, Bengaluru, Madurai)</li>
              <li>Check if the service type is available in your area</li>
              <li>Try searching again later as new workers may become available</li>
            </ul>
          </div>
        </div>
      )}

      {/* Workers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
        {workers.map((worker) => (
          <div 
            key={worker.id} 
            className="bg-white shadow-md rounded-lg p-6 hover:shadow-lg transition duration-300"
          >
            <div className="flex items-center mb-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                <span className="text-2xl font-bold text-blue-600">
                  {worker.full_name ? worker.full_name.charAt(0) : '?'}
                </span>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {worker.full_name}
                </h2>
                <p className="text-sm text-gray-500">{worker.service_type}</p>
              </div>
            </div>
            
            <div className="space-y-2 mb-4">
              <div className="flex items-center text-sm text-gray-600">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-5 w-5 mr-2 text-blue-500" 
                  viewBox="0 0 20 20" 
                  fill="currentColor"
                >
                  <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3z" />
                </svg>
                <span className="font-medium">
                  {worker.experience_years > 0 
                    ? `${worker.experience_years} ${worker.experience_years === 1 ? 'Year' : 'Years'} Experience` 
                    : 'Experience information unavailable'}
                </span>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-5 w-5 mr-2 text-blue-500" 
                  viewBox="0 0 20 20" 
                  fill="currentColor"
                >
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
                <span className="font-medium text-green-700">₹{worker.hourly_rate}/hr</span>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-5 w-5 mr-2 text-red-500" 
                  viewBox="0 0 20 20" 
                  fill="currentColor"
                >
                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
                {worker.location}
              </div>
              <p className="text-sm text-gray-500">{worker.service_type}</p>
            </div>

            {worker.description && (
              <div className="bg-gray-50 p-3 rounded-md mb-4">
                <p className="text-sm text-gray-600 italic">"{worker.description}"</p>
              </div>
            )}

            <div className="mt-4 flex justify-between items-center">
              <button 
                type="button"
                onClick={() => {
                  console.log('Book Now clicked for worker:', worker);
                  if (!token) {
                    toast.error('Please log in to book a service');
                    router.push('/auth/login');
                    return;
                  }
                  console.log('Setting selected worker with data:', {
                    id: worker.id,
                    full_name: worker.full_name,
                    service_type: worker.service_type,
                    hourly_rate: worker.hourly_rate,
                    experience_years: worker.experience_years
                  });
                  setSelectedWorker(worker);
                }}
                className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition duration-300"
              >
                Book Now
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Booking Modal */}
      {selectedWorker && (
        <BookingModal
          worker={{
            id: selectedWorker.id,
            full_name: selectedWorker.full_name,
            service_type: selectedWorker.service_type || 'home_cleaning',
            hourly_rate: selectedWorker.hourly_rate || '0',
            experience_years: selectedWorker.experience_years || 0
          }}
          onClose={() => {
            console.log('Closing booking modal');
            setSelectedWorker(null);
          }}
          onSuccess={() => {
            console.log('Booking successful');
            toast.success('Booking created! Redirecting to dashboard...');
            router.push('/customer/dashboard');
          }}
        />
      )}
    </div>
  );
} 


//  updated code


